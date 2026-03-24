import os
import json
from typing import List, Dict
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEYS_STR = os.getenv("GOOGLE_API_KEYS")
if not API_KEYS_STR:
    raise ValueError("GOOGLE_API_KEYS not found in .env (comma-separated list)")

API_KEYS = [k.strip() for k in API_KEYS_STR.split(",") if k.strip()]

if not API_KEYS:
    raise ValueError("No valid Google API keys provided in .env")

print(f"[INFO] Loaded {len(API_KEYS)} Google API key(s) for rotation")

MODEL_ID = "gemini-2.5-flash"


def _call_gemini(prompt: str, api_key: str) -> str:
    """Single Gemini call using the new google.genai SDK."""
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
        ),
    )
    return response.text.strip()


def _parse_json_response(raw: str) -> object:
    """Strip markdown fences and parse JSON from a Gemini response."""
    text = raw.strip()
    if text.startswith("```json"):
        text = text.split("```json", 1)[1].split("```")[0].strip()
    elif text.startswith("```"):
        text = text.split("```", 1)[1].strip()
    if text.lower().startswith("json"):
        text = text[4:].strip()
    return json.loads(text)


# ── Generate Tasks ────────────────────────────────────────────────────────────

def generate_tasks(project_description: str, team_size: int) -> List[Dict[str, str]]:
    cleaned_desc = " ".join(project_description.split()).strip()

    prompt = f"""
You are an expert technical project manager. Given this project description, create a team of exactly {team_size} people.

Project Description:
{cleaned_desc}

Generate **exactly** {team_size} roles/tasks. Output ONLY a valid JSON array of objects. No other text, no markdown, no explanations.

Each object must have exactly two keys:
- "role": Concise role name
- "task_description": Detailed, actionable task (60–120 words). Include specific technologies, responsibilities, and skills from the description.

Strict rules:
- Cover all major areas needed
- Roles must be distinct
- Tasks must be specific enough for skill matching
- JSON only. Exactly {team_size} items.
"""

    last_error = None
    for idx, api_key in enumerate(API_KEYS, 1):
        try:
            print(f"[DEBUG] Trying API key {idx}/{len(API_KEYS)} for generate_tasks")
            raw = _call_gemini(prompt, api_key)
            tasks = _parse_json_response(raw)

            if not isinstance(tasks, list) or len(tasks) != team_size:
                raise ValueError(f"Expected {team_size} tasks, got {len(tasks) if isinstance(tasks, list) else type(tasks)}")

            print(f"[DEBUG] Successfully parsed {len(tasks)} tasks (key {idx})")
            return tasks

        except Exception as e:
            error_str = str(e)
            print(f"[ERROR] API key {idx} failed: {error_str}")
            last_error = e
            if "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                print(f"[INFO] Quota error on key {idx} — trying next key...")
                continue
            else:
                break

    raise RuntimeError(f"All {len(API_KEYS)} API keys failed. Last error: {last_error}")


# ── Extract Skills from Resume ────────────────────────────────────────────────

def extract_skills_from_resume(resume_text: str) -> List[str]:
    if not resume_text.strip():
        return []

    cleaned_text = " ".join(resume_text.split())[:25000]

    prompt = f"""
You are an expert resume parser and skill extractor.

Given this resume text:

{cleaned_text}

Extract **only** the concrete technical skills, tools, programming languages, frameworks, databases, cloud platforms, etc.
Ignore soft skills, education, experience years, company names, dates, generic phrases.

Rules:
- Return ONLY a valid JSON array of strings. Example: ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "React"]
- No duplicates
- Normalize names (e.g. "python" → "Python")
- Max 40 items
- If no skills found, return empty list []
- Output ONLY the JSON array — no explanations, no markdown

JSON array only.
"""

    last_error = None
    for idx, api_key in enumerate(API_KEYS, 1):
        try:
            print(f"[SKILL] Trying API key {idx}/{len(API_KEYS)} for skill extraction")
            raw = _call_gemini(prompt, api_key)
            skills = _parse_json_response(raw)

            if not isinstance(skills, list):
                raise ValueError("Gemini did not return a list")

            cleaned_skills = []
            seen = set()
            for s in skills:
                s_clean = str(s).strip()
                if s_clean and s_clean.lower() not in seen:
                    cleaned_skills.append(s_clean)
                    seen.add(s_clean.lower())

            print(f"[SKILL] Extracted {len(cleaned_skills)} unique skills (key {idx})")
            return cleaned_skills

        except Exception as e:
            error_str = str(e)
            print(f"[SKILL ERROR] Key {idx} failed: {error_str}")
            last_error = e
            if "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                continue
            else:
                break

    print("[SKILL] All keys failed for skill extraction — returning []")
    return []


# ── Extract Required Skills from Task ────────────────────────────────────────

def extract_required_skills_from_task(role: str, task_description: str) -> List[str]:
    prompt = f"""
You are an expert technical skill extractor.

Role: {role}
Full Task Description: {task_description}

You MUST extract EVERY concrete technical skill, tool, language, framework, database, cloud service, library, methodology, practice or standard this task requires.

Return ONLY a valid JSON array of strings.

Rules (STRICT):
- Return at least 8 and up to 25 skills
- Be comprehensive — if the task mentions any technology, include it
- Use exact standard names (e.g. "Node.js", "PostgreSQL", "JWT", "Docker", "CI/CD", "AWS EC2")
- No duplicates
- JSON array ONLY — no explanations, no markdown, no extra text

Example output:
["Node.js", "Express.js", "PostgreSQL", "Redis", "JWT", "bcrypt", "RESTful API", "AWS", "Docker", "CI/CD", "Nginx", "Microservices", "Scalability", "Security", "Database Schema Design"]

JSON array only.
"""

    for idx, api_key in enumerate(API_KEYS, 1):
        try:
            print(f"[TASK SKILL] Trying API key {idx}/{len(API_KEYS)} for role '{role}'")
            raw = _call_gemini(prompt, api_key)
            print(f"[TASK SKILL RAW] Length: {len(raw)} | First 200: {raw[:200]}")
            skills = _parse_json_response(raw)
            cleaned = list(dict.fromkeys([str(s).strip() for s in skills if str(s).strip()]))
            print(f"[TASK SKILL] Extracted {len(cleaned)} skills for '{role}' (key {idx}) → {cleaned}")
            return cleaned[:25]

        except Exception as e:
            error_str = str(e)
            print(f"[TASK SKILL ERROR] Key {idx} failed: {error_str}")
            if "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                continue
            break

    print(f"[TASK SKILL] All keys failed for role '{role}' — using fallback skills")
    # Generic fallback so chips are never empty. Covers most software roles.
    fallback = [
        "Python", "JavaScript", "SQL", "REST API", "Docker",
        "Git", "CI/CD", "PostgreSQL", "AWS", "Linux",
        "Testing", "Agile", "Communication", "Problem Solving",
    ]
    return fallback