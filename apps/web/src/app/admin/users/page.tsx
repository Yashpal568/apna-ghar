"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/AdminNav";
import ThemePicker from "../../components/ThemePicker";

type UserRecord = {
  clerkUserId: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  about?: string;
  role?: string;
  accountStatus?: string;
  createdAt?: string;
  lastActiveAt?: string;
};

type UserDetailsResponse = {
  user: UserRecord;
  listings: Array<{
    _id: string;
    title: string;
    slug: string;
    priceAmount: number;
    status: string;
    location?: { city?: string };
    createdAt?: string;
  }>;
  listingsCount: number;
};

const api = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");

export default function AdminUsersPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user: currentClerkUser } = useUser();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [actionUser, setActionUser] = useState<UserRecord | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "reactivate" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Details drawer
  const [detailUser, setDetailUser] = useState<UserDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`${api}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to load users.");

      setUsers(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user list.");
    } finally {
      setLoading(false);
    }
  }, [getToken, page, roleFilter, search, statusFilter]);

  useEffect(() => {
    if (isSignedIn) {
      void fetchUsers();
    }
  }, [isSignedIn, fetchUsers]);

  const openUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const token = await getToken();
      const res = await fetch(`${api}/admin/users/${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to load user details.");
      setDetailUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load user details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionUser || !actionType) return;
    if (actionType === "suspend" && !actionReason.trim()) {
      setError("A reason must be provided to suspend an account.");
      return;
    }

    setSubmittingAction(true);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      const nextStatus = actionType === "suspend" ? "suspended" : "active";
      const res = await fetch(`${api}/admin/users/${encodeURIComponent(actionUser.clerkUserId)}/status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: nextStatus, reason: actionReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to update account status.");

      setNotice(`User ${actionUser.name || actionUser.clerkUserId} has been ${actionType === "suspend" ? "suspended" : "reactivated"}.`);
      setActionUser(null);
      setActionType(null);
      setActionReason("");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error executing status change.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <main className="admin-page">
      <AdminNav activeSection="users" />
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">ACCOUNTS & ROLES</p>
            <h1>User Management</h1>
          </div>
          <div className="admin-top-actions">
            <ThemePicker compact />
            <button className="button button-outline" onClick={() => void fetchUsers()} disabled={loading} style={{ fontSize: 11 }}>
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

        {notice && (
          <div className="admin-welcome" style={{ minHeight: "auto", padding: 16, marginBottom: 20 }}>
            <div>
              <p className="eyebrow">ACTION COMPLETED</p>
              <h2 style={{ fontSize: 16, margin: 0 }}>{notice}</h2>
            </div>
          </div>
        )}

        <div className="admin-panel">
          <div className="admin-panel-head" style={{ flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2>User Directory</h2>
              <p>Search by name, email, phone, or Clerk subject ID</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
              />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "6px 10px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
              >
                <option value="">All Roles</option>
                <option value="USER">USER</option>
                <option value="OWNER">OWNER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "6px 10px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-muted)", fontSize: 11, padding: "30px 0", textAlign: "center" }}>Loading user accounts...</p>
          ) : !users.length ? (
            <div className="admin-table-empty">
              <span>⌕</span>
              <b>No users found</b>
              <p>Try modifying your search query or role filter.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentClerkUser?.id === u.clerkUserId;
                    const isSuspended = u.accountStatus === "suspended";

                    return (
                      <tr key={u.clerkUserId}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>
                            {u.name || "Anonymous User"}
                            {isSelf && <span style={{ marginLeft: 6, fontSize: 8, padding: "2px 5px", background: "var(--color-primary)", color: "#fff", borderRadius: 4 }}>YOU</span>}
                          </div>
                          <small style={{ color: "var(--color-muted)", fontSize: 9 }}>{u.clerkUserId}</small>
                        </td>
                        <td style={{ padding: "12px", fontSize: 10 }}>
                          <div>{u.email || "—"}</div>
                          <small style={{ color: "var(--color-muted)" }}>{u.phone || u.city || ""}</small>
                        </td>
                        <td style={{ padding: "12px", fontSize: 10 }}>
                          <span style={{ fontWeight: 700 }}>{u.role || "USER"}</span>
                        </td>
                        <td style={{ padding: "12px", fontSize: 10 }}>
                          <span className={`report-status report-status-${u.accountStatus || "active"}`}>
                            {u.accountStatus || "active"}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: 10, color: "var(--color-muted)" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "12px", fontSize: 10 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="button button-outline"
                              style={{ padding: "4px 8px", fontSize: 9 }}
                              onClick={() => void openUserDetails(u.clerkUserId)}
                            >
                              Details
                            </button>
                            {isSuspended ? (
                              <button
                                type="button"
                                className="button button-outline"
                                style={{ padding: "4px 8px", fontSize: 9, color: "var(--color-green)", borderColor: "var(--color-green)" }}
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("reactivate");
                                  setActionReason("");
                                }}
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="button button-outline"
                                disabled={isSelf}
                                title={isSelf ? "Admins cannot suspend their own account" : ""}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: 9,
                                  color: isSelf ? "var(--color-muted)" : "#DC2626",
                                  borderColor: isSelf ? "var(--color-border)" : "#FCA5A5",
                                }}
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("suspend");
                                  setActionReason("");
                                }}
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

        {/* Modal: Suspend / Reactivate */}
        {actionUser && actionType && (
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
                maxWidth: 450,
                width: "100%",
                padding: 24,
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>
                {actionType === "suspend" ? "Suspend User Account" : "Reactivate User Account"}
              </h2>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
                Target: <b>{actionUser.name || actionUser.clerkUserId}</b> ({actionUser.email || "No email"})
              </p>

              <form onSubmit={handleStatusSubmit}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                  Moderation Reason:
                  <textarea
                    required={actionType === "suspend"}
                    placeholder={
                      actionType === "suspend"
                        ? "Explain why this user account is being suspended..."
                        : "Optional note on reactivation..."
                    }
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: 8,
                      fontSize: 11,
                      borderRadius: 6,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      color: "var(--color-text)",
                    }}
                  />
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => {
                      setActionUser(null);
                      setActionType(null);
                    }}
                    disabled={submittingAction}
                    style={{ fontSize: 11 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={submittingAction}
                    style={{
                      fontSize: 11,
                      background: actionType === "suspend" ? "#DC2626" : "var(--color-green)",
                      borderColor: actionType === "suspend" ? "#DC2626" : "var(--color-green)",
                    }}
                  >
                    {submittingAction
                      ? "Executing..."
                      : actionType === "suspend"
                      ? "Confirm Suspension"
                      : "Confirm Reactivation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: User Details & Listings Drawer */}
        {detailUser && (
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
                maxWidth: 600,
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
                padding: 24,
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{detailUser.user.name || "Anonymous User"}</h2>
                  <small style={{ color: "var(--color-muted)", fontSize: 10 }}>{detailUser.user.clerkUserId}</small>
                </div>
                <button
                  type="button"
                  className="button button-outline"
                  style={{ padding: "4px 8px", fontSize: 10 }}
                  onClick={() => setDetailUser(null)}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11, marginBottom: 20 }}>
                <div>
                  <strong>Email:</strong> {detailUser.user.email || "—"}
                </div>
                <div>
                  <strong>Phone:</strong> {detailUser.user.phone || "—"}
                </div>
                <div>
                  <strong>City:</strong> {detailUser.user.city || "—"}
                </div>
                <div>
                  <strong>Role:</strong> {detailUser.user.role || "USER"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className={`report-status report-status-${detailUser.user.accountStatus || "active"}`}>
                    {detailUser.user.accountStatus || "active"}
                  </span>
                </div>
                <div>
                  <strong>Joined:</strong>{" "}
                  {detailUser.user.createdAt ? new Date(detailUser.user.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>

              {detailUser.user.about && (
                <div style={{ fontSize: 11, marginBottom: 20, padding: 10, background: "var(--color-bg)", borderRadius: 6 }}>
                  <strong>About:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)" }}>{detailUser.user.about}</p>
                </div>
              )}

              <h3 style={{ fontSize: 14, margin: "0 0 10px" }}>Published Properties ({detailUser.listingsCount})</h3>
              {!detailUser.listings.length ? (
                <p style={{ fontSize: 11, color: "var(--color-muted)" }}>This user has not listed any properties.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>City</th>
                        <th>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailUser.listings.map((l) => (
                        <tr key={l._id}>
                          <td style={{ padding: "8px 10px", fontSize: 10, fontWeight: 600 }}>{l.title}</td>
                          <td style={{ padding: "8px 10px", fontSize: 9 }}>{l.location?.city || "—"}</td>
                          <td style={{ padding: "8px 10px", fontSize: 9 }}>₹{l.priceAmount?.toLocaleString("en-IN")}</td>
                          <td style={{ padding: "8px 10px", fontSize: 9 }}>
                            <span className={`report-status report-status-${l.status}`}>{l.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
