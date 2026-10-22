import json

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field, ValidationError
from starlette.concurrency import run_in_threadpool

from llm_engine import generate_reskilling_pathway
from resume_parser import parse_resume
from trend_analyzer import analyze_skills_gap

app = FastAPI(
    title="AI-Trend Signal Layer",
    description="Returns job trend matches and evidence-based reskilling recommendations.",
    version="1.0.0",
)


class UserProfile(BaseModel):
    current_skills: list[str] = Field(default_factory=list)
    target_role: str
    current_role: str = ""
    years_experience: int = Field(default=0, ge=0)
    first_name: str = ""
    career_goal: str = ""
    current_situation: str = ""
    experience_level: str = ""


def _build_recommendation(profile: UserProfile) -> dict:
    profile_data = profile.model_dump()
    trend_data = analyze_skills_gap(
        profile_data["current_skills"], profile_data["target_role"]
    )
    try:
        analysis = generate_reskilling_pathway(profile_data, trend_data)
    except RuntimeError as exc:
        status_code = 503 if "OPENAI_API_KEY" in str(exc) else 502
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Recommendation generation failed: {exc}",
        ) from exc
    return {"trends": trend_data, "analysis": analysis}


@app.post("/api/resume/parse")
async def parse_uploaded_resume(
    request: Request,
    file: UploadFile | None = File(default=None),
) -> dict:
    """Parse an optional resume, or generate a dashboard from a JSON profile."""
    if file is not None:
        filename = file.filename or ""
        if not filename.lower().endswith((".pdf", ".docx")):
            raise HTTPException(status_code=415, detail="Upload a PDF or DOCX resume.")

        content = await file.read(10 * 1024 * 1024 + 1)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Resume must be 10 MB or smaller.")
        try:
            return parse_resume(filename, content)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=422,
                detail="Could not read this resume. Check that the file is a valid PDF or DOCX.",
            ) from exc

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            payload = await request.json()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Request body must contain valid JSON.") from exc
    elif "multipart/form-data" in content_type:
        form = await request.form()
        raw_profile = form.get("profile_data")
        if not isinstance(raw_profile, str):
            raise HTTPException(
                status_code=400,
                detail="When no resume is uploaded, include profile_data as a JSON form field.",
            )
        try:
            payload = json.loads(raw_profile)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="profile_data must contain valid JSON.") from exc
    else:
        raise HTTPException(
            status_code=415,
            detail="Send a PDF/DOCX multipart upload or a JSON profile.",
        )

    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="The profile payload must be a JSON object.")
    try:
        profile = UserProfile.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc

    # A skipped resume still produces the same full trends and recommendation payload.
    return await run_in_threadpool(_build_recommendation, profile)


@app.post("/api/trends")
def get_trends(profile: UserProfile) -> dict:
    """Analyze the supplied profile against the bundled trend dataset."""
    return analyze_skills_gap(profile.current_skills, profile.target_role)


@app.post("/api/recommendation")
def get_recommendation(profile: UserProfile) -> dict:
    """Return trend evidence and an AI-generated reskilling recommendation."""
    return _build_recommendation(profile)
