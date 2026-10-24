"""Reserved RunPod integration point.

The current application does not call RunPod. Model inference is currently
handled by Groq from the FastAPI service in ``src/main.py``. Implement and
validate a RunPod Serverless handler here only if the deployment architecture
is deliberately migrated to RunPod.
"""


def handler(event: dict) -> dict:
    """Fail clearly rather than pretending a RunPod workload is configured."""
    raise NotImplementedError(
        "RunPod is not configured for this project; the current AI provider is Groq."
    )
