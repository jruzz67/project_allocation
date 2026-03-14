from pydantic import BaseModel
from typing import List, Optional

class EmployeeCreate(BaseModel):
    name: str
    description: str
    current_workload: float = 0.0
    capacity: float

class EmployeeRead(EmployeeCreate):
    id: int

class ProjectCreate(BaseModel):
    description: str
    required_team_size: int
    project_load: float

class ProjectRead(ProjectCreate):
    id: int

class Task(BaseModel):
    role: str
    task_description: str

class TeamMember(BaseModel):
    employee_id: int           # ← Matches what optimization.py outputs
    employee_name: str
    task_id: int
    role: str
    task_description: str
    similarity: float
    workload_after: float

class AllocationResult(BaseModel):
    status: str
    selected_team: Optional[List[TeamMember]] = None
    avg_similarity: Optional[float] = None
    workload_std: Optional[float] = None
    tasks_generated: Optional[int] = None  # Optional, for debug
    reason: Optional[str] = None
    suggestions: Optional[List[str]] = None