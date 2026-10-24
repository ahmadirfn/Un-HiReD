"""Unit tests for local trend matching and deterministic resume extraction."""

from io import BytesIO
import unittest

from docx import Document

from src.utils import analyze_skills_gap, parse_resume


class TrendAnalysisTests(unittest.TestCase):
    def test_matches_skill_and_role_and_returns_source_metadata(self) -> None:
        result = analyze_skills_gap(["  AI   AND BIG DATA  "], "big data specialist")

        self.assertEqual(
            [row["skill_or_role"] for row in result["matched_trends"]],
            ["AI and big data", "Big Data Specialist"],
        )
        self.assertEqual(len(result["citations"]), 1)
        self.assertEqual(
            result["citations"][0]["source_name"],
            "World Economic Forum Future of Jobs Report 2025",
        )

    def test_does_not_match_partial_skill_names(self) -> None:
        result = analyze_skills_gap(["big"], "not a listed role")

        self.assertEqual(result["matched_trends"], [])
        self.assertEqual(result["citations"], [])


class ResumeParsingTests(unittest.TestCase):
    def test_extracts_only_explicitly_mentioned_skills_from_docx(self) -> None:
        document = Document()
        document.add_paragraph(
            "Data Analyst with Python and SQL experience. "
            "Worked with email workflows and cross-functional teams."
        )
        content = BytesIO()
        document.save(content)

        result = parse_resume("synthetic-resume.docx", content.getvalue())

        self.assertEqual(result["extracted_skills"], ["Python", "SQL"])
        self.assertEqual(result["current_skills"], ["Python", "SQL"])

    def test_rejects_unsupported_file_types(self) -> None:
        with self.assertRaisesRegex(ValueError, "Upload a PDF or DOCX resume"):
            parse_resume("synthetic-resume.txt", b"Python and SQL")


if __name__ == "__main__":
    unittest.main()
