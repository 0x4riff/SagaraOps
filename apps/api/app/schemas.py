from datetime import datetime
from pydantic import BaseModel, Field


class Finding(BaseModel):
    category: str
    severity: str
    signal: str
    count: int
    evidence: str


class ReportOut(BaseModel):
    id: str
    filename: str
    status: str
    severity: str | None = None
    summary: str | None = None
    findings: list[Finding] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
