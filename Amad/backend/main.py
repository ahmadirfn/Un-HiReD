import json
import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field
from starlette.concurrency import run_in_threadpool

from resume_parser import parse_resume


load_dotenv()


class UserIntake(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    firstName: str
    goal: str
    situation: str
    experience: str
    techStack: list[str]


class RoleMatch(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    roleName: str
    matchScore: int = Field(ge=0, le=100)
    skillsGap: list[str]
    demandTrajectory: str


class SdgAlignment(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    sdgNumber: Literal[4, 8, 9]
    alignmentScore: int = Field(ge=0, le=100)
    impactDescription: str


class DashboardResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    roles: list[RoleMatch]
    sdgs: list[SdgAlignment]


app = FastAPI(
    title="Aiversecity Future-Ready Workforce Co-Pilot",
    description="Career recommendations and SDG alignment based on a user's intake profile.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _generate_dashboard(intake: UserIntake) -> dict:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured. Add it to the backend environment and restart FastAPI.",
        )

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
    )
    system_prompt = """You are an elite Future-Ready Workforce Co-Pilot.
Analyze the user's goal, situation, experience, and current tech stack. Recommend
ambitious, high-growth, future-ready technology roles that strategically build on
the user's existing baseline. Include 3 to 5 distinct ranked roles. Scores must be
integer match estimates from 0 to 100; skill gaps must be concise, actionable
skills the person should build; demandTrajectory should briefly describe the role's
expected market direction without inventing precise statistics or citing unsupported
data. Include one alignment for each UN Sustainable Development Goal 4, 8, and 9:
4 Quality Education, 8 Decent Work and Economic Growth, and 9 Industry, Innovation
and Infrastructure. Give each an integer alignment score from 0 to 100 and a brief,
specific impact description. Return only valid raw JSON, without markdown fences or
additional text, matching this exact schema:
{"roles":[{"roleName":"str","matchScore":0,"skillsGap":["str"],"demandTrajectory":"str"}],
"sdgs":[{"sdgNumber":4,"alignmentScore":0,"impactDescription":"str"}]}.
Use only SDG numbers 4, 8, and 9, and include each of those three goals."""
    user_message = "Career intake profile:\n" + intake.model_dump_json(indent=2)

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Groq returned an empty response.")
        data = json.loads(content)
        DashboardResponse.model_validate(data)
    except Exception as exc:
        print(f"Groq recommendation request failed: {exc!r}", flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Groq request failed: {exc}",
        ) from exc
    return data


@app.post("/api/recommendation", response_model=DashboardResponse)
async def get_recommendation(intake: UserIntake) -> DashboardResponse:
    """Generate ranked role and UN SDG recommendations from onboarding intake."""
    return await run_in_threadpool(_generate_dashboard, intake)


@app.post("/api/resume/parse")
async def parse_uploaded_resume(
    request: Request,
    file: UploadFile | None = File(default=None),
) -> dict | DashboardResponse:
    """Parse an optional resume, or accept a JSON intake profile as fallback."""
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
        raise HTTPException(status_code=415, detail="Send a PDF/DOCX upload or a JSON intake profile.")

    try:
        intake = UserIntake.model_validate(payload)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="The intake profile does not match the expected fields.") from exc
    return await run_in_threadpool(_generate_dashboard, intake)
