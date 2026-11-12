"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "../components/AdminNav";
import ThemePicker from "../../components/ThemePicker";

type Report = {
  _id: string;
  propertyId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolutionNotes?: string;
  createdAt?: string;
};

const api = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
const reasons: Record<string, string> = {
  misleading: "Misleading listing",
  duplicate: "Duplicate listing",
  scam: "Possible scam",
  wrong_information: "Incorrect information",
  inappropriate: "Inappropriate content",
  other: "Other",
};

export default function AdminReportsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Resolution modal
  const [resolvingReport, setResolvingReport] = useState<{ id: string; status: Report["status"] } | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token || !isSignedIn) throw new Error("Sign in with an authorized admin account to view reports.");
      const response = await fetch(api + "/property-reports/admin" + (status ? "?status=" + encodeURIComponent(status) : ""), {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not load the moderation queue.");
      setReports(Array.isArray(body) ? body : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn, status]);

  useEffect(() => {
    if (isSignedIn) void load();
  }, [isSignedIn, load]);

  async function updateStatus(reportId: string, nextStatus: Report["status"], notes = "") {
    setBusyId(reportId);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session has expired. Sign in again.");
      const response = await fetch(api + "/property-reports/admin/" + encodeURIComponent(reportId) + "/status", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: nextStatus, notes: notes.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not update this report.");
      setNotice(`Report status updated to "${nextStatus}".`);
      setResolvingReport(null);
      setResolutionNotes("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update report.");
    } finally {
      setBusyId("");
    }
  }

  if (!isSignedIn) {
    return (
      <main className="admin-page">
        <AdminNav activeSection="reports" />
        <section className="admin-main">
          <div className="admin-warning">
            <strong>Admin sign-in required</strong>
            <span>Sign in with an account authorized by the API administrator to access reports.</span>
            <div style={{ marginTop: 10 }}>
              <Link className="button button-primary" href="/sign-in?redirect_url=%2Fadmin%2Freports">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <AdminNav activeSection="reports" />
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">TRUST & SAFETY</p>
            <h1>Safety reports</h1>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-muted)" }}>
              Review user-submitted reports and update their workflow status.
            </p>
          </div>
          <div className="admin-top-actions">
            <ThemePicker compact />
            <button className="button button-outline" type="button" onClick={() => void load()} disabled={loading} style={{ fontSize: 11 }}>
              {loading ? "Refreshing…" : "↻ Refresh queue"}
            </button>
          </div>
        </header>

        <div className="admin-warning">
          <strong>Moderation discipline</strong>
          <span>
            Changing a report status records a resolution audit log. If a listing requires hiding or removal, moderate it from the{" "}
            <Link href="/admin/listings" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
              Listings panel
            </Link>
            .
          </span>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Report queue</h2>
              <p>{loading ? "Loading reports…" : `${reports.length} reports in this view`}</p>
            </div>
            <label className="report-filter-label" style={{ fontSize: 11 }}>
              Status{" "}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              >
                <option value="open">Open</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="">All statuses</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="admin-warning" role="alert" style={{ marginTop: 14 }}>
              <strong>Could not load moderation data</strong>
              <span>{error}</span>
              <div style={{ marginTop: 8 }}>
                <button className="button button-outline" onClick={() => void load()}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {notice && <p className="form-notice" role="status" style={{ margin: "12px 0" }}>{notice}</p>}

          {loading ? (
            <div className="report-list-skeleton" aria-label="Loading reports" style={{ marginTop: 16 }}>
              <div />
              <div />
              <div />
            </div>
          ) : !error && !reports.length ? (
            <div className="admin-queue-empty">
              <span>✓</span>
              <div>
                <b>No reports in this status</b>
                <p>This is a live API result. New reports will appear after a refresh.</p>
              </div>
            </div>
          ) : (
            <div className="admin-report-list" style={{ marginTop: 16 }}>
              {reports.map((report) => (
                <article className="admin-report-card" key={report._id}>
                  <div className="admin-report-heading">
                    <div>
                      <span className={"report-status report-status-" + report.status}>{report.status.replace("_", " ")}</span>
                      <h3>{reasons[report.reason] || report.reason}</h3>
                    </div>
                    <time style={{ fontSize: 10, color: "var(--color-muted)" }}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Date unavailable"}
                    </time>
                  </div>
                  <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 10, margin: "12px 0" }}>
                    <div>
                      <dt style={{ color: "var(--color-muted)" }}>Property ID</dt>
                      <dd style={{ margin: "2px 0 0", fontWeight: 600 }}>
                        <Link href={`/admin/listings?q=${encodeURIComponent(report.propertyId)}`} style={{ color: "var(--color-primary)" }}>
                          {report.propertyId} ↗
                        </Link>
                      </dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--color-muted)" }}>Report ID</dt>
                      <dd style={{ margin: "2px 0 0" }}>{report._id}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--color-muted)" }}>Reporter ID</dt>
                      <dd style={{ margin: "2px 0 0" }}>{report.reporterId}</dd>
                    </div>
                  </dl>
                  {report.details && <p className="admin-report-details" style={{ fontSize: 11, margin: "8px 0" }}>{report.details}</p>}
                  {report.resolutionNotes && (
                    <div style={{ padding: 8, background: "var(--color-bg)", borderRadius: 6, fontSize: 10, margin: "8px 0" }}>
                      <strong>Resolution Notes:</strong> {report.resolutionNotes}
                    </div>
                  )}
                  <div className="admin-report-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <label style={{ fontSize: 10 }}>
                      Update status:{" "}
                      <select
                        value={report.status}
                        disabled={busyId === report._id}
                        onChange={(e) => {
                          const next = e.target.value as Report["status"];
                          if (next === "resolved" || next === "dismissed") {
                            setResolvingReport({ id: report._id, status: next });
                            setResolutionNotes("");
                          } else {
                            void updateStatus(report._id, next);
                          }
                        }}
                        style={{ padding: "4px 8px", fontSize: 10, borderRadius: 4, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
                      >
                        <option value="open">Open</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </label>
                    <Link
                      href={`/admin/listings?q=${encodeURIComponent(report.propertyId)}`}
                      className="button button-outline"
                      style={{ padding: "4px 8px", fontSize: 9 }}
                    >
                      Moderate Property ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Resolution Notes */}
        {resolvingReport && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                maxWidth: 440,
                width: "100%",
                padding: 24,
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Mark Report as {resolvingReport.status}</h2>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
                Enter optional resolution notes or actions taken regarding this report:
              </p>

              <textarea
                placeholder="Resolution notes (e.g. verified listing authenticity, or removed seller duplicate)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: 8,
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setResolvingReport(null)}
                  style={{ fontSize: 11 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void updateStatus(resolvingReport.id, resolvingReport.status, resolutionNotes)}
                  style={{ fontSize: 11 }}
                >
                  Save & Update
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
