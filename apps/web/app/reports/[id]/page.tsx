"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Finding = {
  category: string;
  severity: string;
  signal: string;
  count: number;
  evidence: string;
};

type Report = {
  id: string;
  filename: string;
  status: string;
  severity?: string | null;
  summary?: string | null;
  findings?: Finding[];
  created_at: string;
  updated_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function Badge({ value, mode = "severity" }: { value?: string | null; mode?: "severity" | "status" }) {
  const v = (value || "low").toLowerCase();
  const cls = mode === "status" ? v : ["low", "medium", "high", "critical"].includes(v) ? v : "low";
  return <span className={`badge ${cls}`}>{value || "unknown"}</span>;
}

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/reports/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setReport(null);
        return;
      }
      setReport(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 7000);
    return () => clearInterval(t);
  }, [load]);

  const exports = report
    ? {
        json: `${API_BASE}/v1/reports/${report.id}/export.json?download=1`,
        md: `${API_BASE}/v1/reports/${report.id}/export.md`,
        pdf: `${API_BASE}/v1/reports/${report.id}/export.pdf`,
        bundle: `${API_BASE}/v1/reports/${report.id}/export.bundle`,
      }
    : null;

  return (
    <main className="container">
      <header className="header">
        <div>
          <div className="brand">Report Detail</div>
          <div className="subtle">Live triage detail with export actions</div>
        </div>
        <Link href="/" className="btn">Back to Dashboard</Link>
      </header>

      {loading && !report ? (
        <div className="empty">Loading report...</div>
      ) : !report ? (
        <div className="empty">Report not found.</div>
      ) : (
        <>
          <section className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 8px" }}>{report.filename}</h2>
                <div className="subtle mono">{report.id}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge value={report.status} mode="status" />
                <Badge value={report.severity} mode="severity" />
              </div>
            </div>
            <div className="subtle" style={{ marginTop: 8 }}>
              Created: {new Date(report.created_at).toLocaleString()} · Updated: {new Date(report.updated_at).toLocaleString()}
            </div>
            {exports && (
              <div className="actions" style={{ marginTop: 12 }}>
                <a className="btn" href={exports.json}>Export JSON</a>
                <a className="btn" href={exports.md} target="_blank" rel="noreferrer">View Markdown</a>
                <a className="btn" href={exports.pdf}>Export PDF</a>
                <a className="btn" href={exports.bundle}>Export Bundle</a>
              </div>
            )}
          </section>

          <section className="detail-grid">
            <article className="card">
              <h3 className="section-title">AI Summary</h3>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{report.summary || "No summary yet."}</p>
            </article>

            <article className="card">
              <h3 className="section-title">Structured Findings</h3>
              {(report.findings || []).length === 0 ? (
                <div className="subtle">No findings available.</div>
              ) : (
                (report.findings || []).map((f, idx) => (
                  <div className="finding" key={`${f.signal}-${idx}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>{f.signal}</strong>
                      <Badge value={f.severity} mode="severity" />
                    </div>
                    <div className="subtle" style={{ marginTop: 4 }}>
                      {f.category} · count={f.count}
                    </div>
                    <p>{f.evidence}</p>
                  </div>
                ))
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}
