import io
import json
import os
import tarfile
import time
import urllib.request
from pathlib import Path

import psycopg
from redis import Redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_KEY = os.getenv("QUEUE_KEY", "sos:jobs")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sagaraops:sagaraops@postgres:5432/sagaraops")

SIGNALS = {
    "critical": ["kernel panic", "filesystem corruption", "segfault"],
    "high": ["out of memory", "oom-killer", "no space left on device", "disk full"],
    "medium": ["failed", "timeout", "connection refused", "error"],
}


def extract_text(filepath: str, max_chars: int = 120_000) -> str:
    p = Path(filepath)
    if not p.exists():
        return ""

    # try tar/tar.xz first (typical sosreport format)
    if any(str(p).endswith(ext) for ext in [".tar", ".tar.xz", ".tgz", ".tar.gz"]):
        chunks: list[str] = []
        try:
            with tarfile.open(p, "r:*") as tf:
                for member in tf.getmembers():
                    if not member.isfile():
                        continue
                    name = member.name.lower()
                    if not any(k in name for k in ["messages", "dmesg", "secure", "journal", "syslog"]):
                        continue
                    f = tf.extractfile(member)
                    if not f:
                        continue
                    data = f.read(24_000)
                    text = data.decode("utf-8", errors="ignore")
                    chunks.append(f"\n--- {member.name} ---\n{text}")
                    if sum(len(c) for c in chunks) >= max_chars:
                        break
            return "".join(chunks)[:max_chars]
        except Exception:
            pass

    # fallback: raw decode file
    raw = p.read_bytes()[:max_chars]
    return raw.decode("utf-8", errors="ignore")


def detect_signals(text: str) -> tuple[str, list[str]]:
    lower = text.lower()
    hits: list[str] = []

    sev_rank = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    severity = "low"

    for level, patterns in SIGNALS.items():
        for pat in patterns:
            if pat in lower:
                hits.append(f"{level}:{pat}")
                if sev_rank[level] > sev_rank[severity]:
                    severity = level

    if not hits and text:
        severity = "medium" if "warn" in lower else "low"

    return severity, hits[:12]


def ai_summary(text: str, severity: str, hits: list[str]) -> str:
    snippet = text[:5000] if text else "(empty)"
    prompt = (
        "You are SRE incident assistant. Summarize this sosreport evidence in <= 5 lines. "
        "Return concise markdown bullet points: probable root cause, impacted component, first fix step.\n\n"
        f"Detected severity: {severity}\n"
        f"Detected signals: {', '.join(hits) if hits else 'none'}\n\n"
        f"Evidence:\n{snippet}"
    )

    payload = json.dumps(
        {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        url=f"{OLLAMA_BASE_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            result = body.get("response", "").strip()
            if result:
                return result[:1800]
    except Exception:
        pass

    # fallback summary (no AI dependency)
    return (
        f"Initial triage complete. Severity={severity}. "
        f"Signals: {', '.join(hits) if hits else 'none'}. "
        "Recommended first action: inspect logs around detected signals and validate system resource headroom."
    )


def update_report(report_id: str, severity: str, summary: str, status: str = "analyzed") -> None:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE reports
                SET status = %s,
                    severity = %s,
                    summary = %s,
                    updated_at = NOW()
                WHERE id = %s;
                """,
                (status, severity, summary, report_id),
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
            severity, hits = detect_signals(text)
            summary = ai_summary(text, severity, hits)
            update_report(report_id, severity, summary, status="analyzed")
            print(f"[worker] analyzed report={report_id} severity={severity}")
        except Exception as exc:
            print(f"[worker] failed job: {exc}")
            time.sleep(2)


if __name__ == "__main__":
    main()
