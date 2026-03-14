import numpy as np
from pulp import LpMaximize, LpProblem, LpVariable, lpSum, LpBinary, value, LpStatus, PULP_CBC_CMD
from typing import List, Dict, Any
from .gemini import generate_tasks
from .embedding import get_embedding

LAMBDA = 0.5

def cosine_similarity(a: List[float], b: List[float]) -> float:
    a_np = np.array(a)
    b_np = np.array(b)
    return np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np) + 1e-10)

def allocate_team(project, employees: List[Any]) -> Dict[str, Any]:
    if not employees:
        return {"status": "infeasible", "reason": "No employees available"}

    try:
        tasks = generate_tasks(project.description, project.required_team_size)
    except Exception as e:
        return {"status": "error", "reason": str(e)}

    if len(tasks) != project.required_team_size:
        return {"status": "error", "reason": "Gemini returned wrong number of tasks"}

    task_embeddings = []
    for t in tasks:
        combined = f"{t['role']}: {t['task_description']}"
        emb = get_embedding(combined)
        task_embeddings.append(emb)

    available = sum(e.capacity - e.current_workload for e in employees)
    required = project.required_team_size * project.project_load
    if available < required:
        return {
            "status": "infeasible",
            "reason": f"Insufficient capacity ({available:.1f} < {required:.1f})",
            "suggestions": ["Add capacity", "Reduce team size/load"]
        }

    sim_matrix = np.array([
        [cosine_similarity(emp.embedding, task_emb) for task_emb in task_embeddings]
        for emp in employees
    ])

    prob = LpProblem("Task_Assignment", LpMaximize)

    x = [[LpVariable(f"x_{i}_{j}", cat=LpBinary) for j in range(len(tasks))] for i in range(len(employees))]

    prob += (
        lpSum(sim_matrix[i][j] * x[i][j] for i in range(len(employees)) for j in range(len(tasks))) -
        LAMBDA * lpSum((employees[i].current_workload + project.project_load) * x[i][j] for i in range(len(employees)) for j in range(len(tasks)))
    )

    for j in range(len(tasks)):
        prob += lpSum(x[i][j] for i in range(len(employees))) == 1

    for i in range(len(employees)):
        prob += lpSum(x[i][j] for j in range(len(tasks))) <= 1

    for i, emp in enumerate(employees):
        prob += (emp.current_workload + project.project_load) * lpSum(x[i][j] for j in range(len(tasks))) <= emp.capacity

    status = prob.solve(PULP_CBC_CMD(msg=0))

    if LpStatus[status] != "Optimal":
        return {
            "status": "infeasible",
            "reason": LpStatus[status],
            "suggestions": ["Add employees", "Reduce team size", "Check constraints"]
        }

    selected = []
    total_sim = 0
    workloads = []

    for i in range(len(employees)):
        for j in range(len(tasks)):
            if value(x[i][j]) > 0.5:
                sim = sim_matrix[i][j]
                total_sim += sim
                new_load = employees[i].current_workload + project.project_load
                workloads.append(new_load)
                selected.append({
                    "employee_id": employees[i].id,  # ← FIXED: matches TeamMember model
                    "employee_name": employees[i].name,
                    "task_id": j,
                    "role": tasks[j]["role"],
                    "task_description": tasks[j]["task_description"],
                    "similarity": round(sim, 3),
                    "workload_after": round(new_load, 1)
                })

    return {
        "status": "success",
        "selected_team": selected,
        "avg_similarity": round(total_sim / len(selected), 3) if selected else 0,
        "workload_std": round(np.std(workloads), 2) if workloads else 0,
        "tasks_generated": len(tasks)
    }