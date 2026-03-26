"use client";

import { FormEvent, useEffect, useState } from "react";

type Report = {
  id: string;
  filename: string;
  status: string;
  severity?: string | null;
  summary?: string | null;
  created_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/reports`);
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
      await fetch(`${API_BASE}/v1/reports/upload`, {
        method: "POST",
        body,
      });
      form.reset();
      await loadReports();
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>SagaraOps Dashboard</h1>
      <p>SOS report upload + queue + automated analysis pipeline.</p>

      <form onSubmit={handleUpload} style={{ marginBottom: 20 }}>
        <input name="report" type="file" required />
        <button type="submit" disabled={uploading} style={{ marginLeft: 8 }}>
          {uploading ? "Uploading..." : "Upload sosreport"}
        </button>
      </form>

      <h2>Latest Reports</h2>
      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <p>No reports yet.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>File</th>
              <th>Status</th>
              <th>Severity</th>
              <th>Summary</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{r.filename}</td>
                <td>{r.status}</td>
                <td>{r.severity || "-"}</td>
                <td>{r.summary || "-"}</td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
