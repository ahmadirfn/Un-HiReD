"""Small local PDF/DOCX text extractor for the resume intake endpoint."""

from io import BytesIO
import importlib
from pathlib import Path
import re
import sys


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

# Only canonical names and unambiguous written aliases are accepted. Matching
# uses word boundaries so, for example, "AI" does not match "email" and
# "SQL" does not match "NoSQL".
SKILL_ALIASES = {
    "JavaScript": ("JS",),
    "TypeScript": ("TS",),
    "Next.js": ("NextJS",),
    "Power BI": ("PowerBI",),
    "OpenAI API": ("OpenAI API",),
    "HTML/CSS": ("HTML/CSS",),
}


def _load_resume_dependency(module_name: str):
    """Load a parser dependency, falling back to this backend's matching venv.

    This keeps resume uploads working if Uvicorn was accidentally started from
    the machine-wide Python instead of Amad/backend/.venv. The fallback is only
    used when the virtual environment was built with the same Python version.
    """
    try:
        return importlib.import_module(module_name)
    except ModuleNotFoundError as original_error:
        backend_dir = Path(__file__).resolve().parent
        venv_dir = backend_dir / ".venv"
        config_path = venv_dir / "pyvenv.cfg"
        site_packages = venv_dir / "Lib" / "site-packages"

        version_match = re.search(
            r"(?m)^version\s*=\s*(\d+)\.(\d+)",
            config_path.read_text(encoding="utf-8") if config_path.is_file() else "",
        )
        same_python_version = bool(
            version_match
            and (int(version_match.group(1)), int(version_match.group(2)))
            == sys.version_info[:2]
        )
        if not same_python_version or not site_packages.is_dir():
            raise original_error

        site_packages_path = str(site_packages)
        if site_packages_path not in sys.path:
            sys.path.insert(0, site_packages_path)
        return importlib.import_module(module_name)


def _explicitly_mentioned(skill: str, text: str) -> bool:
    terms = (skill, *SKILL_ALIASES.get(skill, ()))
    return any(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text, flags=re.IGNORECASE)
        for term in terms
    )


def _extract_text(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()
    if extension == ".pdf":
        PdfReader = _load_resume_dependency("pypdf").PdfReader
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as exc:
                raise ValueError("This PDF is password-protected. Upload an unlocked copy.") from exc
            if reader.is_encrypted:
                raise ValueError("This PDF is password-protected. Upload an unlocked copy.")
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if not text.strip():
            raise ValueError(
                "No selectable text was found in this PDF. If it is a scanned image, upload a text-based PDF or DOCX copy."
            )
        return text
    if extension == ".docx":
        Document = _load_resume_dependency("docx").Document
        document = Document(BytesIO(content))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        if not text.strip():
            raise ValueError("No text was found in this DOCX file.")
        return text
    raise ValueError("Upload a PDF or DOCX resume.")


def parse_resume(filename: str, content: bytes) -> dict:
    """Extract likely profile fields without sending resume text to an LLM."""
    text = _extract_text(filename, content)
    normalized = re.sub(r"\s+", " ", text).strip()

    # This extraction is intentionally deterministic: no job-title inference,
    # LLM completion, or substring matching. A skill is emitted only when its
    # written name or an explicit alias occurs in the extracted document text.
    skills = [skill for skill in KNOWN_SKILLS if _explicitly_mentioned(skill, normalized)]

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
        "extracted_skills": skills,
        "suggested_roles": [],
        "current_skills": skills,
        "years_experience": int(experience_match.group(1)) if experience_match else 0,
        "extraction_note": (
            "Review the extracted fields before analyzing; resume formats may vary."
        ),
    }
