import json
import os
import time
from pathlib import Path

import psycopg
from redis import Redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_KEY = os.getenv("QUEUE_KEY", "sos:jobs")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sagaraops:sagaraops@postgres:5432/sagaraops")


def analyze_file(filepath: str) -> tuple[str, str]:
    file_size_kb = 0
    if Path(filepath).exists():
        file_size_kb = max(1, int(Path(filepath).stat().st_size / 1024))

    severity = "medium" if file_size_kb < 10240 else "high"
    summary = (
        f"Automated initial triage complete. File size={file_size_kb}KB. "
        f"Model target: {OLLAMA_MODEL} via {OLLAMA_BASE_URL}. "
        "Next step: parse sosreport sections and enrich root-cause mapping."
    )
    return severity, summary


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

            severity, summary = analyze_file(filepath)
            update_report(report_id, severity, summary, status="analyzed")
            print(f"[worker] analyzed report={report_id}")
        except Exception as exc:
            print(f"[worker] failed job: {exc}")
            time.sleep(2)


if __name__ == "__main__":
    main()
