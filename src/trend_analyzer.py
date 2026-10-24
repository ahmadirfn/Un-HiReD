from pathlib import Path
import re

import pandas as pd

DATA_PATH = Path(__file__).resolve().parent / "data" / "job_trends.csv"


def _normalize(value: str) -> str:
    """Normalize whitespace and case for reliable exact-name matching."""
    return re.sub(r"\s+", " ", value).strip().casefold()


def analyze_skills_gap(user_skills: list[str], target_role: str) -> dict:
    """Find trend rows matching the user's skills or target role.

    Matching is case-insensitive and ignores repeated/leading whitespace. Role
    matching is restricted to rows whose category is ``Role``; skills match
    rows whose category is ``Skill``. Citations are de-duplicated by source.
    """
    df = pd.read_csv(DATA_PATH, dtype=str, keep_default_na=False)

    skills = {_normalize(skill) for skill in user_skills if skill.strip()}
    role = _normalize(target_role)

    normalized_names = df["skill_or_role"].map(_normalize)
    categories = df["category"].str.casefold()
    matched = df.loc[
        ((categories == "skill") & normalized_names.isin(skills))
        | ((categories == "role") & (normalized_names == role))
    ]

    matched_trends = matched[
        ["skill_or_role", "demand_change_pct", "demand_status"]
    ].to_dict(orient="records")
    citations = matched[
        ["source_name", "source_url", "last_updated", "sample_size"]
    ].drop_duplicates().to_dict(orient="records")

    return {"matched_trends": matched_trends, "citations": citations}
