from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy import delete as sa_delete
from typing import List, Dict
import re
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

from ..database import get_session
from ..models import Employee, Project, Task, Allocation, Organization
from ..schemas import ProjectRead, AllocationResult, TeamMember, TaskRead
from ..utils.embedding import get_embedding
from ..utils.gemini import generate_tasks, extract_required_skills_from_task
from ..utils.optimization import allocate_team
from ..utils.auth import get_current_org
from ..utils.pdf import parse_pdf
from ..utils.s3 import upload_file_to_s3, generate_presigned_url
from ..utils.email import send_allocation_notification

router = APIRouter(prefix="/projects", tags=["projects"])


def _clean_task_description(text: str) -> str:
    """Remove NumPy-style artifacts from Gemini-generated task descriptions."""
    text = re.sub(r"\bnp\.(float|int|double|complex)\d*\([^)]*\)", "", text)
    text = re.sub(r"\bnp\.\w+\b", "", text)
    text = re.sub(r"\b\d+\.\d{2,3}\b", "", text)
    return re.sub(r"\s+", " ", text).strip()


# ── Create Project ────────────────────────────────────────────────────────────

@router.post("", response_model=ProjectRead)
async def create_project(
    required_team_size: int = Form(...),
    project_load: float = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are allowed")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "File too large. Maximum size is 10MB.")
        
    project_title = file.filename.rsplit('.', 1)[0]
    custom_name = f"{project_title.replace(' ', '_').lower()}_project"
    
    # Enforce distinctive project names for the organization
    existing_proj = session.exec(
        select(Project).where(
            Project.organization_id == org.id,
            Project.document_url.like(f"%{custom_name}%")
        )
    ).first()
    if existing_proj:
        raise HTTPException(status_code=400, detail="A project with this name already exists. Project names must be distinct.")
        
    text = parse_pdf(content)

    if not text:
        raise HTTPException(400, "No text could be extracted from the PDF")

    embed_text = text[:30000]
    embedding = get_embedding(embed_text)

    # Upload to S3
    document_url = upload_file_to_s3(content, file.filename, folder="projects", custom_filename=custom_name)

    db_project = Project(
        organization_id=org.id,
        description=text,
        required_team_size=required_team_size,
        project_load=project_load,
        embedding=embedding,
        document_url=document_url,
    )
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    
    result = ProjectRead.model_validate(db_project)
    if result.document_url and not result.document_url.startswith("http"):
        result.document_url = generate_presigned_url(result.document_url)
    return result


# ── List Projects ─────────────────────────────────────────────────────────────

@router.get("", response_model=List[ProjectRead])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    projects = session.exec(select(Project).where(Project.organization_id == org.id).offset(skip).limit(limit)).all()
    results = []
    for p in projects:
        p_read = ProjectRead.model_validate(p)
        if p_read.document_url and not p_read.document_url.startswith("http"):
            p_read.document_url = generate_presigned_url(p_read.document_url)
            
        allocs = session.exec(select(Allocation.is_final).where(Allocation.project_id == p.id)).all()
        if not allocs:
            p_read.status = "Unallocated"
        elif all(is_final for is_final in allocs):
            p_read.status = "Active"
        else:
            p_read.status = "Pending Review"
            
        results.append(p_read)
    return results


@router.get("/allocated", response_model=List[ProjectRead])
def get_allocated_projects(
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    stmt = select(Project).where(
        Project.id.in_(select(Allocation.project_id).distinct())
    ).where(Project.organization_id == org.id)
    
    projects = session.exec(stmt).all()
    results = []
    for p in projects:
        p_read = ProjectRead.model_validate(p)
        if p_read.document_url and not p_read.document_url.startswith("http"):
            p_read.document_url = generate_presigned_url(p_read.document_url)
        results.append(p_read)
    return results


# ── Delete Project ─────────────────────────────────────────────────────────────

@router.delete("/{project_id}")
def delete_project(
    project_id: int, 
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    project = session.get(Project, project_id)
    if not project or project.organization_id != org.id:
        raise HTTPException(404, "Project not found")

    allocations = session.exec(select(Allocation).where(Allocation.project_id == project_id)).all()
    for alloc in allocations:
        emp = session.get(Employee, alloc.employee_id)
        if emp:
            before = emp.current_workload
            emp.current_workload = max(0.0, round(emp.current_workload - project.project_load, 2))
            
    session.flush()

    session.exec(sa_delete(Allocation).where(Allocation.project_id == project_id))
    session.exec(sa_delete(Task).where(Task.project_id == project_id))
    session.delete(project)
    session.commit()
    return {"message": f"Project {project_id} deleted successfully"}


# ── Project Tasks & Team ──────────────────────────────────────────────────────

@router.get("/{project_id}/tasks", response_model=List[TaskRead])
def get_project_tasks(
    project_id: int, 
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    project = session.get(Project, project_id)
    if not project or project.organization_id != org.id:
        raise HTTPException(404, "Project not found")
        
    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    return [
        TaskRead(
            id=t.id,
            role=t.role,
            task_description=t.task_description,
            required_skills=json.loads(t.required_skills) if t.required_skills else [],
        )
        for t in tasks
    ]


@router.get("/{project_id}/team", response_model=List[Dict])
def get_project_team(
    project_id: int, 
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    project = session.get(Project, project_id)
    if not project or project.organization_id != org.id:
        raise HTTPException(404, "Project not found")
        
    allocs = session.exec(select(Allocation).where(Allocation.project_id == project_id)).all()
    if not allocs:
        raise HTTPException(404, "No team allocated for this project")

    result = []
    for alloc in allocs:
        emp = session.get(Employee, alloc.employee_id)
        task = session.get(Task, alloc.task_id) if alloc.task_id else None
        matched = json.loads(alloc.matched_skills) if alloc.matched_skills else []
        missing = json.loads(alloc.missing_skills) if alloc.missing_skills else []
        result.append({
            "employee_id": alloc.employee_id,
            "employee_name": emp.name if emp and emp.name else "Unknown",
            "role": task.role if task else alloc.role,
            "task_description": task.task_description if task else alloc.task_description or "",
            "similarity": alloc.similarity,
            "workload_after": alloc.workload_after,
            "matched_skills": matched,
            "missing_skills": missing,
            "is_final": alloc.is_final,
        })
    return result


# ── Allocate Team ─────────────────────────────────────────────────────────────

@router.post("/{project_id}/allocate", response_model=AllocationResult)
def allocate_team_endpoint(
    project_id: int, 
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    project = session.get(Project, project_id)
    if not project or project.organization_id != org.id:
        raise HTTPException(404, "Project not found")

    # Restore workloads flush
    # Restore workloads ONLY if existing allocations were final
    existing = session.exec(select(Allocation).where(Allocation.project_id == project_id)).all()
    for a in existing:
        if a.is_final:
            emp = session.get(Employee, a.employee_id)
            if emp:
                emp.current_workload = max(0.0, round(emp.current_workload - project.project_load, 2))

    session.flush()

    session.exec(sa_delete(Allocation).where(Allocation.project_id == project_id))
    session.exec(sa_delete(Task).where(Task.project_id == project_id))
    session.commit()

    try:
        raw_tasks = generate_tasks(project.description, project.required_team_size)
    except Exception as e:
        return AllocationResult(status="error", reason=str(e))

    skills_per_task: List[List[str]] = [[] for _ in raw_tasks]
    with ThreadPoolExecutor(max_workers=min(len(raw_tasks), 5)) as executor:
        future_to_idx = {
            executor.submit(extract_required_skills_from_task, t["role"], t["task_description"]): i
            for i, t in enumerate(raw_tasks)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                skills_per_task[idx] = future.result()
            except Exception as e:
                print(f"[LOG] Skill extraction failed for task {idx}: {e}")

    task_objs = []
    for i, t in enumerate(raw_tasks):
        task_obj = Task(
            project_id=project_id,
            role=t["role"],
            task_description=_clean_task_description(t["task_description"]),
            required_skills=json.dumps(skills_per_task[i]),
        )
        session.add(task_obj)
        task_objs.append(task_obj)
    session.commit()
    for t in task_objs:
        session.refresh(t)

    precomputed_tasks = [
        {
            "role": t.role,
            "task_description": t.task_description,
            "required_skills": skills_per_task[i],
        }
        for i, t in enumerate(task_objs)
    ]

    # Only assign active employees belonging to this organization
    org_employees = session.exec(
        select(Employee)
        .where(Employee.organization_id == org.id)
        .where(Employee.is_setup_complete == True)
    ).all()
    
    result = allocate_team(project, org_employees, precomputed_tasks=precomputed_tasks)

    if result["status"] != "success":
        return AllocationResult(status=result.get("status"), reason=result.get("reason"))

    for member in result["selected_team"]:
        index = member["task_id"]
        member["task_id"] = task_objs[index].id

    for member in result["selected_team"]:
        emp_id = member.get("employee_id")
        emp = session.get(Employee, emp_id)
        
        # We NO LONGER update current_workload during draft creation!
        # Handled in the approve endpoint.

        allocation = Allocation(
            project_id=project_id,
            employee_id=emp_id,
            task_id=member["task_id"],
            role=member["role"],
            task_description=member["task_description"],
            similarity=float(member["similarity"]),
            workload_after=float(member["workload_after"]),
            matched_skills=json.dumps(member.get("matched_skills", [])),
            missing_skills=json.dumps(member.get("missing_skills", [])),
            is_final=False,  # Set explicitly as Draft
        )
        session.add(allocation)

    session.commit()
    
    return AllocationResult(
        status="success",
        selected_team=[TeamMember(**m) for m in result["selected_team"]],
        avg_similarity=result.get("avg_similarity"),
        workload_std=result.get("workload_std"),
        tasks_generated=len(task_objs),
    )


@router.post("/{project_id}/allocate/approve")
def approve_allocation(
    project_id: int, 
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    project = session.get(Project, project_id)
    if not project or project.organization_id != org.id:
        raise HTTPException(404, "Project not found")

    allocs = session.exec(select(Allocation).where(Allocation.project_id == project_id)).all()
    if not allocs:
        raise HTTPException(404, "No allocation found to approve")

    already_final = all(a.is_final for a in allocs)
    if already_final:
        return {"status": "success", "message": "Allocation is already finalized"}

    for alloc in allocs:
        if not alloc.is_final:
            emp = session.get(Employee, alloc.employee_id)
            if emp:
                emp.current_workload = alloc.workload_after
                # Queue assignment email
                background_tasks.add_task(
                    send_allocation_notification,
                    to_email=emp.email,
                    project_id=project_id,
                    role=alloc.role,
                    description=alloc.task_description
                )
            alloc.is_final = True
            session.add(alloc)

    session.commit()
    return {"status": "success", "message": "Allocation approved and workloads updated!"}


@router.post("/{project_id}/allocate/reject")
def reject_allocation(
    project_id: int, 
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    project = session.get(Project, project_id)
    if not project or project.organization_id != org.id:
        raise HTTPException(404, "Project not found")

    allocs = session.exec(select(Allocation).where(Allocation.project_id == project_id)).all()
    
    # Revert workloads if they were finalized
    for alloc in allocs:
        if alloc.is_final:
            emp = session.get(Employee, alloc.employee_id)
            if emp:
                emp.current_workload = max(0.0, round(emp.current_workload - project.project_load, 2))
                
    session.flush()
    session.exec(sa_delete(Allocation).where(Allocation.project_id == project_id))
    session.exec(sa_delete(Task).where(Task.project_id == project_id))
    session.commit()
    
    return {"status": "success", "message": "Draft allocation successfully rejected"}
