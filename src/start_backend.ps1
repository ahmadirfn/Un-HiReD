$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot ".venv\Scripts\python.exe"
$requirements = Join-Path $repoRoot "requirements.txt"

if (-not (Test-Path $python)) {
    throw "Root virtual environment not found at $python. From the repository root run: py -3.13 -m venv .venv"
}

Set-Location $PSScriptRoot

# Use the root environment and dependencies for the API and resume parser.
& $python -c "import fastapi, uvicorn, pypdf, docx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing backend dependencies into the root virtual environment..."
    & $python -m pip install -r $requirements
    if ($LASTEXITCODE -ne 0) {
        throw "Dependency installation failed. Check your network and rerun this script."
    }
}

# Start from src so main.py and its adjacent data directory resolve correctly.
& $python -m uvicorn main:app --host 127.0.0.1 --port 8000
