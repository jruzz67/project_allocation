from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, BackgroundTasks
from sqlmodel import Session, select
from typing import List
import json

from ..database import get_session
from ..models import Employee, Organization, Allocation
from ..schemas import EmployeeRead, EmployeeSignupByOrg
from ..utils.embedding import get_embedding
from ..utils.gemini import extract_skills_from_resume
from ..utils.auth import get_current_org, get_current_employee, get_password_hash
from ..utils.pdf import parse_pdf
from ..utils.s3 import upload_file_to_s3, generate_presigned_url
from ..utils.email import send_employee_invite_email

router = APIRouter(prefix="/employees", tags=["employees"])

# --- Organization Endpoints ---

@router.post("", response_model=EmployeeRead)
def create_employee_placeholder(
    data: EmployeeSignupByOrg,
    background_tasks: BackgroundTasks,
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
        hashed_password=get_password_hash(data.password),
        is_setup_complete=False
    )
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    
    # Send invitation email in the background
    background_tasks.add_task(
        send_employee_invite_email,
        to_email=db_employee.email,
        temp_password=data.password,
        org_name=org.name
    )

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
    employees = session.exec(stmt).all()
    
    results = []
    for emp in employees:
        emp_read = EmployeeRead.model_validate(emp)
        if emp_read.resume_url and not emp_read.resume_url.startswith("http"):
            emp_read.resume_url = generate_presigned_url(emp_read.resume_url)
        results.append(emp_read)
    return results

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

    # Upload resume to S3
    custom_name = f"{name.replace(' ', '_').lower()}_resume"
    resume_url = upload_file_to_s3(content, file.filename, folder="resumes", custom_filename=custom_name)

    # Update employee record
    emp.name = name
    emp.capacity = capacity
    emp.hashed_password = get_password_hash(new_password)
    emp.description = text
    emp.embedding = embedding
    emp.skills = skills_json
    emp.resume_url = resume_url
    emp.is_setup_complete = True
    
    session.add(emp)
    session.commit()
    session.refresh(emp)
    
    result = EmployeeRead.model_validate(emp)
    if result.resume_url and not result.resume_url.startswith("http"):
        result.resume_url = generate_presigned_url(result.resume_url)
    return result
