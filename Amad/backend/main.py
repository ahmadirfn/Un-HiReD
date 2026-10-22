from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from llm_engine import generate_reskilling_pathway
from trend_analyzer import analyze_skills_gap

app = FastAPI(
    title="AI-Trend Signal Layer",
    description="Returns job trend matches and evidence-based reskilling recommendations.",
    version="1.0.0",
)


class UserProfile(BaseModel):
    current_skills: list[str] = Field(default_factory=list)
    target_role: str


@app.post("/api/trends")
def get_trends(profile: UserProfile) -> dict:
    """Analyze the supplied profile against the bundled trend dataset."""
    return analyze_skills_gap(profile.current_skills, profile.target_role)


@app.post("/api/recommendation")
def get_recommendation(profile: UserProfile) -> dict:
    """Return trend evidence and an AI-generated reskilling recommendation."""
    profile_data = profile.model_dump()
    trend_data = analyze_skills_gap(
        profile_data["current_skills"], profile_data["target_role"]
    )

    try:
        analysis = generate_reskilling_pathway(profile_data, trend_data)
    except RuntimeError as exc:
        # Missing API key and empty model output are configuration/upstream issues.
        status_code = 503 if "OPENAI_API_KEY" in str(exc) else 502
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Recommendation generation failed: {exc}",
        ) from exc

    return {"trends": trend_data, "analysis": analysis}
