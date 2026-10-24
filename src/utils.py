"""Convenience exports for the backend's local data and resume utilities."""

if __package__:
    from .resume_parser import parse_resume
    from .trend_analyzer import analyze_skills_gap
else:
    from resume_parser import parse_resume
    from trend_analyzer import analyze_skills_gap

__all__ = ["analyze_skills_gap", "parse_resume"]
