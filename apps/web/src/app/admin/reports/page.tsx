"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "../components/AdminShell";
import { AdminReportRecord, fetchAdminApi } from "../lib/adminApi";

const REASONS: Record<string, { label: string; color: string }> = {
  misleading: { label: "Misleading Listing", color: "amber" },
  duplicate: { label: "Duplicate Listing", color: "blue" },
  scam: { label: "Possible Scam", color: "rose" },
  wrong_information: { label: "Incorrect Info", color: "amber" },
  inappropriate: { label: "Inappropriate Content", color: "rose" },
  other: { label: "Other Community Issue", color: "default" },
};

export default function AdminReportsPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [reports, setReports] = useState<AdminReportRecord[]>([]);
  const [statusTab, setStatusTab] = useState<"open" | "reviewing" | "resolved" | "dismissed">("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Resolution modal
  const [resolvingReport, setResolvingReport] = useState<AdminReportRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<AdminReportRecord["status"]>("resolved");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submittingRes, setSubmittingRes] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const data = await fetchAdminApi<AdminReportRecord[]>(
        `/reports?status=${encodeURIComponent(statusTab)}`,
        token
      );
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load safety reports queue.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn, statusTab]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchReports();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchReports]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReport) return;

    setSubmittingRes(true);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      await fetchAdminApi(`/reports/${encodeURIComponent(resolvingReport._id)}/status`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          notes: resolutionNotes.trim(),
        }),
      });

      setNotice(`Safety report updated to status "${nextStatus}".`);
      setResolvingReport(null);
      setResolutionNotes("");
      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update safety report.");
    } finally {
      setSubmittingRes(false);
    }
  };

  return (
    <AdminShell
      activeSection="reports"
      title="Safety Reports Moderation Queue"
      description="Review user-flagged property listings, potential scams, and community safety inquiries in real time."
      pendingReportsCount={reports.filter((r) => r.status === "open").length}
      actions={
        <div className="shadcn-admin-action-row">
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void fetchReports()}
            disabled={loading}
          >
            ↻ Refresh Queue
          </button>
        </div>
      }
    >
      {/* Notice & Error */}
      {notice && (
        <div className="shadcn-admin-banner is-success" role="status">
          <span>✓ {notice}</span>
          <button type="button" onClick={() => setNotice("")} className="shadcn-admin-banner-close">×</button>
        </div>
      )}
      {error && (
        <div className="shadcn-admin-banner is-error" role="alert">
          <span>✕ {error}</span>
          <button type="button" onClick={() => setError("")} className="shadcn-admin-banner-close">×</button>
        </div>
      )}

      {/* STATUS TABS (SHADCN STUDIO SEGMENTED TABS) */}
      <div className="shadcn-admin-tabs">
        <button
          type="button"
          className={`shadcn-admin-tab ${statusTab === "open" ? "is-active" : ""}`}
          onClick={() => setStatusTab("open")}
        >
          <span>Open Needs Review</span>
        </button>
        <button
          type="button"
          className={`shadcn-admin-tab ${statusTab === "reviewing" ? "is-active" : ""}`}
          onClick={() => setStatusTab("reviewing")}
        >
          <span>Under Review</span>
        </button>
        <button
          type="button"
          className={`shadcn-admin-tab ${statusTab === "resolved" ? "is-active" : ""}`}
          onClick={() => setStatusTab("resolved")}
        >
          <span>Resolved</span>
        </button>
        <button
          type="button"
          className={`shadcn-admin-tab ${statusTab === "dismissed" ? "is-active" : ""}`}
          onClick={() => setStatusTab("dismissed")}
        >
          <span>Dismissed</span>
        </button>
      </div>

      {/* REPORTS LIST */}
      <div className="shadcn-admin-card">
        <div className="shadcn-admin-table-wrap">
          <table className="shadcn-admin-table">
            <thead>
              <tr>
                <th>Violation Category</th>
                <th>Target Property</th>
                <th>Reporter / Submitter</th>
                <th>Report Details</th>
                <th>Reported On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    Loading moderation queue from API…
                  </td>
                </tr>
              ) : !reports.length ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    No safety reports in &quot;{statusTab}&quot; status. Marketplace is clean.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => {
                  const meta = REASONS[rep.reason] || { label: rep.reason, color: "default" };
                  return (
                    <tr key={rep._id}>
                      <td>
                        <span className={`shadcn-admin-report-pill is-${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="shadcn-admin-table-primary-cell">
                          <code className="shadcn-admin-code-id">{rep.propertyId}</code>
                          <Link
                            href={`/property/${rep.propertyId}`}
                            target="_blank"
                            className="shadcn-admin-cell-link"
                          >
                            View Listing ↗
                          </Link>
                        </div>
                      </td>
                      <td>
                        <code className="shadcn-admin-code-id">{rep.reporterId}</code>
                      </td>
                      <td>
                        <p className="shadcn-admin-cell-desc">
                          {rep.details || "No additional text provided by reporter."}
                        </p>
                        {rep.resolutionNotes && (
                          <div className="shadcn-admin-resolution-note-preview">
                            <small>Admin note:</small> {rep.resolutionNotes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="shadcn-admin-cell-time">
                          {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : "—"}
                        </span>
                      </td>
                      <td>
                        <div className="shadcn-admin-table-actions">
                          <button
                            type="button"
                            className="shadcn-admin-btn is-xs is-primary"
                            onClick={() => {
                              setResolvingReport(rep);
                              setNextStatus(rep.status === "open" ? "resolved" : rep.status);
                              setResolutionNotes(rep.resolutionNotes || "");
                            }}
                          >
                            Moderate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESOLUTION DIALOG MODAL */}
      {resolvingReport && (
        <div className="shadcn-admin-modal-backdrop">
          <div className="shadcn-admin-modal-dialog">
            <div className="shadcn-admin-modal-head">
              <h3>Moderate Safety Report</h3>
              <button type="button" onClick={() => setResolvingReport(null)} className="shadcn-admin-modal-close">×</button>
            </div>
            <form onSubmit={handleResolveSubmit} className="shadcn-admin-modal-body">
              <p>
                Report for property ID <code>{resolvingReport.propertyId}</code> (Reason:{" "}
                <strong>{REASONS[resolvingReport.reason]?.label || resolvingReport.reason}</strong>).
              </p>

              <div className="shadcn-admin-field">
                <label htmlFor="next-status-select">Set Resolution Status:</label>
                <select
                  id="next-status-select"
                  className="shadcn-admin-select"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as AdminReportRecord["status"])}
                >
                  <option value="reviewing">Under Review (Investigating)</option>
                  <option value="resolved">Resolved (Action Taken / Verified)</option>
                  <option value="dismissed">Dismissed (No Violation Found)</option>
                </select>
              </div>

              <div className="shadcn-admin-field">
                <label htmlFor="res-notes">Resolution Notes (Logged to database):</label>
                <textarea
                  id="res-notes"
                  rows={3}
                  className="shadcn-admin-textarea"
                  placeholder="Explain findings, outcome, or notes for recordkeeping…"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className="shadcn-admin-modal-actions">
                <button
                  type="button"
                  className="shadcn-admin-btn is-ghost"
                  onClick={() => setResolvingReport(null)}
                  disabled={submittingRes}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="shadcn-admin-btn is-primary"
                  disabled={submittingRes}
                >
                  {submittingRes ? "Saving…" : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
