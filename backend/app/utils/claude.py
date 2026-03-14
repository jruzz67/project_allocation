import os
import json
from typing import List, Dict
from anthropic import Anthropic

# Load from env var (secure) or hardcode for testing
API_KEY = os.getenv("ANTHROPIC_API_KEY") or "your-key-here-if-testing"  # REPLACE or set env var

client = Anthropic(api_key=API_KEY)

def generate_tasks(project_description: str, team_size: int) -> List[Dict[str, str]]:
    """
    Call Claude to generate exactly team_size roles/tasks as JSON.
    Returns list of {"role": str, "task_description": str}
    """
    # Light pre-processing for token efficiency
    cleaned_desc = " ".join(project_description.split()).strip()

    prompt = f"""
You are an expert technical project manager. Given this project description, create a team of exactly {team_size} people.

Project Description:
{cleaned_desc}

Generate **exactly** {team_size} roles/tasks. Output ONLY a valid JSON array of objects. No other text.

Each object must have:
- "role": Concise role name (e.g., "Senior Backend Engineer", "Frontend Developer", "DevOps Specialist", "Data Scientist")
- "task_description": Detailed, actionable task (60–120 words). Include specific technologies, responsibilities, and skills from the description.

Rules:
- Cover all major areas needed (frontend, backend, cloud, database, DevOps, testing, etc.)
- Roles should be distinct and realistic for one person
- Balance the team (e.g., if project uses AWS + React + PostgreSQL, include relevant roles)
- Tasks should be specific enough for skill matching

Example for team_size=3:
[
  {{"role": "Backend Lead", "task_description": "Lead API development with FastAPI, design database schema with PostgreSQL and pgvector for semantic search, implement authentication and rate limiting..."}},
  {{"role": "Frontend Engineer", "task_description": "Build responsive dashboard UI using React, Tailwind CSS, and TypeScript, integrate with backend APIs, handle state management with Zustand..."}},
  {{"role": "DevOps Engineer", "task_description": "Set up CI/CD pipelines with GitHub Actions, containerize application with Docker, deploy to AWS ECS, monitor with Prometheus and Grafana..."}}
]

JSON only. Ensure valid format.
"""

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4000,
            temperature=0.2,  # low for consistent JSON
            system="You output only valid JSON arrays. No explanations, no markdown.",
            messages=[{"role": "user", "content": prompt}]
        )

        json_str = response.content[0].text.strip()
        tasks = json.loads(json_str)

        if not isinstance(tasks, list) or len(tasks) != team_size:
            raise ValueError(f"Expected {team_size} tasks, got {len(tasks)} or invalid format")

        for task in tasks:
            if "role" not in task or "task_description" not in task:
                raise ValueError("Invalid task format")

        return tasks

    except Exception as e:
        raise RuntimeError(f"Claude task generation failed: {str(e)}")