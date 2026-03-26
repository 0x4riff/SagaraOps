# SagaraOps

> **AI-powered SOS Report Automation Platform** for modern infrastructure teams.  
> Built to showcase **DevOps + Fullstack** capabilities in one production-style project.

![status](https://img.shields.io/badge/status-MVP%20in%20progress-blue)
![stack](https://img.shields.io/badge/stack-Next.js%20%7C%20FastAPI%20%7C%20PostgreSQL%20%7C%20Redis-informational)
![ai](https://img.shields.io/badge/AI-Free%20(Local%20LLM%20via%20Ollama)-success)

## ✨ What is SagaraOps?

**SagaraOps** automates server incident diagnostics by collecting and analyzing `sosreport` bundles, then producing:
- severity scoring,
- root cause hints,
- actionable remediation suggestions,
- clean, shareable incident summaries.

This project is inspired by maritime resilience and navigation principles—reflecting the **Bajau cultural thread** in a modern engineering context.

---

## 🎯 Portfolio Value

This single project demonstrates:

### DevOps Skills
- Agent-based report collection from Linux nodes
- Async processing pipeline (queue workers)
- Containerized environment (Docker)
- CI/CD with GitHub Actions
- Observability (logs/metrics)
- Secure secret handling and RBAC-ready design

### Fullstack Skills
- Modern web dashboard (report lifecycle + insights)
- REST API architecture
- Data modeling for incidents and findings
- Authentication-ready structure
- Clean UX for operations workflows

---

## 🧱 High-Level Architecture

```text
[Linux Host]
   └─ Sagara Agent (collect sosreport)
         ↓
[API Gateway / Backend]
         ↓
[Queue + Worker] ──> [Parser Engine] ──> [AI Analyzer (Ollama)]
         ↓                                 ↓
      [PostgreSQL] <────────────────────────
         ↓
   [Web Dashboard]
```

---

## 🚀 Planned Features

### MVP
- [ ] Upload `sosreport` manually
- [ ] Parse core diagnostics (disk, memory, failed services, network)
- [ ] Rule-based severity scoring
- [ ] AI-generated summary using free local LLM (Ollama)
- [ ] Dashboard: report list + detail view

### V1
- [ ] Agent push mode from remote hosts
- [ ] Scheduled collection
- [ ] Export PDF/Markdown incident report
- [ ] Notifications (Telegram/Slack)

### V2
- [ ] Multi-tenant/workspace support
- [ ] Trend analytics across incidents
- [ ] “Fix simulation” suggestions with risk notes

---

## 🛠 Tech Stack (Target)

- **Frontend:** Next.js + Tailwind CSS
- **Backend:** FastAPI
- **Database:** PostgreSQL
- **Queue:** Redis + Celery
- **AI (Free):** Ollama (`llama3.1:8b` / `qwen2.5:7b`)
- **Infra:** Docker Compose (K8s-ready roadmap)
- **CI/CD:** GitHub Actions

---

## 📁 Project Structure (initial)

```text
SagaraOps/
├─ apps/
│  ├─ web/            # Next.js dashboard
│  └─ api/            # FastAPI backend
├─ workers/
│  └─ analyzer/       # queue workers, parser, AI analysis
├─ infra/
│  ├─ docker/         # compose + service templates
│  └─ scripts/        # bootstrap/devops scripts
├─ docs/
│  ├─ architecture.md
│  └─ roadmap.md
└─ README.md
```

---

## 🔐 Security Notes

- No real production secrets committed
- `.env.example` only for template variables
- Planned signed agent-to-server upload flow
- Input sanitization required for uploaded bundles

---

## 🗺 Roadmap

- Week 1: Core ingestion + parser
- Week 2: AI summarization + persistence
- Week 3: Dashboard + filtering
- Week 4: Hardening + CI/CD + demo assets

## ⚙️ Quick Start (Phase 2)

```bash
# from repo root
cp .env.example .env

# start local stack
cd infra/docker
docker compose up -d --build
```

Then open:
- Web: `http://localhost:3000`
- API health: `http://localhost:8000/health`

> Note: Pull a local model for Ollama after container starts (example):
>
> `docker exec -it <ollama-container> ollama pull llama3.1:8b`

---

## 👤 Author

**Arif Widiyanto**  
GitHub: [@0x4riff](https://github.com/0x4riff)

---

## 📌 Notes for Recruiters

SagaraOps is intentionally scoped to represent real-world operations workflows, showing how infrastructure automation and product-oriented web engineering can be delivered in one cohesive system.
