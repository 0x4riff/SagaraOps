# SagaraOps Use Cases

This document describes practical scenarios where SagaraOps can be used as an operational support tool.

## 1) First-Line Incident Triage

### Context
An on-call engineer receives a Linux incident and gets a `sosreport` bundle from the affected host.

### Challenge
Raw bundles are large and time-consuming to inspect manually during active incidents.

### SagaraOps Value
- Ingest report quickly
- Surface severity signals
- Generate concise initial summary
- Reduce time-to-first-diagnosis

---

## 2) Handover Across Shifts

### Context
An incident starts near end-of-shift and must be handed to another engineer/team.

### Challenge
Handover quality depends on how complete and structured the notes are.

### SagaraOps Value
- Standardized report status and summary
- Shared dashboard view
- Less context loss between shifts

---

## 3) Junior Engineer Support

### Context
Less experienced operators need to triage unfamiliar system failures.

### Challenge
Pattern recognition for root-cause hypotheses typically requires experience.

### SagaraOps Value
- Rule-based severity baseline
- AI-assisted explanation in plain operational language
- Better consistency in early triage decisions

---

## 4) Internal Operational Tooling

### Context
A platform team needs lightweight, self-hosted tooling for diagnostics workflow.

### Challenge
Many tools are either too heavy, too expensive, or not adaptable to existing stacks.

### SagaraOps Value
- Open-source and extensible
- Local AI runtime option (Ollama)
- Can be integrated into existing incident workflows

---

## 5) Post-Incident Documentation Bootstrap

### Context
After mitigation, teams need a structured base for incident review/postmortem.

### Challenge
Operational evidence is scattered across logs and ad-hoc notes.

### SagaraOps Value
- Consolidated findings per uploaded report
- Repeatable triage output format
- Better starting point for post-incident reports

---

## Non-Goals (Current Scope)

SagaraOps is **not** currently intended to:
- auto-remediate systems,
- replace full SIEM or observability platforms,
- act as authoritative root-cause engine without human validation.

It is designed as a **triage accelerator**, not a fully autonomous incident responder.
