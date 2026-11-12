"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/AdminNav";
import ThemePicker from "../../components/ThemePicker";

type AuditEntry = {
  _id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

const api = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");

export default function AdminAuditLogsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inspector modal for metadata details
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const params = new URLSearchParams();
      if (targetTypeFilter) params.set("targetType", targetTypeFilter);
      if (actionFilter) params.set("action", actionFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`${api}/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to load audit logs.");

      setLogs(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit trail.");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, getToken, page, targetTypeFilter]);

  useEffect(() => {
    if (isSignedIn) {
      void fetchLogs();
    }
  }, [isSignedIn, fetchLogs]);

  return (
    <main className="admin-page">
      <AdminNav activeSection="audit-logs" />
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">ACCOUNTABILITY & AUDIT</p>
            <h1>Moderation Audit Trail</h1>
          </div>
          <div className="admin-top-actions">
            <ThemePicker compact />
            <button className="button button-outline" onClick={() => void fetchLogs()} disabled={loading} style={{ fontSize: 11 }}>
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-warning" role="alert">
            <strong>Error</strong>
            <span>{error}</span>
          </div>
        )}

        <div className="admin-policy-note" style={{ marginBottom: 20 }}>
          <b>Tamper-Evident Records</b>
          <p>
            Every admin intervention—including user suspensions, property removals, category adjustments, and safety report
            resolutions—is logged here permanently with admin identification, timestamps, and stated reasons.
          </p>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head" style={{ flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2>Audit Event Log</h2>
              <p>Filter by target entity type or specific moderation action</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={targetTypeFilter}
                onChange={(e) => {
                  setTargetTypeFilter(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "6px 10px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
              >
                <option value="">All Targets</option>
                <option value="user">User</option>
                <option value="property">Property</option>
                <option value="report">Report</option>
                <option value="category">Category</option>
              </select>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "6px 10px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
              >
                <option value="">All Actions</option>
                <option value="user_suspend">user_suspend</option>
                <option value="user_reactivate">user_reactivate</option>
                <option value="property_hide">property_hide</option>
                <option value="property_restore">property_restore</option>
                <option value="property_remove">property_remove</option>
                <option value="report_resolve">report_resolve</option>
                <option value="report_dismiss">report_dismiss</option>
                <option value="category_toggle">category_toggle</option>
                <option value="category_update">category_update</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-muted)", fontSize: 11, padding: "30px 0", textAlign: "center" }}>Loading audit records...</p>
          ) : !logs.length ? (
            <div className="admin-table-empty">
              <span>⌬</span>
              <b>No audit entries match filter</b>
              <p>When administrative actions are performed, they are recorded here immediately.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Admin Subject</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Reason</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry) => (
                    <tr key={entry._id}>
                      <td style={{ padding: "12px", fontSize: 10, color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <code>{entry.adminUserId}</code>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10, fontWeight: 700 }}>
                        <span style={{ padding: "3px 6px", borderRadius: 4, background: "var(--color-surface-subtle)" }}>
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <b>{entry.targetType}</b>: <small>{entry.targetId}</small>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10, maxWidth: 260 }}>
                        {entry.reason || "—"}
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        {entry.details && Object.keys(entry.details).length > 0 ? (
                          <button
                            type="button"
                            className="button button-outline"
                            style={{ padding: "3px 7px", fontSize: 9 }}
                            onClick={() => setSelectedEntry(entry)}
                          >
                            View
                          </button>
                        ) : (
                          <span style={{ color: "var(--color-muted)", fontSize: 9 }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <span style={{ fontSize: 10, color: "var(--color-muted)" }}>
                Page {page} of {totalPages}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="button button-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ fontSize: 10, padding: "5px 10px" }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ fontSize: 10, padding: "5px 10px" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Audit Entry Metadata Details */}
        {selectedEntry && (
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
                maxWidth: 480,
                width: "100%",
                padding: 24,
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16 }}>Audit Event Details</h2>
                  <small style={{ color: "var(--color-muted)", fontSize: 10 }}>Log ID: {selectedEntry._id}</small>
                </div>
                <button
                  type="button"
                  className="button button-outline"
                  style={{ padding: "4px 8px", fontSize: 10 }}
                  onClick={() => setSelectedEntry(null)}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ fontSize: 11, display: "grid", gap: 8, marginBottom: 16 }}>
                <div>
                  <strong>Admin ID:</strong> <code>{selectedEntry.adminUserId}</code>
                </div>
                <div>
                  <strong>Action:</strong> {selectedEntry.action}
                </div>
                <div>
                  <strong>Target:</strong> {selectedEntry.targetType} ({selectedEntry.targetId})
                </div>
                <div>
                  <strong>Reason:</strong> {selectedEntry.reason || "None"}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedEntry.createdAt).toLocaleString()}
                </div>
              </div>

              <strong>Metadata Payload:</strong>
              <pre
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 10,
                  overflowX: "auto",
                  marginTop: 6,
                }}
              >
                {JSON.stringify(selectedEntry.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
