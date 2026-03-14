from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, ForeignKey
from pgvector.sqlalchemy import VECTOR
from typing import Optional

class EmployeeBase(SQLModel):
    name: str = Field(max_length=150)
    description: str = Field(sa_column=Text)
    current_workload: float = Field(default=0.0, ge=0.0)
    capacity: float = Field(ge=0.0)

class Employee(EmployeeBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    embedding: Optional[list[float]] = Field(
        default=None,
        sa_column=Column(VECTOR(384))
    )

class ProjectBase(SQLModel):
    description: str = Field(sa_column=Text)
    required_team_size: int = Field(ge=1)
    project_load: float = Field(ge=0.0)

class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    embedding: Optional[list[float]] = Field(
        default=None,
        sa_column=Column(VECTOR(384))
    )

class Allocation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(sa_column=Column(ForeignKey("project.id")))
    employee_id: int = Field(sa_column=Column(ForeignKey("employee.id")))
    role: str = Field(max_length=150)
    task_description: str = Field(sa_column=Text)
    similarity: float
    workload_after: float
    # assigned_at removed completely - no timestamp issues