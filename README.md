# SagaraOps

[![CI](https://github.com/0x4riff/SagaraOps/actions/workflows/ci.yml/badge.svg)](https://github.com/0x4riff/SagaraOps/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active%20development-blue)

SagaraOps is an open-source incident triage tool for Linux diagnostics.
It ingests `sosreport` bundles, extracts operational signals, prioritizes severity, and produces actionable summaries for faster troubleshooting.

---

## Problem

When incidents happen, teams often receive large diagnostic bundles (`sosreport`) that are difficult to parse quickly. Common pain points:

- critical signals are buried in thousands of lines of logs,
- triage quality depends on individual experience,
- handover quality is inconsistent,
- response time increases during off-hours.

---

## Solution

SagaraOps provides a structured triage pipeline:

1. **Ingest** report bundles via API/dashboard.
2. **Queue** analysis jobs for asynchronous processing.
3. **Parse** key system signals (errors, OOM, disk, service failures, etc.).
4. **Classify** severity using deterministic rules.
5. **Summarize** findings with local AI (Ollama), with fallback when AI is unavailable.
6. **Expose** results through API and web dashboard.

---

## Current Capabilities

- Upload report files from the web dashboard
- Queue-based background processing (Redis + worker)
- PostgreSQL-backed report state and summaries
- Structured parser for core incident signals (kernel, memory, disk, service, network)
- Rule-based severity classification with evidence snippets
- AI-assisted summarization with local model endpoint (`Ollama`)
- Report export endpoints (Markdown and PDF)
- CI workflow for API/web validation

---

## Architecture

```text
[Web UI] ───────► [FastAPI]
                    │
                    ├──► [PostgreSQL]  (report metadata + results)
                    └──► [Redis Queue] ───► [Analyzer Worker]
                                              │
                                              ├──► signal parser
                                              └──► AI summary (Ollama / fallback)
```

---

## Tech Stack

- **Web:** Next.js
- **API:** FastAPI
- **Worker:** Python
- **Database:** PostgreSQL
- **Queue:** Redis
- **AI runtime:** Ollama (local)
- **Container orchestration:** Docker Compose
- **CI:** GitHub Actions

---

## Quick Start

### Prerequisites

- Docker Desktop / Docker Engine with Compose
- Git

### Run locally

```bash
# from repo root
cp .env.example .env
cd infra/docker
docker compose up -d --build
```

Open:

- Web: `http://localhost:3000`
- API health: `http://localhost:8000/health`

Optional (AI model):

```bash
docker exec -it docker-ollama-1 ollama pull llama3.1:8b
```

---

## API (current)

- `GET /health` — API health check
- `POST /v1/reports/upload` — upload report file
- `GET /v1/reports` — list reports
- `GET /v1/reports/{report_id}` — report detail (includes structured findings)
- `GET /v1/reports/{report_id}/export.json` — export machine-readable report package
- `GET /v1/reports/{report_id}/export.md` — export markdown report
- `GET /v1/reports/{report_id}/export.pdf` — export PDF report

---

## Project Structure

```text
SagaraOps/
├─ apps/
│  ├─ web/                  # Next.js dashboard
│  └─ api/                  # FastAPI service
├─ workers/
│  └─ analyzer/             # async report analyzer
├─ infra/
│  ├─ docker/               # compose stack
│  └─ scripts/              # utility scripts
├─ docs/
│  ├─ architecture.md
│  └─ roadmap.md
└─ .github/
   ├─ workflows/
   └─ ISSUE_TEMPLATE/
```

---

## Roadmap

- Deeper parser coverage for common Linux incident classes
- Markdown/PDF report export
- Notification integrations (chat/email)
- Scheduled and remote agent ingestion
- Multi-tenant support and access controls

---

## Additional Documentation

- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Use Cases](docs/use-cases.md)
- [Design Decisions](docs/design-decisions.md)
- [Branch Protection Baseline](docs/branch-protection.md)

---

## Contributing

Contributions are welcome.
Please read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [Code of Conduct](.github/CODE_OF_CONDUCT.md)

---

## Security

If you find a vulnerability, do **not** open a public issue.
Please follow private reporting guidance in [SECURITY.md](SECURITY.md).

---

## License

MIT — see [LICENSE](LICENSE).
