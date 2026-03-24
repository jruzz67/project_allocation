import numpy as np
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pulp import LpMaximize, LpProblem, LpVariable, lpSum, LpBinary, value, LpStatus, PULP_CBC_CMD
from typing import List, Dict, Any
from .gemini import generate_tasks, extract_required_skills_from_task
from .embedding import get_embedding

LAMBDA = 0.5
SKILL_WEIGHT = 0.6
EMBEDDING_WEIGHT = 0.4


def cosine_similarity(a: List[float], b: List[float]) -> float:
    a_np = np.array(a)
    b_np = np.array(b)
    return float(np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np) + 1e-10))


def allocate_team(project, employees: List[Any], precomputed_tasks: List[Dict] = None) -> Dict[str, Any]:
    """
    Allocate employees to tasks using Integer Linear Programming.

    precomputed_tasks: list of dicts with keys:
        - role (str)
        - task_description (str)
        - required_skills (list[str], optional — pre-computed, avoids duplicate Gemini calls)
    """
    if not employees:
        return {"status": "infeasible", "reason": "No employees available"}

    if precomputed_tasks is not None:
        tasks = precomputed_tasks
    else:
        try:
            tasks = generate_tasks(project.description, project.required_team_size)
        except Exception as e:
            return {"status": "error", "reason": str(e)}

    if len(tasks) != project.required_team_size:
        return {"status": "error", "reason": "Gemini returned wrong number of tasks"}

    # ── Step 1: Skill extraction — only if NOT pre-supplied ─────────────────
    # When called from main.py, required_skills is already in each task dict.
    # This avoids the duplicate N×Gemini calls that previously happened here.
    tasks_needing_skills = [t for t in tasks if "required_skills" not in t or t["required_skills"] is None]
    if tasks_needing_skills:
        print(f"[OPT] Extracting skills for {len(tasks_needing_skills)} tasks (parallel)...")
        with ThreadPoolExecutor(max_workers=min(len(tasks_needing_skills), 5)) as executor:
            futures = {
                executor.submit(extract_required_skills_from_task, t["role"], t["task_description"]): i
                for i, t in enumerate(tasks)
                if "required_skills" not in t or t["required_skills"] is None
            }
            for future in as_completed(futures):
                idx = futures[future]
                try:
                    tasks[idx]["required_skills"] = future.result()
                except Exception as e:
                    print(f"[OPT] Skill extraction failed for task {idx}: {e}")
                    tasks[idx]["required_skills"] = []
    else:
        print(f"[OPT] Using pre-supplied skills for all {len(tasks)} tasks — skipping Gemini calls.")

    # ── Step 2: Compute embeddings in parallel ───────────────────────────────
    combined_texts = [f"{t['role']}: {t['task_description']}" for t in tasks]

    print(f"[OPT] Computing embeddings for {len(combined_texts)} tasks (parallel)...")
    embeddings = [None] * len(combined_texts)
    with ThreadPoolExecutor(max_workers=min(len(combined_texts), 4)) as executor:
        future_to_idx = {executor.submit(get_embedding, text): i for i, text in enumerate(combined_texts)}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                embeddings[idx] = future.result()
            except Exception as e:
                print(f"[OPT] Embedding failed for task {idx}: {e}")
                embeddings[idx] = [0.0] * 384

    # ── Step 3: Build task_data ──────────────────────────────────────────────
    task_data = []
    for i, t in enumerate(tasks):
        task_data.append({
            "role": t["role"],
            "task_description": t["task_description"],
            "embedding": embeddings[i],
            "required_skills": set(s.lower() for s in (t.get("required_skills") or [])),
        })

    # ── Step 4: Hybrid scoring matrix ────────────────────────────────────────
    def hybrid_score(emp, task):
        if not getattr(emp, "skills", None):
            emp_skills = set()
        else:
            try:
                emp_skills = set(s.lower() for s in json.loads(emp.skills))
            except Exception:
                emp_skills = set()

        skill_match = (
            len(emp_skills & task["required_skills"]) / len(task["required_skills"])
            if task["required_skills"]
            else 0.0
        )
        emb_sim = cosine_similarity(emp.embedding, task["embedding"])
        return SKILL_WEIGHT * skill_match + EMBEDDING_WEIGHT * emb_sim

    score_matrix = np.array([
        [hybrid_score(emp, task) for task in task_data]
        for emp in employees
    ])

    # ── Step 5: ILP Assignment ───────────────────────────────────────────────
    prob = LpProblem("Task_Assignment", LpMaximize)
    x = [
        [LpVariable(f"x_{i}_{j}", cat=LpBinary) for j in range(len(tasks))]
        for i in range(len(employees))
    ]

    prob += (
        lpSum(score_matrix[i][j] * x[i][j] for i in range(len(employees)) for j in range(len(tasks)))
        - LAMBDA * lpSum(
            (employees[i].current_workload + project.project_load) * x[i][j]
            for i in range(len(employees)) for j in range(len(tasks))
        )
    )

    # Each task must be assigned to exactly one employee
    for j in range(len(tasks)):
        prob += lpSum(x[i][j] for i in range(len(employees))) == 1
    # Each employee can be assigned at most one task
    for i in range(len(employees)):
        prob += lpSum(x[i][j] for j in range(len(tasks))) <= 1
        prob += (
            (employees[i].current_workload + project.project_load)
            * lpSum(x[i][j] for j in range(len(tasks)))
            <= employees[i].capacity
        )

    status = prob.solve(PULP_CBC_CMD(msg=0))

    if LpStatus[status] != "Optimal":
        return {"status": "infeasible", "reason": LpStatus[status]}

    # ── Step 6: Build result ─────────────────────────────────────────────────
    selected = []
    total_score = 0.0
    workloads = []

    for i in range(len(employees)):
        for j in range(len(tasks)):
            if value(x[i][j]) > 0.5:
                score = score_matrix[i][j]
                new_load = employees[i].current_workload + project.project_load

                emp_skills = (
                    set(s.lower() for s in json.loads(employees[i].skills))
                    if employees[i].skills
                    else set()
                )
                required = task_data[j]["required_skills"]
                matched = sorted(list(emp_skills & required))
                missing = sorted(list(required - emp_skills))

                workloads.append(new_load)
                selected.append({
                    "employee_id": employees[i].id,
                    "employee_name": employees[i].name,
                    "task_id": j,
                    "role": tasks[j]["role"],
                    "task_description": tasks[j]["task_description"],
                    "similarity": round(score, 3),
                    "workload_after": round(new_load, 1),
                    "matched_skills": matched,
                    "missing_skills": missing,
                })
                total_score += score

    return {
        "status": "success",
        "selected_team": selected,
        "avg_similarity": round(total_score / len(selected), 3) if selected else 0,
        "workload_std": round(float(np.std(workloads)), 2) if workloads else 0,
        "tasks_generated": len(tasks),
    }