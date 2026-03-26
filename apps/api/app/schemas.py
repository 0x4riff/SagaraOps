from datetime import datetime
from pydantic import BaseModel


class ReportOut(BaseModel):
    id: str
    filename: str
    status: str
    severity: str | None = None
    summary: str | None = None
    created_at: datetime
    updated_at: datetime
