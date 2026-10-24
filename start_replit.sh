#!/usr/bin/env bash
set -euo pipefail

python -m pip install -r requirements.txt
npm --prefix frontend ci

python -m uvicorn main:app --app-dir src --host 0.0.0.0 --port 8000 &
backend_pid=$!
cleanup() {
  kill "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm --prefix frontend run dev -- --hostname 0.0.0.0
