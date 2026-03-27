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

function Sparkline({ values }: { values: number[] }) {
  const width = 560;
  const height = 150;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  const area = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="spark-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="160" role="img" aria-label="network spike trend">
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} className="spark-grid" x1={0} y1={height * p} x2={width} y2={height * p} />
        ))}
        <polygon className="spark-area" points={area} />
        <polyline className="spark-line" points={points} />
        {values.map((v, i) => {
          const x = i * step;
          const y = height - (v / max) * (height - 20) - 10;
          return <circle key={i} className="spark-dot" cx={x} cy={y} r={2.7} />;
        })}
      </svg>
    </div>
  );
}

function heatClass(n: number) {
  if (n <= 0) return "h0";
  if (n <= 2) return "h1";
  if (n <= 5) return "h2";
  return "h3";
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

  const networkTrend = useMemo(() => {
    const sorted = [...reports].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const last = sorted.slice(-16);
    return last.map((r) => (r.findings || []).filter((f) => f.category === "network").reduce((s, f) => s + (f.count || 0), 0));
  }, [reports]);

  const matrix = useMemo(() => {
    const categories = ["kernel", "memory", "disk", "service", "network", "general"];
    const severities = ["critical", "high", "medium", "low"];
    const base: Record<string, Record<string, number>> = {};
    categories.forEach((c) => {
      base[c] = { critical: 0, high: 0, medium: 0, low: 0 };
    });

    reports.forEach((r) => {
      (r.findings || []).forEach((f) => {
        const c = categories.includes(f.category) ? f.category : "general";
        const s = severities.includes(f.severity) ? f.severity : "low";
        base[c][s] += f.count || 1;
      });
    });

    return { categories, severities, base };
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

      <section className="charts">
        <article className="card chart-shell">
          <h3 style={{ marginTop: 0 }}>Network Spike Trend</h3>
          <div className="subtle">Recent network signal intensity from latest analyzed reports</div>
          <Sparkline values={networkTrend.length ? networkTrend : [0, 0, 0, 0, 0]} />
          <div className="legend">
            <span>Latest points: <b>{networkTrend.slice(-5).join(" • ") || "0"}</b></span>
          </div>
        </article>

        <article className="card chart-shell">
          <h3 style={{ marginTop: 0 }}>Signal Matrix</h3>
          <div className="subtle">Category × severity distribution</div>
          <table className="matrix">
            <thead>
              <tr>
                <th>Category</th>
                <th>Critical</th>
                <th>High</th>
                <th>Medium</th>
                <th>Low</th>
              </tr>
            </thead>
            <tbody>
              {matrix.categories.map((c) => (
                <tr key={c}>
                  <td>{c}</td>
                  {matrix.severities.map((s) => {
                    const n = matrix.base[c][s];
                    return (
                      <td key={`${c}-${s}`}>
                        <span className={`heat ${heatClass(n)}`}>{n}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </article>
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
