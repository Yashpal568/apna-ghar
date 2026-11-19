"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { AdminAuditRecord, fetchAdminApi } from "../lib/adminApi";

export default function AdminAuditLogsPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [logs, setLogs] = useState<AdminAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector modal for metadata details
  const [selectedEntry, setSelectedEntry] = useState<AdminAuditRecord | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!isSignedIn) return;
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

      const data = await fetchAdminApi<{
        items: AdminAuditRecord[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/audit-logs?${params.toString()}`, token);

      setLogs(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit trail.");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, getToken, isSignedIn, page, targetTypeFilter]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchLogs();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchLogs]);

  return (
    <AdminShell
      activeSection="audit-logs"
      title="Immutable Moderation Audit Trail"
      description={`Tamper-evident log of all administrative actions, user suspensions, property removals, and category adjustments (${totalCount} entries).`}
      actions={
        <div className="shadcn-admin-action-row">
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void fetchLogs()}
            disabled={loading}
          >
            ↻ Refresh Logs
          </button>
        </div>
      }
    >
      {/* Policy card */}
      <div className="shadcn-admin-notice-card">
        <div className="shadcn-admin-notice-icon">⌬</div>
        <div>
          <h4>Tamper-Evident Accountability</h4>
          <p>
            Every admin operation is permanently logged in MongoDB Atlas with authenticated admin identity, target resource, timestamp, stated justification, and state change details.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="shadcn-admin-filter-bar">
        <div className="shadcn-admin-filter-selects" style={{ width: "100%" }}>
          <select
            className="shadcn-admin-select"
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Target Types</option>
            <option value="property">Property Listings</option>
            <option value="user">User Accounts</option>
            <option value="category">Categories</option>
            <option value="report">Safety Reports</option>
          </select>

          <select
            className="shadcn-admin-select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            <option value="property_remove">Property Removed</option>
            <option value="property_restore">Property Restored</option>
            <option value="property_hide">Property Hidden</option>
            <option value="user_suspend">User Suspended</option>
            <option value="user_reactivate">User Reactivated</option>
            <option value="category_toggle">Category Toggled</option>
            <option value="category_update">Category Updated</option>
          </select>

          <button
            type="button"
            className="shadcn-admin-btn is-secondary"
            onClick={() => void fetchLogs()}
          >
            Filter
          </button>

          {(targetTypeFilter || actionFilter) && (
            <button
              type="button"
              className="shadcn-admin-btn is-ghost"
              onClick={() => {
                setTargetTypeFilter("");
                setActionFilter("");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="shadcn-admin-card">
        <div className="shadcn-admin-table-wrap">
          <table className="shadcn-admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Target Resource</th>
                <th>Admin Operator</th>
                <th>Stated Justification</th>
                <th>Timestamp</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    Loading audit trail from database…
                  </td>
                </tr>
              ) : !logs.length ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    No audit records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className="shadcn-admin-action-pill">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div className="shadcn-admin-table-primary-cell">
                        <strong className="shadcn-admin-cell-title">
                          {log.targetType.toUpperCase()}
                        </strong>
                        <code className="shadcn-admin-code-id">{log.targetId}</code>
                      </div>
                    </td>
                    <td>
                      <code className="shadcn-admin-code-id">{log.adminUserId}</code>
                    </td>
                    <td>
                      <span className="shadcn-admin-cell-desc">
                        {log.reason || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="shadcn-admin-cell-time">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <button
                          type="button"
                          className="shadcn-admin-btn is-xs is-outline"
                          onClick={() => setSelectedEntry(log)}
                        >
                          Inspect
                        </button>
                      ) : (
                        <span className="shadcn-admin-empty-sub">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="shadcn-admin-pagination">
            <span className="shadcn-admin-pagination-info">
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="shadcn-admin-pagination-btns">
              <button
                type="button"
                className="shadcn-admin-btn is-sm is-outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="shadcn-admin-btn is-sm is-outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON PAYLOAD INSPECTOR MODAL */}
      {selectedEntry && (
        <div className="shadcn-admin-modal-backdrop">
          <div className="shadcn-admin-modal-dialog is-wide">
            <div className="shadcn-admin-modal-head">
              <h3>Audit Event Details: {selectedEntry.action}</h3>
              <button type="button" onClick={() => setSelectedEntry(null)} className="shadcn-admin-modal-close">×</button>
            </div>
            <div className="shadcn-admin-modal-body">
              <div className="shadcn-admin-specs-row">
                <div className="shadcn-admin-spec-item">
                  <small>Action</small>
                  <strong>{selectedEntry.action}</strong>
                </div>
                <div className="shadcn-admin-spec-item">
                  <small>Target Type</small>
                  <strong>{selectedEntry.targetType}</strong>
                </div>
                <div className="shadcn-admin-spec-item">
                  <small>Target ID</small>
                  <code>{selectedEntry.targetId}</code>
                </div>
                <div className="shadcn-admin-spec-item">
                  <small>Timestamp</small>
                  <strong>{new Date(selectedEntry.createdAt).toLocaleString()}</strong>
                </div>
              </div>

              <div className="shadcn-admin-field" style={{ marginTop: 14 }}>
                <label>Stated Reason:</label>
                <p className="shadcn-admin-desc-text">
                  {selectedEntry.reason || "No stated reason recorded."}
                </p>
              </div>

              <div className="shadcn-admin-field">
                <label>State Change Diff / Raw Payload (JSON):</label>
                <pre className="shadcn-admin-pre">
                  {JSON.stringify(selectedEntry.details, null, 2)}
                </pre>
              </div>

              <div className="shadcn-admin-modal-actions">
                <button
                  type="button"
                  className="shadcn-admin-btn is-secondary"
                  onClick={() => setSelectedEntry(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
