> [!IMPORTANT]
> ## Submission Documents & Templates
> Download the official submission templates from the [SDC2026 Google Drive folder](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef) before completing your submission.

# Un-HiReD — Future-Ready Workforce Co-Pilot

An AI career co-pilot that helps people in Malaysia connect their current skills to possible future roles and practical learning steps.

---

## Team Information

| Field | Details |
|---|---|
| **Team Name** | FAA! |
| **Team Domain** | Domain 1 |
| **SDG Track (1–17)** | SDG 4 — Quality Education (4.4) & SDG 8 — Decent Work and Economic Growth (8.5) |
| **Team Leader** | Ahmad Irfan |
| **University** | UiTM |
| **Number of Members** | 3 |

## Links

| Resource | Link |
|---|---|
| GitHub Repository | https://github.com/ahmadirfn/Un-HiReD |
| Live Demo | https://unhired.replit.app/ |
| RunPod Endpoint | Not configured; current model calls use Groq |
| Slide Deck | https://drive.google.com/file/d/1RMKxaZ0wNvgjsHBdWz5TfUuLZK0-jLCk/view?usp=drive_link |
| Demo Video | https://youtu.be/6vslDEpJsvA |

---

## Overview

### Problem

People entering the workforce or changing careers may not know which roles fit their current skills, which skills to build next, or how changing technology may affect their options. This can make career planning feel unclear and difficult to act on.

### Solution

Un-HiReD collects a person's goals, situation, experience, and skills. It compares that profile with a local job-trend dataset, then provides ranked role options, explains skill gaps, and suggests learning steps. Resume upload is optional.

### Key Features

- **Skills profile intake** — Collects profile details through a guided form and can extract explicitly mentioned skills from a PDF or DOCX resume.
- **AI trend signal layer** — Reads source-labelled trend records from `src/data/job_trends.csv` using Pandas.
- **Future-role matching** — Ranks role options and provides match scores, skill gaps, and a scoring explanation.
- **Personalized learning pathway** — Shows ordered skill steps, estimated times, and learning links.
- **SDG mapping** — Shows potential alignment with Sustainable Development Goals 4, 8, and 9.
- **Future scenarios** — Presents illustrative resilience estimates under different scenarios.
- **Job and resume tools** — Compares profile skills with a job description and suggests resume bullet improvements.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Pandas |
| Database | Local CSV file with source metadata; IndexedDB for the uploaded resume; localStorage and sessionStorage for profile-related data |
| AI / Compute | Groq API using the `openai/gpt-oss-20b` model identifier and the OpenAI-compatible Python SDK |
| Hosting / Dev | Replit |

## Project Structure

```text
.
├── docs/                                      # Project documentation and screenshots
├── frontend/                                  # Next.js application
├── runpod/
│   └── handler.py                             # Reserved; RunPod is not integrated
├── src/
│   ├── data/job_trends.csv                    # Local trend records and citations
│   ├── main.py                                # FastAPI application and API routes
│   ├── resume_parser.py                       # In-memory PDF/DOCX text and skill extraction
│   ├── trend_analyzer.py                      # Pandas CSV analysis
│   ├── utils.py                               # Convenience exports
│   └── start_backend.ps1                      # Local Windows backend launcher
├── submission/                                # Submission documents
│   ├── SDC2026_TeamName_Preliminary.pdf
│   ├── SDC2026_TeamName_TechDeclaration.pdf
│   ├── SDC2026_TeamName_Replit_POU.pdf
│   └── SDC2026_TeamName_Runpod_POU.pdf
├── tests/
│   └── test_utils.py
├── .env.example                               # Example environment variables
├── .gitignore
├── .replit                                    # Replit run configuration
├── LICENSE
├── README.md
├── requirements.txt
└── start_replit.sh
```

## Architecture

```text
User → Next.js interface → FastAPI API → Pandas + local CSV
                                ├── Resume parser (in-memory PDF/DOCX parsing)
                                └── Groq API (when GROQ_API_KEY is configured)

API response → Next.js dashboard → User
```

