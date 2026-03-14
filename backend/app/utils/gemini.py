# app/utils/gemini.py (keep as-is, only .env was missing)
import os
import json
from typing import List, Dict
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

API_KEYS_STR = os.getenv("GOOGLE_API_KEYS")
if not API_KEYS_STR:
    raise ValueError("GOOGLE_API_KEYS not found in .env (comma-separated list)")

API_KEYS = [k.strip() for k in API_KEYS_STR.split(",") if k.strip()]

if not API_KEYS:
    raise ValueError("No valid Google API keys provided in .env")

print(f"[INFO] Loaded {len(API_KEYS)} Google API key(s) for rotation")

def generate_tasks(project_description: str, team_size: int) -> List[Dict[str, str]]:
    """
    Use Gemini with key rotation on quota errors.
    """
    cleaned_desc = " ".join(project_description.split()).strip()

    prompt = f"""
You are an expert technical project manager. Given this project description, create a team of exactly {team_size} people.

Project Description:
{cleaned_desc}

Generate **exactly** {team_size} roles/tasks. Output ONLY a valid JSON array of objects. No other text, no markdown, no explanations, no code blocks.

Each object must have exactly two keys:
- "role": Concise role name (e.g., "Senior Backend Engineer", "Frontend Developer", "DevOps Specialist")
- "task_description": Detailed, actionable task (60–120 words). Include specific technologies, responsibilities, and skills from the description.

Strict rules:
- Cover all major areas needed (frontend, backend, cloud, database, DevOps, testing, etc.)
- Roles must be distinct and realistic for one person
- Balance the team based on project needs
- Tasks must be specific enough for skill matching
- Do NOT add extra fields or comments

Example for team_size=3:
[
  {{"role": "Backend Lead", "task_description": "Lead API development with FastAPI, design database schema with PostgreSQL and pgvector for semantic search, implement authentication and rate limiting..."}},
  {{"role": "Frontend Engineer", "task_description": "Build responsive dashboard UI using React, Tailwind CSS, and TypeScript, integrate with backend APIs, handle state management with Zustand..."}},
  {{"role": "DevOps Engineer", "task_description": "Set up CI/CD pipelines with GitHub Actions, containerize application with Docker, deploy to AWS ECS, monitor with Prometheus and Grafana..."}}
]

JSON only. Exactly {team_size} items. Valid format.
"""

    last_error = None

    for idx, api_key in enumerate(API_KEYS, 1):
        try:
            print(f"[DEBUG] Trying API key {idx}/{len(API_KEYS)}")
            genai.configure(api_key=api_key)

            model = genai.GenerativeModel("gemini-2.5-flash")
            print(f"[DEBUG] Calling Gemini model: gemini-2.5-flash (key {idx})")

            response = model.generate_content(prompt)

            print(f"[DEBUG] Raw Gemini response received. Length: {len(response.text)} chars")

            json_str = response.text.strip()
            if json_str.startswith("```json"):
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif json_str.startswith("```"):
                json_str = json_str.split("```")[1].strip()

            print(f"[DEBUG] Cleaned JSON string: {json_str[:200]}...")

            tasks = json.loads(json_str)

            if not isinstance(tasks, list) or len(tasks) != team_size:
                raise ValueError(f"Expected {team_size} tasks, got {len(tasks)}. Raw: {response.text}")

            for task in tasks:
                if "role" not in task or "task_description" not in task:
                    raise ValueError(f"Invalid task format: {response.text}")

            print(f"[DEBUG] Successfully parsed {len(tasks)} tasks (using key {idx})")
            return tasks

        except Exception as e:
            error_str = str(e)
            print(f"[ERROR] API key {idx} failed: {error_str}")
            last_error = e

            # Retry on quota (429) with next key
            if "429" in error_str or "quota" in error_str.lower():
                print(f"[INFO] Quota error on key {idx} — trying next key...")
                continue
            else:
                # Non-quota error — stop
                break

    # All keys failed
    raise RuntimeError(f"All {len(API_KEYS)} API keys failed. Last error: {last_error}")