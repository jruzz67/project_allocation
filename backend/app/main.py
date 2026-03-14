from fastapi import FastAPI, Depends, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select, text, delete  # ← FIXED: import delete
from typing import List, Dict
import io
from PyPDF2 import PdfReader
import re

from .database import engine, get_session
from .models import Employee, Project, Allocation
from .schemas import EmployeeRead, ProjectRead, AllocationResult, TeamMember
from .utils.embedding import get_embedding
from .utils.optimization import allocate_team

app = FastAPI(title="Team Optimizer Mini Project")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with Session(engine) as session:
    session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
    session.commit()

SQLModel.metadata.create_all(engine)

def clean_task_description(text: str) -> str:
    text = re.sub(r'\bnp\.(float|int|double|complex)\d*\s*\([^)]*\)', '', text)
    text = re.sub(r'\bnp\.\w+\b', '', text)
    text = re.sub(r'\b\d+\.\d{2,3}\b', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

@app.get("/")
def read_root():
    return {"message": "Team Optimizer backend running"}

@app.post("/employees", response_model=EmployeeRead)
async def create_employee(
    name: str = Form(...),
    current_workload: float = Form(0.0),
    capacity: float = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF allowed")

    content = await file.read()
    reader = PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + " "

    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    text = text.replace('\x00', '').replace('\r', ' ').replace('\n', ' ')
    text = " ".join(text.split()).strip()

    if not text:
        raise HTTPException(400, "No text extracted from PDF")

    embed_text = text[:30000] if len(text) > 30000 else text
    embedding = get_embedding(embed_text)

    db_employee = Employee(
        name=name,
        description=text,
        current_workload=current_workload,
        capacity=capacity,
        embedding=embedding
    )
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    return db_employee

@app.get("/employees", response_model=List[EmployeeRead])
def get_employees(session: Session = Depends(get_session)):
    return session.exec(select(Employee)).all()

@app.post("/projects", response_model=ProjectRead)
async def create_project(
    required_team_size: int = Form(...),
    project_load: float = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF allowed")

    content = await file.read()
    reader = PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + " "

    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    text = text.replace('\x00', '').replace('\r', ' ').replace('\n', ' ')
    text = " ".join(text.split()).strip()

    if not text:
        raise HTTPException(400, "No text extracted from PDF")

    embed_text = text[:30000] if len(text) > 30000 else text
    embedding = get_embedding(embed_text)

    db_project = Project(
        description=text,
        required_team_size=required_team_size,
        project_load=project_load,
        embedding=embedding
    )
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project

@app.get("/projects", response_model=List[ProjectRead])
def get_projects(session: Session = Depends(get_session)):
    return session.exec(select(Project)).all()

@app.get("/projects/allocated", response_model=List[ProjectRead])
def get_allocated_projects(session: Session = Depends(get_session)):
    stmt = select(Project).where(
        Project.id.in_(
            select(Allocation.project_id).distinct()
        )
    )
    return session.exec(stmt).all()

@app.get("/projects/{project_id}/team", response_model=List[Dict])
def get_project_team(project_id: int, session: Session = Depends(get_session)):
    allocs = session.exec(
        select(Allocation).where(Allocation.project_id == project_id)
    ).all()

    if not allocs:
        raise HTTPException(404, "No team allocated for this project")

    result = []
    for alloc in allocs:
        emp = session.get(Employee, alloc.employee_id)
        result.append({
            "employee_id": alloc.employee_id,
            "employee_name": emp.name if emp else "Unknown",
            "role": alloc.role,
            "task_description": alloc.task_description,
            "similarity": alloc.similarity,
            "workload_after": alloc.workload_after,
        })
    return result

@app.post("/projects/{project_id}/allocate", response_model=AllocationResult)
def allocate_team_endpoint(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    # Step 1: Rollback previous allocation if exists
    existing_allocs = session.exec(
        select(Allocation).where(Allocation.project_id == project_id)
    ).all()

    if existing_allocs:
        print(f"[INFO] Re-allocation for project {project_id} — rolling back old workloads")
        for alloc in existing_allocs:
            emp = session.get(Employee, alloc.employee_id)
            if emp:
                emp.current_workload = max(0.0, emp.current_workload - project.project_load)
                print(f"  - Reduced {project.project_load} from {emp.name} (now {emp.current_workload})")

        # Delete old allocation records
        session.exec(
            delete(Allocation).where(Allocation.project_id == project_id)
        )
        session.commit()

    employees = session.exec(select(Employee)).all()
    if not employees:
        return AllocationResult(
            status="infeasible",
            reason="No employees in the system",
            suggestions=["Add some employees first"]
        )

    result = allocate_team(project, employees)

    if result["status"] == "success":
        updated_count = 0
        for member in result["selected_team"]:
            emp_id = member.get("employee_id")
            if emp_id is None:
                print(f"[WARNING] Missing employee_id: {member}")
                continue
            emp = session.get(Employee, emp_id)
            if emp:
                emp.current_workload = float(member["workload_after"])
                updated_count += 1
            else:
                print(f"[WARNING] Employee {emp_id} not found")

            task_desc = clean_task_description(member["task_description"])

            allocation = Allocation(
                project_id=project_id,
                employee_id=emp_id,
                role=member["role"],
                task_description=task_desc,
                similarity=float(member["similarity"]),
                workload_after=float(member["workload_after"])
            )
            session.add(allocation)

        if updated_count > 0:
            session.commit()
            print(f"[INFO] Updated workloads for {updated_count} employees + saved {len(result['selected_team'])} new records")
        else:
            print("[INFO] No workloads updated")

        return AllocationResult(
            status="success",
            selected_team=[TeamMember(**m) for m in result["selected_team"]],
            avg_similarity=result.get("avg_similarity"),
            workload_std=result.get("workload_std"),
            tasks_generated=result.get("tasks_generated")
        )
    else:
        return AllocationResult(
            status=result.get("status", "infeasible"),
            reason=result.get("reason"),
            suggestions=result.get("suggestions", [])
        )