import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from redis import Redis

from .db import get_conn, init_db
from .schemas import ReportOut

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_KEY = os.getenv("QUEUE_KEY", "sos:jobs")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/data/uploads"))

app = FastAPI(title="SagaraOps API", version="0.3.0")
redis_client = Redis.from_url(REDIS_URL, decode_responses=True)


@app.on_event("startup")
def on_startup() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    init_db()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "api",
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/v1/reports/upload", response_model=ReportOut)
async def upload_report(file: UploadFile = File(...)):
    report_id = str(uuid.uuid4())
    safe_name = file.filename or f"report-{report_id}.tar.xz"
    target_path = UPLOAD_DIR / f"{report_id}-{safe_name}"

    content = await file.read()
    target_path.write_bytes(content)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO reports (id, filename, filepath, status, severity, summary)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, filename, status, severity, summary, created_at, updated_at;
                """,
                (report_id, safe_name, str(target_path), "queued", None, None),
            )
            row = cur.fetchone()
        conn.commit()

    redis_client.lpush(
        QUEUE_KEY,
        json.dumps(
            {
                "report_id": report_id,
                "filepath": str(target_path),
            }
        ),
    )

    return ReportOut(**dict(zip(["id", "filename", "status", "severity", "summary", "created_at", "updated_at"], row)))


@app.get("/v1/reports", response_model=list[ReportOut])
def list_reports(limit: int = 20):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, filename, status, severity, summary, created_at, updated_at
                FROM reports
                ORDER BY created_at DESC
                LIMIT %s;
                """,
                (max(1, min(limit, 100)),),
            )
            rows = cur.fetchall()

    keys = ["id", "filename", "status", "severity", "summary", "created_at", "updated_at"]
    return [ReportOut(**dict(zip(keys, row))) for row in rows]


@app.get("/v1/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, filename, status, severity, summary, created_at, updated_at
                FROM reports
                WHERE id = %s;
                """,
                (report_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    keys = ["id", "filename", "status", "severity", "summary", "created_at", "updated_at"]
    return ReportOut(**dict(zip(keys, row)))
