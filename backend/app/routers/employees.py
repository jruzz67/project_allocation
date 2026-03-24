from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlmodel import Session, select
from typing import List
import json

from ..database import get_session
from ..models import Employee, Organization, Allocation
from ..schemas import EmployeeRead, EmployeeSignupByOrg
from ..utils.embedding import get_embedding
from ..utils.gemini import extract_skills_from_resume
from ..utils.auth import get_current_org, get_current_employee
from ..utils.pdf import parse_pdf

router = APIRouter(prefix="/employees", tags=["employees"])

# --- Organization Endpoints ---

@router.post("", response_model=EmployeeRead)
def create_employee_placeholder(
    data: EmployeeSignupByOrg,
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    """Organization creates an employee account (placeholder until employee setups)."""
    # Check if email is already used
    existing = session.exec(select(Employee).where(Employee.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee email already registered")

    db_employee = Employee(
        organization_id=org.id,
        email=data.email,
        password=data.password,
        is_setup_complete=False
    )
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    return db_employee

@router.get("", response_model=List[EmployeeRead])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    """Organization lists all its employees."""
    stmt = select(Employee).where(Employee.organization_id == org.id).offset(skip).limit(limit)
    return session.exec(stmt).all()

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int, 
    session: Session = Depends(get_session),
    org: Organization = Depends(get_current_org)
):
    """Organization deletes an employee."""
    employee = session.get(Employee, employee_id)
    if not employee or employee.organization_id != org.id:
        raise HTTPException(404, "Employee not found")
        
    # Guard: check active allocations
    allocations = session.exec(select(Allocation).where(Allocation.employee_id == employee_id)).all()
    if allocations:
        raise HTTPException(400, "Cannot delete employee. They are actively assigned to a project.")
        
    session.delete(employee)
    session.commit()
    return {"message": f"Employee {employee_id} deleted successfully"}


# --- Employee Endpoints ---

@router.post("/setup", response_model=EmployeeRead)
async def complete_employee_setup(
    name: str = Form(...),
    capacity: float = Form(...),
    new_password: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    emp: Employee = Depends(get_current_employee)
):
    """Employee uploads resume, sets new password, and provides details."""
    if emp.is_setup_complete:
        raise HTTPException(status_code=400, detail="Setup already completed")
        
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024: # 10MB limit
         raise HTTPException(status_code=413, detail="File too large. Limit 10MB.")
         
    text = parse_pdf(content)
    if not text:
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    embed_text = text[:30000]
    embedding = get_embedding(embed_text)
    skills_list = extract_skills_from_resume(text)
    skills_json = json.dumps(skills_list) if skills_list else None

    # Update employee record
    emp.name = name
    emp.capacity = capacity
    emp.password = new_password
    emp.description = text
    emp.embedding = embedding
    emp.skills = skills_json
    emp.is_setup_complete = True
    
    session.add(emp)
    session.commit()
    session.refresh(emp)
    
    return emp
