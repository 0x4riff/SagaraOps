from datetime import datetime
from fastapi import FastAPI

app = FastAPI(title="SagaraOps API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "api", "time": datetime.utcnow().isoformat() + "Z"}


@app.get("/v1/reports")
def list_reports():
    # TODO: connect PostgreSQL and return real data
    return {
        "items": [
            {
                "id": "sample-001",
                "host": "prod-web-01",
                "severity": "high",
                "summary": "Disk usage over 92% on /var",
                "created_at": datetime.utcnow().isoformat() + "Z",
            }
        ]
    }
