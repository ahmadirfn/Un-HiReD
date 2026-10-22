"""Small local PDF/DOCX text extractor for the resume intake endpoint."""

from io import BytesIO
from pathlib import Path
import re


KNOWN_SKILLS = [
    "HTML/CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Python",
    "SQL",
    "Pandas",
    "FastAPI",
    "Machine Learning",
    "Data Analysis",
    "Data Visualization",
    "Git",
    "Docker",
    "AWS",
    "Azure",
    "Project Management",
    "Communication",
    "Prompt Engineering",
    "OpenAI API",
    "LLM",
    "Vector Databases",
    "Power BI",
    "Excel",
]


def _extract_text(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()
    if extension == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if extension == ".docx":
        from docx import Document

        document = Document(BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    raise ValueError("Upload a PDF or DOCX resume.")


def parse_resume(filename: str, content: bytes) -> dict:
    """Extract likely profile fields without sending resume text to an LLM."""
    text = _extract_text(filename, content)
    normalized = re.sub(r"\s+", " ", text).strip()

    skills = [
        skill
        for skill in KNOWN_SKILLS
        if re.search(re.escape(skill), normalized, flags=re.IGNORECASE)
    ]

    role_match = re.search(
        r"(?:current\s+)?(?:job\s+)?title\s*[:\-]\s*([^\n|;]{2,80})",
        text,
        flags=re.IGNORECASE,
    )
    experience_match = re.search(
        r"(\d{1,2})\+?\s+years?\s+(?:of\s+)?(?:professional\s+)?experience",
        normalized,
        flags=re.IGNORECASE,
    )

    return {
        "current_role": role_match.group(1).strip() if role_match else "",
        "current_skills": skills,
        "years_experience": int(experience_match.group(1)) if experience_match else 0,
        "extraction_note": (
            "Review the extracted fields before analyzing; resume formats may vary."
        ),
    }
