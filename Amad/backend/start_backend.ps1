$ErrorActionPreference = "Stop"

$backendDir = $PSScriptRoot
$python = Join-Path $backendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Backend virtual environment not found at $python. Create it with: py -3.13 -m venv .venv"
}

Set-Location $backendDir

# Keep the API and its resume parser on the same interpreter. In particular,
# pypdf must be installed in this venv for PDF uploads to work.
& $python -c "import fastapi, uvicorn, pypdf, docx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing backend dependencies into the backend virtual environment..."
    & $python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        throw "Dependency installation failed. Check your network and rerun this script."
    }
}

& $python -m uvicorn main:app --reload
