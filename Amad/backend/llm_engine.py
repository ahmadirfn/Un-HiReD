import json
import os

from openai import OpenAI


def _mock_recommendation() -> dict:
    """Return a local demo response when no OpenAI API key is configured."""
    return {
        "match_score": 75,
        "alternative_roles": [
            {
                "role": "Data Engineer",
                "match_score": 72,
                "reason": "Builds on programming and data skills to create reliable pipelines for AI products.",
            },
            {
                "role": "AI Product Manager",
                "match_score": 68,
                "reason": "Combines technical familiarity with planning and delivery of useful AI features.",
            },
        ],
        "skills_gap": [
            "Python for Data Analysis",
            "Vector Databases",
            "LLM Orchestration",
        ],
        "pathway": [
            {"step": 1, "title": "Learn Python Data Basics", "resource": "Kaggle Python Course (Free)"},
            {"step": 2, "title": "Master Prompt Engineering & OpenAI API", "resource": "DeepLearning.AI ChatGPT Prompt Engineering (Free)"},
            {"step": 3, "title": "Build RAG Systems & Agents", "resource": "FreeCodeCamp Full AI Engineer Course"},
        ],
        "sdg_mapping": [
            {
                "sdg": 4,
                "name": "Quality Education",
                "details": "Provides continuous technical learning opportunities.",
                "alignment_score": 78,
                "impact_indicator": "Access to continuing technical education",
            },
            {
                "sdg": 8,
                "name": "Decent Work & Economic Growth",
                "details": "Supports transitions into evolving digital roles.",
                "alignment_score": 72,
                "impact_indicator": "Preparation for changing work opportunities",
            },
            {
                "sdg": 9,
                "name": "Industry, Innovation and Infrastructure",
                "details": "Builds skills that can contribute to responsible digital innovation.",
                "alignment_score": 64,
                "impact_indicator": "Capacity to support inclusive digital innovation",
            },
        ],
        "uncertainty_scenarios": {
            "moderate_disruption": "Full-stack web skills remain relevant; AI tools may change task workflows.",
            "fast_disruption": "More routine coding tasks may be automated, increasing the value of AI engineering skills.",
        },
        "scenario_resilience": [
            {
                "scenario": "Rapid AI Automation",
                "resilience_score": 58,
                "rationale": "Illustrative estimate: adaptable software and AI skills partly offset faster task automation.",
            },
            {
                "scenario": "Economic Recession",
                "resilience_score": 62,
                "rationale": "Illustrative estimate: transferable technical skills support movement across teams and industries.",
            },
            {
                "scenario": "Green Tech Boom",
                "resilience_score": 79,
                "rationale": "Illustrative estimate: digital skills may transfer to growing climate technology work.",
            },
        ],
    }


def generate_reskilling_pathway(profile_data: dict, trend_data: dict) -> dict:
    """Generate a structured recommendation, or return a local demo response."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _mock_recommendation()

    client = OpenAI(api_key=api_key)

    system_prompt = """You are a careful career and reskilling analyst. Return only a valid JSON object matching the requested schema.

Evidence and safety rules:
- Do NOT invent courses, certifications, providers, URLs, job-market metrics, or source details. Recommend only free or low-cost resources you can identify reliably; if you cannot verify a specific resource, give a general learning activity and set its resource_url to an empty string.
- Cite only exact source records supplied in trend_data.citations. Copy source_name, source_url, last_updated, and sample_size exactly. If no citation records are supplied, state that trend evidence has no citation available; do not create one.
- Treat matched_trends as the only supplied trend evidence. Do not infer a numeric growth rate from a qualitative value such as 'N/A - qualitative projection'.
- Explain how each provided current skill maps to the target role. Calculate an explainable match_score from 0 to 100 using a transparent rubric based on the supplied profile and role requirements; distinguish assumptions from sourced facts.
- Based on current skills, recommend and rank exactly 2 relevant future AI roles. For each, provide match_score from 0 to 100 and a brief one-sentence fit reason. Return highest match first.
- List the exact skills gap. If role requirements cannot be established from inputs, make that limitation explicit and mark inferred gaps as assumptions.
- Provide an ordered learning pathway of 3 or 4 practical steps using free or low-cost resources. Never fabricate named resources.
- Map the pathway to UN SDGs 4, 8, and 9 with cautious justifications. For each, include an illustrative alignment_score from 0 to 100 and an impact_indicator. Do not claim a career automatically achieves an SDG.
- Include Moderate AI Disruption and Fast AI Disruption uncertainty explanations, with assumptions and qualitative estimated impacts. Do not invent sourced-looking market statistics.
- Also provide scenario_resilience estimates for Rapid AI Automation, Economic Recession, and Green Tech Boom. Each item must contain scenario, resilience_score (0-100), and rationale. Label these as illustrative model estimates, not measured labor-market statistics.

Return these top-level keys:
{
  "match_score": integer,
  "match_score_explanation": string,
  "alternative_roles": [{"role": string, "match_score": number, "reason": string}],
  "skill_mapping": [{"current_skill": string, "relevance": string}],
  "skills_gap": [{"skill": string, "reason": string, "evidence_type": "provided" or "assumption"}],
  "reskilling_pathway": [{"step": integer, "objective": string, "skills": [string], "activity": string, "resource_name": string, "resource_url": string, "cost_note": string}],
  "sdg_alignment": [{"sdg": "SDG 4, SDG 8, or SDG 9", "goal": string, "justification": string, "alignment_score": integer, "impact_indicator": string}],
  "uncertainty_scenarios": [{"scenario": string, "assumptions": [string], "estimated_impact": string}],
  "scenario_resilience": [{"scenario": string, "resilience_score": integer, "rationale": string}],
  "citations": [{"source_name": string, "source_url": string, "last_updated": string, "sample_size": string}]
}
Copy supplied citation records exactly. Scores must be integers in the stated range. Do not add markdown or prose outside the JSON object."""

    user_content = {"profile_data": profile_data, "trend_data": trend_data}
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_content, ensure_ascii=False)},
        ],
    )

    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("The model returned an empty response")
    return json.loads(content)
