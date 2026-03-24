from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import timedelta

from ..database import get_session
from ..models import Organization, Employee
from ..schemas import Token, LoginRequest, OrgSignupRequest
from ..utils.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])

# --- Organization Auth ---

@router.post("/org/signup", response_model=Token)
def signup_org(data: OrgSignupRequest, session: Session = Depends(get_session)):
    # Check if email exists
    existing = session.exec(select(Organization).where(Organization.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    org = Organization(
        name=data.name,
        email=data.email,
        password=data.password  # Storing as plaintext per explicit requirement
    )
    session.add(org)
    session.commit()
    session.refresh(org)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(org.id), "role": "org"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "org", "user_id": org.id, "name": org.name}

@router.post("/org/login", response_model=Token)
def login_org(data: LoginRequest, session: Session = Depends(get_session)):
    org = session.exec(select(Organization).where(Organization.email == data.email)).first()
    if not org or org.password != data.password:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(org.id), "role": "org"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "org", "user_id": org.id, "name": org.name}


# --- Employee Auth ---

@router.post("/employee/login", response_model=Token)
def login_employee(data: LoginRequest, session: Session = Depends(get_session)):
    emp = session.exec(select(Employee).where(Employee.email == data.email)).first()
    if not emp or emp.password != data.password:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(emp.id), "role": "employee"}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": "employee", 
        "user_id": emp.id, 
        "name": emp.name,
        "is_setup_complete": emp.is_setup_complete
    }
