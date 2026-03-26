# SagaraOps Design Decisions

This file records key design choices and trade-offs.

## DD-001: Queue-Based Asynchronous Analysis

- **Decision:** Use Redis queue + worker for report processing.
- **Why:** Report parsing and AI summarization can take longer than request-response limits.
- **Trade-off:** Adds operational complexity (queue + worker lifecycle), but improves reliability and scalability.

## DD-002: Rule-Based Severity as Baseline

- **Decision:** Keep deterministic signal-based severity classification in worker.
- **Why:** Provides predictable behavior even when AI is unavailable.
- **Trade-off:** Lower semantic depth than full model-only inference, but consistent and explainable.

## DD-003: Local AI Runtime First

- **Decision:** Use Ollama endpoint as primary AI runtime with fallback summary.
- **Why:** Supports low-cost/self-hosted deployments and avoids mandatory external API dependency.
- **Trade-off:** Local model quality may vary by hardware/model choice.

## DD-004: API + Web Separation

- **Decision:** Split Next.js web and FastAPI backend into separate apps.
- **Why:** Clear service boundaries and easier independent scaling.
- **Trade-off:** Slightly more setup overhead compared to a single monolith app.

## DD-005: Docker Compose for Initial Deployment

- **Decision:** Standardize local/dev deployment on Docker Compose.
- **Why:** Fast onboarding and reproducible runtime for contributors.
- **Trade-off:** Not production orchestration by itself; migration path to Kubernetes remains future work.

## DD-006: PostgreSQL for Report State

- **Decision:** Store report metadata/status/results in PostgreSQL.
- **Why:** Strong relational model and reliable querying for dashboard/API.
- **Trade-off:** Requires DB lifecycle management versus pure file-based storage.

## DD-007: Explicit Non-Autonomous Scope

- **Decision:** Keep SagaraOps focused on triage assistance, not auto-remediation.
- **Why:** Reduces operational risk and aligns with human-in-the-loop incident handling.
- **Trade-off:** Fewer automation capabilities in current scope.

---

## Future Decision Candidates

- Parser plugin interface and schema versioning
- Multi-tenant RBAC strategy
- Long-term storage policy for uploaded bundles
- Notification channel abstraction
- API auth model (token vs OIDC integration)
