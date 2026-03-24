from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
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
        
    text = parse_pdf(content)

    if not text:
        raise HTTPException(400, "No text could be extracted from the PDF")

    embed_text = text[:30000]
    embedding = get_embedding(embed_text)

    db_project = Project(
        organization_id=org.id,
        description=text,
        required_team_size=required_team_size,
        project_load=project_load,
        embedding=embedding,
    )
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project


# ── List Projects ─────────────────────────────────────────────────────────────

@router.get("", response_model=List[ProjectRead])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    return session.exec(select(Project).where(Project.organization_id == org.id).offset(skip).limit(limit)).all()


@router.get("/allocated", response_model=List[ProjectRead])
def get_allocated_projects(
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    stmt = select(Project).where(
        Project.id.in_(select(Allocation.project_id).distinct())
    ).where(Project.organization_id == org.id)
    return session.exec(stmt).all()


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
    existing = session.exec(select(Allocation).where(Allocation.project_id == project_id)).all()
    for a in existing:
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
        if emp:
            session.refresh(emp)
            emp.current_workload = float(member["workload_after"])

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
