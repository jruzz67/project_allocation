from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Text, ForeignKey, String
from pgvector.sqlalchemy import VECTOR
from typing import Optional, List

class Organization(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=150)
    email: str = Field(max_length=150, unique=True, index=True)
    password: str = Field(...)  # Plaintext per user request

class EmployeeBase(SQLModel):
    organization_id: int = Field(foreign_key="organization.id")
    email: str = Field(max_length=150, unique=True, index=True)
    is_setup_complete: bool = Field(default=False)
    
    # Optional until setup is complete
    name: Optional[str] = Field(default=None, max_length=150)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    current_workload: float = Field(default=0.0, ge=0.0)
    capacity: Optional[float] = Field(default=None, ge=0.0)
    skills: Optional[str] = Field(default=None, sa_column=Column(Text))

class Employee(EmployeeBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    password: str = Field(...)  # Plaintext
    embedding: Optional[list[float]] = Field(default=None, sa_column=Column(VECTOR(384)))

class ProjectBase(SQLModel):
    organization_id: int = Field(foreign_key="organization.id")
    description: str = Field(sa_column=Column(Text))
    required_team_size: int = Field(ge=1)
    project_load: float = Field(ge=0.0)

class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    embedding: Optional[list[float]] = Field(default=None, sa_column=Column(VECTOR(384)))

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    role: str = Field(max_length=150)
    task_description: str = Field(sa_column=Column(Text))
    required_skills: Optional[str] = Field(default=None, sa_column=Column(Text))

class Allocation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    employee_id: int = Field(foreign_key="employee.id")
    task_id: Optional[int] = Field(foreign_key="task.id")
    role: str = Field(max_length=150)
    task_description: str = Field(sa_column=Column(Text))
    similarity: float
    workload_after: float
    matched_skills: Optional[str] = Field(default=None, sa_column=Column(Text))
    missing_skills: Optional[str] = Field(default=None, sa_column=Column(Text))