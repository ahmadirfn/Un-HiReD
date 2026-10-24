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


class LearningResource(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    platform: str
    title: str
    url: str


class RoleMatch(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    roleName: str
    matchScore: int = Field(ge=0, le=100)
    skillsGap: list[str]
    demandTrajectory: str
    resources: list[LearningResource]


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
    title="Un-HiReD Future-Ready Workforce Co-Pilot",
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
integer match estimates from 0 to 100. `skillsGap` must be a flat array of short,
simple skill or tool names only, such as ["Django", "SQL", "Git"]. Do not use
categories, nested data, or long descriptions in skillsGap. `demandTrajectory` must
be an extremely brief, accessible phrase of typically 4 to 8 words, such as
"Growing demand for developers", "High demand for data experts", or "Increasing
need for digital administrators". Do not include explanations, statistics, or
unsupported claims in this field.

For every role, include 2 useful learning resources. Each resource must have a
platform, a concise title, and a real, transparent HTTPS search URL. NEVER guess
specific course URLs or slugs. You must ONLY generate search query URLs for learning
platforms, using one of these exact formats and replacing the bracketed text with a
short, beginner-friendly topic:
Udemy: https://www.udemy.com/courses/search/?q=[topic+name]
Coursera: https://www.coursera.org/search?query=[topic+name]
YouTube: https://www.youtube.com/results?search_query=[topic+name]
edX: https://www.edx.org/search?q=[topic+name]
Encode spaces in the query as + or %20, remove the square brackets from the final
URL, and use the matching platform name in the `platform` field. Never provide a
homepage URL, direct course URL, video URL, or any URL outside these search formats.
Include one alignment for each UN Sustainable Development Goal 4, 8, and 9:
4 Quality Education, 8 Decent Work and Economic Growth, and 9 Industry, Innovation
and Infrastructure. Give each an integer alignment score from 0 to 100 and a brief,
specific impact description. Return only valid raw JSON, without markdown fences or
additional text, matching this exact schema:
{"roles":[{"roleName":"str","matchScore":0,"skillsGap":["str"],"demandTrajectory":"brief 4-8 word insight","resources":[{"platform":"str","title":"str","url":"HTTPS learning-platform search query URL"}]}],
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
    resume: UploadFile | None = File(default=None),
) -> dict | DashboardResponse:
    """Parse an optional resume, or accept a JSON intake profile as fallback."""
    target_file = file or resume
    if target_file is not None:
        filename = target_file.filename or ""
        if not filename.lower().endswith((".pdf", ".docx")):
            raise HTTPException(status_code=415, detail="Upload a PDF or DOCX resume.")
        content = await target_file.read(10 * 1024 * 1024 + 1)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Resume must be 10 MB or smaller.")
        try:
            return parse_resume(filename, content)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            print(
                f"Resume parsing failed for {filename!r}: {type(exc).__name__}: {exc}",
                flush=True,
            )
            raise HTTPException(
                status_code=422,
                detail=f"Could not read this resume ({type(exc).__name__}): {exc}",
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
                status_code=422,
                detail="No resume file was provided in the upload form. Send it as 'file' or 'resume'.",
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
