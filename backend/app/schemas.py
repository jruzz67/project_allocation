from pydantic import BaseModel, EmailStr
from typing import List, Optional

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: Optional[str]
    is_setup_complete: Optional[bool] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class OrgSignupRequest(BaseModel):
    name: str
    email: str
    password: str
    
class EmployeeSignupByOrg(BaseModel):
    email: str
    password: str

# --- Organization ---
class OrganizationRead(BaseModel):
    id: int
    name: str
    email: str

# --- Employee ---
class EmployeeRead(BaseModel):
    id: int
    organization_id: int
    email: str
    is_setup_complete: bool
    name: Optional[str] = None
    description: Optional[str] = None
    current_workload: float = 0.0
    capacity: Optional[float] = None
    skills: Optional[str] = None

# --- Project ---
class ProjectCreate(BaseModel):
    description: str
    required_team_size: int
    project_load: float

class ProjectRead(ProjectCreate):
    id: int
    organization_id: int

# --- Tasks & Roles ---
class TaskRead(BaseModel):
    id: int
    role: str
    task_description: str
    required_skills: List[str] = []

class TeamMember(BaseModel):
    employee_id: int
    employee_name: str
    task_id: int
    role: str
    task_description: str
    similarity: float
    workload_after: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []

class AllocationResult(BaseModel):
    status: str
    selected_team: Optional[List[TeamMember]] = None
    avg_similarity: Optional[float] = None
    workload_std: Optional[float] = None
    tasks_generated: Optional[int] = None
    reason: Optional[str] = None
    suggestions: Optional[List[str]] = None