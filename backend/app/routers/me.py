from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict
import json

from ..database import get_session
from ..models import Employee, Allocation, Project, Task
from ..utils.auth import get_current_employee

router = APIRouter(prefix="/me", tags=["me"])

@router.get("/tasks")
def get_my_tasks(
    session: Session = Depends(get_session),
    emp: Employee = Depends(get_current_employee)
):
    """Employee gets a list of their assigned tasks."""
    allocations = session.exec(select(Allocation).where(Allocation.employee_id == emp.id)).all()
    
    result = []
    for alloc in allocations:
        project = session.get(Project, alloc.project_id)
        task = session.get(Task, alloc.task_id) if alloc.task_id else None
        
        result.append({
            "project_name": project.description[:60] + "..." if project else "Unknown Project",
            "role": alloc.role,
            "task_description": alloc.task_description,
            "workload_allocated": alloc.workload_after,
            "matched_skills": json.loads(alloc.matched_skills) if alloc.matched_skills else []
        })
        
    return result
