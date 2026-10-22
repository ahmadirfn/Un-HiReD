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
            {
                "step": 1,
                "title": "Learn Python Data Basics",
                "resource": "Kaggle Python Course (Free)",
            },
            {
                "step": 2,
                "title": "Master Prompt Engineering & OpenAI API",
                "resource": "DeepLearning.AI ChatGPT Prompt Engineering (Free)",
            },
            {
                "step": 3,
                "title": "Build RAG Systems & Agents",
                "resource": "FreeCodeCamp Full AI Engineer Course",
            },
        ],
        "sdg_mapping": [
            {
                "sdg": 4,
                "name": "Quality Education",
                "details": "Provides continuous technical learning opportunities.",
            },
            {
                "sdg": 8,
                "name": "Decent Work & Economic Growth",
                "details": "Transitions traditional web developers into high-demand AI roles.",
            },
        ],
        "uncertainty_scenarios": {
            "moderate_disruption": "Full-stack web skills remain relevant, AI adds 25% efficiency.",
            "fast_disruption": "Pure frontend coding heavily automated; AI engineering becomes essential within 18 months.",
        },
    }


def generate_reskilling_pathway(profile_data: dict, trend_data: dict) -> dict:
    """Generate a structured, evidence-bounded reskilling recommendation.

    Returns a local mock recommendation when ``OPENAI_API_KEY`` is missing or
    blank. Otherwise, returns a parsed JSON response from gpt-4o.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _mock_recommendation()

    client = OpenAI(api_key=api_key)

    system_prompt = """You are a careful career and reskilling analyst. Return only a valid JSON object matching the requested schema.

Evidence and safety rules:
- Do NOT invent courses, certifications, providers, URLs, job-market metrics, or source details. Recommend only free or low-cost resources you can identify reliably; if you cannot verify a specific resource, give a general learning activity and set its resource_url to an empty string.
- Cite only exact source records supplied in trend_data.citations. Copy source_name, source_url, last_updated, and sample_size exactly. If no citation records are supplied, state that the trend evidence has no citation available; do not create one.
- Treat matched_trends as the only supplied trend evidence. Do not infer a numeric growth rate from a qualitative value such as 'N/A - qualitative projection'.
- Explain how each provided current skill maps to the target role. Calculate an explainable match_score from 0 to 100 using a transparent rubric based on the supplied profile and role requirements; list the role skills used by the rubric and distinguish assumptions from sourced facts. Do not claim an authoritative job taxonomy if none was supplied.
- Based on the user's current skills, recommend and rank 2 alternative highly-relevant future AI roles. Provide a match score from 0 to 100 and a brief one-sentence reason why each role fits. Return them in rank order, highest match first.
- List the exact skills gap. If role requirements cannot be established from the inputs, make that limitation explicit and mark inferred gap items as assumptions.
- Provide an ordered learning_pathway of 3 or 4 practical steps, each with objective, skills, activity, resource_name, resource_url, and cost_note. Prefer free or low-cost resources and never fabricate named resources.
- Map the career path to UN SDG 4 and SDG 8 with explicit, cautious justifications. Do not claim that an individual career automatically achieves an SDG.
- Provide two uncertainty scenarios, including 'Moderate AI Disruption' and 'Fast AI Disruption'. For each, describe the assumptions and qualitative estimated impact. Do not invent percentages or forecast figures; use labeled qualitative levels when the inputs do not support numbers.

Return these top-level keys:
{
  "match_score": integer,
  "match_score_explanation": string,
  "alternative_roles": [{"role": "string", "match_score": number, "reason": "string"}, {"role": "string", "match_score": number, "reason": "string"}],
  "skill_mapping": [{"current_skill": string, "relevance": string}],
  "skills_gap": [{"skill": string, "reason": string, "evidence_type": "provided" or "assumption"}],
  "reskilling_pathway": [{"step": integer, "objective": string, "skills": [string], "activity": string, "resource_name": string, "resource_url": string, "cost_note": string}],
  "sdg_alignment": [{"sdg": "SDG 4" or "SDG 8", "goal": string, "justification": string}],
  "uncertainty_scenarios": [{"scenario": string, "assumptions": [string], "estimated_impact": string}],
  "citations": [{"source_name": string, "source_url": string, "last_updated": string, "sample_size": string}]
}
Citations in the output must be exact copies of supplied citation records. The match score must be an integer between 0 and 100. Do not add markdown or prose outside the JSON object."""

    user_content = {
        "profile_data": profile_data,
        "trend_data": trend_data,
    }
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": json.dumps(user_content, ensure_ascii=False),
            },
        ],
    )

    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("The model returned an empty response")
    return json.loads(content)
