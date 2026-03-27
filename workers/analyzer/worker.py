import json
import os
import re
import tarfile
import time
import urllib.request
from collections import defaultdict
from pathlib import Path

import psycopg
from redis import Redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_KEY = os.getenv("QUEUE_KEY", "sos:jobs")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sagaraops:sagaraops@postgres:5432/sagaraops")

SIGNAL_RULES = [
    {"category": "kernel", "severity": "critical", "signal": "kernel panic", "pattern": r"kernel panic"},
    {"category": "memory", "severity": "high", "signal": "oom killer", "pattern": r"oom-killer|out of memory"},
    {"category": "disk", "severity": "high", "signal": "disk full", "pattern": r"no space left on device|disk full"},
    {"category": "service", "severity": "medium", "signal": "service failed", "pattern": r"\bfailed\b"},
    {"category": "network", "severity": "medium", "signal": "connection refused", "pattern": r"connection refused"},
    {"category": "network", "severity": "medium", "signal": "timeout", "pattern": r"timeout"},
]

SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}


def extract_text(filepath: str, max_chars: int = 200_000) -> str:
    p = Path(filepath)
    if not p.exists():
        return ""

    if any(str(p).endswith(ext) for ext in [".tar", ".tar.xz", ".tgz", ".tar.gz"]):
        chunks: list[str] = []
        try:
            with tarfile.open(p, "r:*") as tf:
                for member in tf.getmembers():
                    if not member.isfile():
                        continue
                    name = member.name.lower()
                    if not any(k in name for k in ["messages", "dmesg", "secure", "journal", "syslog", "df", "free", "top"]):
                        continue
                    f = tf.extractfile(member)
                    if not f:
                        continue
                    data = f.read(40_000)
                    text = data.decode("utf-8", errors="ignore")
                    chunks.append(f"\n--- {member.name} ---\n{text}")
                    if sum(len(c) for c in chunks) >= max_chars:
                        break
            return "".join(chunks)[:max_chars]
        except Exception:
            pass

    raw = p.read_bytes()[:max_chars]
    return raw.decode("utf-8", errors="ignore")


def parse_findings(text: str) -> tuple[str, list[dict]]:
    lines = text.splitlines()
    findings: list[dict] = []
    max_severity = "low"

    for rule in SIGNAL_RULES:
        pattern = re.compile(rule["pattern"], re.IGNORECASE)
        matched_lines = [ln.strip() for ln in lines if pattern.search(ln)]
        if not matched_lines:
            continue

        grouped = defaultdict(int)
        for m in matched_lines:
            grouped[m[:180]] += 1

        top_line, count = max(grouped.items(), key=lambda kv: kv[1])
        findings.append(
            {
                "category": rule["category"],
                "severity": rule["severity"],
                "signal": rule["signal"],
                "count": count,
                "evidence": top_line,
            }
        )

        if SEVERITY_RANK[rule["severity"]] > SEVERITY_RANK[max_severity]:
            max_severity = rule["severity"]

    if not findings:
        if text.strip():
            findings.append(
                {
                    "category": "general",
                    "severity": "low",
                    "signal": "no known critical pattern",
                    "count": 0,
                    "evidence": "No predefined signals matched in extracted content.",
                }
            )
        return "low", findings

    findings.sort(key=lambda f: SEVERITY_RANK[f["severity"]], reverse=True)
    return max_severity, findings


def ai_summary(text: str, severity: str, findings: list[dict]) -> str:
    findings_text = "\n".join(
        [f"- {f['severity']} | {f['category']} | {f['signal']} | count={f['count']} | evidence={f['evidence']}" for f in findings[:8]]
    )
    prompt = (
        "You are an SRE incident assistant. Produce concise incident triage output in markdown bullets. "
        "Include probable cause, impacted component, immediate mitigation, and next investigation step.\n\n"
        f"Detected severity: {severity}\n"
        f"Structured findings:\n{findings_text}\n\n"
        f"Evidence excerpt:\n{text[:5000]}"
    )

    payload = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}).encode("utf-8")
    req = urllib.request.Request(
        url=f"{OLLAMA_BASE_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            out = body.get("response", "").strip()
            if out:
                return out[:2000]
    except Exception:
        pass

    # deterministic fallback
    top = findings[0]
    return (
        f"- Severity: **{severity.upper()}**\n"
        f"- Primary signal: `{top['signal']}` in `{top['category']}`\n"
        f"- Evidence: {top['evidence']}\n"
        f"- Immediate action: inspect related logs/service status and verify resource headroom.\n"
        f"- Next step: validate recurrence window and affected hosts."
    )


def update_report(report_id: str, severity: str, summary: str, findings: list[dict], status: str = "analyzed") -> None:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE reports
                SET status = %s,
                    severity = %s,
                    summary = %s,
                    findings_json = %s,
                    updated_at = NOW()
                WHERE id = %s;
                """,
                (status, severity, summary, json.dumps(findings), report_id),
            )
        conn.commit()


def main():
    redis_client = Redis.from_url(REDIS_URL, decode_responses=True)

    print("[worker] SagaraOps analyzer worker started")
    print(f"[worker] redis={REDIS_URL} queue={QUEUE_KEY}")
    print(f"[worker] ollama={OLLAMA_BASE_URL} model={OLLAMA_MODEL}")

    while True:
        result = redis_client.brpop(QUEUE_KEY, timeout=15)
        if not result:
            print("[worker] heartbeat: waiting for jobs...")
            continue

        _, payload = result
        try:
            data = json.loads(payload)
            report_id = data["report_id"]
            filepath = data["filepath"]

            text = extract_text(filepath)
            severity, findings = parse_findings(text)
            summary = ai_summary(text, severity, findings)
            update_report(report_id, severity, summary, findings, status="analyzed")
            print(f"[worker] analyzed report={report_id} severity={severity} findings={len(findings)}")
        except Exception as exc:
            print(f"[worker] failed job: {exc}")
            time.sleep(2)


if __name__ == "__main__":
    main()
