# SagaraOps Architecture (Phase 2)

## Components

1. **Web (Next.js)**
   - Incident/report dashboard
   - API consumer for report list & detail

2. **API (FastAPI)**
   - Health endpoint
   - Report metadata endpoints
   - Future: upload + auth + RBAC

3. **Worker (Python)**
   - Queue consumer
   - sosreport parsing pipeline
   - AI summarization via local Ollama model

4. **Data Layer**
   - PostgreSQL for reports/findings/audit trail
   - Redis for queue and short-lived state

5. **AI Layer**
   - Ollama local runtime (free model)
   - Model controlled via `OLLAMA_MODEL`

## Data Flow

1. Report uploaded or pushed by agent
2. API stores metadata and enqueues job
3. Worker parses report and generates findings
4. Worker asks local LLM for summary + recommendations
5. Results persisted and exposed to dashboard
