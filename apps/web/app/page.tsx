"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/reports?limit=100`, { cache: "no-store" });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("report") as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("file", file);

    setUploading(true);
    try {
      await fetch(`${API_BASE}/v1/reports/upload`, { method: "POST", body });
      form.reset();
      await loadReports();
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    loadReports();
    const t = setInterval(loadReports, 7000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const qOk = !query || r.filename.toLowerCase().includes(query.toLowerCase()) || r.id.includes(query);
      const fOk = filter === "all" || (r.severity || "unknown").toLowerCase() === filter;
      return qOk && fOk;
    });
  }, [reports, query, filter]);

  const kpi = useMemo(() => {
    const total = reports.length;
    const critical = reports.filter((r) => (r.severity || "").toLowerCase() === "critical").length;
    const analyzed = reports.filter((r) => r.status === "analyzed").length;
    const queued = reports.filter((r) => r.status === "queued").length;
    return { total, critical, analyzed, queued };
  }, [reports]);

  return (
    <main className="container">
      <header className="header">
        <div>
          <div className="brand">SagaraOps</div>
          <div className="subtle">Operational triage dashboard for Linux diagnostics</div>
        </div>
        <div className="subtle">Auto-refresh every 7s</div>
      </header>

      <section className="grid kpi">
        <div className="card"><h3>Total Reports</h3><div className="kpi-value">{kpi.total}</div></div>
        <div className="card"><h3>Critical</h3><div className="kpi-value">{kpi.critical}</div></div>
        <div className="card"><h3>Analyzed</h3><div className="kpi-value">{kpi.analyzed}</div></div>
        <div className="card"><h3>Queued</h3><div className="kpi-value">{kpi.queued}</div></div>
      </section>

      <section className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={handleUpload} className="toolbar">
          <input className="file" name="report" type="file" required />
          <button className="btn" type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload sosreport"}</button>
          <input className="input" placeholder="Search filename or report id" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </form>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Recent Reports</h3>
        {loading ? (
          <div className="empty">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No reports match current filters.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th>Severity</th>
                  <th>Summary</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>{r.filename}</div>
                      <div className="subtle mono" style={{ fontSize: ".75rem" }}>{r.id.slice(0, 12)}...</div>
                    </td>
                    <td><Badge value={r.status} mode="status" /></td>
                    <td><Badge value={r.severity} mode="severity" /></td>
                    <td className="clip">{r.summary || "-"}</td>
                    <td className="subtle">{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <Link className="btn" href={`/reports/${r.id}`}>Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