The browser stores the uploaded resume in IndexedDB and selected profile data in browser storage. The resume is also sent to FastAPI for parsing; the backend reads its bytes in memory and does not save the file to a server database or permanent disk storage. Recommendations use the local CSV and, when configured, a Groq model call. Resume parsing itself is deterministic and does not use the LLM.

## How to Run

### Option 1 — Run on Replit

1. Import this GitHub repository into Replit.
2. Add `GROQ_API_KEY` under Replit Secrets if you want Groq-powered recommendations and analysis. Do not put the key in source files.
3. Run the repl. The `.replit` file starts the FastAPI backend and Next.js frontend through `start_replit.sh`.
4. Open the web preview on port 3000. The FastAPI service listens on port 8000.

Replit compatibility and configuration are included in the repository. A public deployment URL and proof of Replit use should be added only after they exist.

### Option 2 — Run Locally

From the repository root in PowerShell:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
if (-not (Test-Path .\src\.env)) { Copy-Item .env.example .\src\.env }
```

Add your own `GROQ_API_KEY` to `src/.env`. Keep that file private and do not commit it.

In the first terminal, start FastAPI:

```powershell
cd src
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, start Next.js:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. FastAPI documentation is available at `http://127.0.0.1:8000/docs`.

## How We Use Replit *(Required)*

This repository includes a `.replit` run configuration and a startup script for the frontend and API. Fill in the details below with the team's actual usage before submission:

- **Development:** [Describe how the team used Replit, if applicable.]
- **Hosting:** [Add the Replit deployment URL and deployment details, if deployed.]
- **Secrets:** Store `GROQ_API_KEY` in Replit Secrets; never commit API keys.

Proof of use: [`submission/SDC2026_FAA!_Replit_POU.pdf`](https://drive.google.com/file/d/12nAKI9MNmUojqtB-IUOBo3uTXLGXGbOP/view?usp=drive_link)

## How We Use RunPod *(Required by the supplied template)*

RunPod is **not integrated in the current application**. The backend currently calls Groq directly for model inference; there is no RunPod endpoint, GPU workload, or RunPod API configuration. `runpod/handler.py` is an explicit reserved placeholder, not a working serverless handler. Do not claim RunPod use or submit fabricated proof. If RunPod use is required for the final submission, integrate and verify a real endpoint first.


## Challenges & Learnings

- Keeping resume skill extraction grounded in text explicitly present in the uploaded file.
- Connecting a user's skills to role options while showing how match scores and gaps are estimated.
- Distinguishing source-backed trend data from model-generated estimates and keeping scenario assumptions visible.
- Supporting a multi-language interface while preserving usable layouts across devices.

## Future Improvements

- [ ] Connect one consistently cited Malaysian labour-market source and document its update schedule.
- [ ] Add a Malaysian job source for non-tech skills (accounting, engineering, HR) 
- [ ] Validate role scores and pathway estimates with Malaysian career advisers and employers.
- [ ] Curate verified free or low-cost local learning programmes, including eligible HRD Corp options.
- [ ] Add evaluation coverage and automated tests for parsing, scoring, and API response contracts.

## Team

| Name | Role | GitHub |
|---|---|---|
| [Ahmad Irfan] | Team Lead / Backend | [@ahmadirfn](https://github.com/ahmadirfn) |
| [Aizat Rahimi] | Frontend | [@najmifaiz08-del](https://github.com/najmifaiz08-del) |
| [Faiz Najmi] | AI / Data | [@aizatr87-dot](https://github.com/aizatr87-dot) |

## Submission Checklist

- [/] Team name, domain (Domain 1 / Domain 2) and SDG track filled in
- [/] Slide deck link added
- [/] Demo video link added
- [/] Replit used, with proof of use in submission/
- [ ] RunPod used, with proof of use in submission/
- [/] Preliminary submission completed (SDC2026_TeamName_Preliminary.pdf)
- [/] Technology declaration completed (SDC2026_TeamName_TechDeclaration.pdf)
- [/] Submission files renamed with your team name (replace TeamName)
- [/] "How to Run" steps verified
- [/] No API keys or secrets committed to the repository

## License

This project is licensed under the [Apache License 2.0](LICENSE).
