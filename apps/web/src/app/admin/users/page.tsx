"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "../components/AdminShell";
import { AdminUserRecord, fetchAdminApi } from "../lib/adminApi";

type UserDetailsResponse = {
  user: AdminUserRecord;
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

export default function AdminUsersPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user: currentClerkUser } = useUser();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Moderation modal
  const [actionUser, setActionUser] = useState<AdminUserRecord | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "reactivate" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Details drawer
  const [detailUser, setDetailUser] = useState<UserDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!isSignedIn) return;
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

      const data = await fetchAdminApi<{
        items: AdminUserRecord[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/users?${params.toString()}`, token);

      setUsers(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user list.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn, page, roleFilter, search, statusFilter]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchUsers();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchUsers]);

  const openUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const token = await getToken();
      const data = await fetchAdminApi<UserDetailsResponse>(
        `/users/${encodeURIComponent(userId)}`,
        token
      );
      setDetailUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load user details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionUser || !actionType || !actionReason.trim()) return;

    setSubmittingAction(true);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      const nextStatus = actionType === "suspend" ? "suspended" : "active";

      await fetchAdminApi(`/users/${encodeURIComponent(actionUser.clerkUserId)}/status`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reason: actionReason.trim(),
        }),
      });

      setNotice(`User account "${actionUser.name || actionUser.email}" has been ${actionType === "suspend" ? "suspended" : "reactivated"}.`);
      setActionUser(null);
      setActionType(null);
      setActionReason("");
      if (detailUser?.user.clerkUserId === actionUser.clerkUserId) {
        setDetailUser(null);
      }
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "User status update failed.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <AdminShell
      activeSection="users"
      title="User Accounts Directory"
      description={`Inspect registered buyer, owner, and administrator accounts (${totalCount} users recorded in database).`}
      actions={
        <div className="shadcn-admin-action-row">
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void fetchUsers()}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      }
    >
      {/* Notice & Error Banners */}
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

      {/* FILTER BAR */}
      <div className="shadcn-admin-filter-bar">
        <div className="shadcn-admin-search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className="shadcn-admin-search-input"
            placeholder="Search by name, email, phone, city or Clerk ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void fetchUsers()}
          />
          {search && (
            <button type="button" className="shadcn-admin-input-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        <div className="shadcn-admin-filter-selects">
          <select
            className="shadcn-admin-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="USER">Buyer / Regular User</option>
            <option value="OWNER">Verified Owner</option>
            <option value="ADMIN">Administrator</option>
          </select>

          <select
            className="shadcn-admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>

          <button
            type="button"
            className="shadcn-admin-btn is-secondary"
            onClick={() => void fetchUsers()}
          >
            Filter
          </button>

          {(search || roleFilter || statusFilter) && (
            <button
              type="button"
              className="shadcn-admin-btn is-ghost"
              onClick={() => {
                setSearch("");
                setRoleFilter("");
                setStatusFilter("");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="shadcn-admin-card">
        <div className="shadcn-admin-table-wrap">
          <table className="shadcn-admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>City</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    Loading users from MongoDB…
                  </td>
                </tr>
              ) : !users.length ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    No users match your current search filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentClerkUser?.id === u.clerkUserId;
                  const initials = (u.name || u.email || "U")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("");

                  return (
                    <tr key={u.clerkUserId}>
                      <td>
                        <div className="shadcn-admin-user-cell">
                          <div className="shadcn-admin-user-cell-avatar">
                            {initials}
                          </div>
                          <div className="shadcn-admin-user-cell-info">
                            <strong className="shadcn-admin-cell-title">
                              {u.name || "Anonymous User"}
                            </strong>
                            <span className="shadcn-admin-cell-sub">
                              {u.email || u.clerkUserId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`shadcn-admin-role-pill is-${u.role?.toLowerCase() || "user"}`}>
                          {u.role || "USER"}
                        </span>
                      </td>
                      <td>
                        <span className={`shadcn-admin-status-pill is-${u.accountStatus || "active"}`}>
                          {u.accountStatus === "suspended" ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td>
                        <span className="shadcn-admin-cell-text">
                          {u.city || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="shadcn-admin-cell-time">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td>
                        <div className="shadcn-admin-table-actions">
                          <button
                            type="button"
                            className="shadcn-admin-btn is-xs is-outline"
                            onClick={() => void openUserDetails(u.clerkUserId)}
                          >
                            Details
                          </button>
                          {!isSelf && (
                            u.accountStatus === "suspended" ? (
                              <button
                                type="button"
                                className="shadcn-admin-btn is-xs is-emerald"
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("reactivate");
                                  setActionReason("Account restored upon review.");
                                }}
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="shadcn-admin-btn is-xs is-danger"
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("suspend");
                                  setActionReason("");
                                }}
                              >
                                Suspend
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="shadcn-admin-pagination">
            <span className="shadcn-admin-pagination-info">
              Page {page} of {totalPages} ({totalCount} users)
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

      {/* SUSPEND / REACTIVATE MODAL */}
      {actionUser && actionType && (
        <div className="shadcn-admin-modal-backdrop">
          <div className="shadcn-admin-modal-dialog">
            <div className="shadcn-admin-modal-head">
              <h3>
                {actionType === "suspend" ? "Suspend User Account" : "Reactivate User Account"}
              </h3>
              <button type="button" onClick={() => setActionUser(null)} className="shadcn-admin-modal-close">×</button>
            </div>
            <form onSubmit={handleActionSubmit} className="shadcn-admin-modal-body">
              <p>
                You are about to {actionType} account{" "}
                <strong>&quot;{actionUser.name || actionUser.email}&quot;</strong> (<code>{actionUser.clerkUserId}</code>).
              </p>
              <div className="shadcn-admin-field">
                <label htmlFor="user-mod-reason">Reason for audit log (Required):</label>
                <textarea
                  id="user-mod-reason"
                  rows={3}
                  className="shadcn-admin-textarea"
                  placeholder="State the reason for this account status change…"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  required
                />
              </div>
              <div className="shadcn-admin-modal-actions">
                <button
                  type="button"
                  className="shadcn-admin-btn is-ghost"
                  onClick={() => setActionUser(null)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`shadcn-admin-btn ${actionType === "reactivate" ? "is-primary" : "is-destructive"}`}
                  disabled={submittingAction || !actionReason.trim()}
                >
                  {submittingAction ? "Processing…" : `Confirm ${actionType === "suspend" ? "Suspension" : "Reactivation"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAILS SLIDE-OVER DRAWER */}
      {detailUser && (
        <div className="shadcn-admin-drawer-backdrop" onClick={() => setDetailUser(null)}>
          <div className="shadcn-admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="shadcn-admin-drawer-head">
              <div>
                <span className="shadcn-admin-drawer-eyebrow">USER PROFILE INSPECTOR</span>
                <h3 className="shadcn-admin-drawer-title">
                  {detailUser.user.name || "Anonymous User"}
                </h3>
              </div>
              <button type="button" onClick={() => setDetailUser(null)} className="shadcn-admin-drawer-close">×</button>
            </div>

            <div className="shadcn-admin-drawer-body">
              <div className="shadcn-admin-section-box">
                <h4>Account Details</h4>
                <div className="shadcn-admin-user-details-list">
                  <p><strong>Name:</strong> {detailUser.user.name || "N/A"}</p>
                  <p><strong>Email:</strong> {detailUser.user.email || "N/A"}</p>
                  <p><strong>Phone:</strong> {detailUser.user.phone || "N/A"}</p>
                  <p><strong>City:</strong> {detailUser.user.city || "N/A"}</p>
                  <p><strong>Role:</strong> <span className="shadcn-admin-role-pill is-subtle">{detailUser.user.role || "USER"}</span></p>
                  <p><strong>Account Status:</strong> <span className={`shadcn-admin-status-pill is-${detailUser.user.accountStatus || "active"}`}>{detailUser.user.accountStatus || "active"}</span></p>
                  <p><strong>Clerk ID:</strong> <code>{detailUser.user.clerkUserId}</code></p>
                  <p><strong>Joined:</strong> {detailUser.user.createdAt ? new Date(detailUser.user.createdAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>

              {detailUser.user.about && (
                <div className="shadcn-admin-section-box">
                  <h4>About / Bio</h4>
                  <p className="shadcn-admin-desc-text">{detailUser.user.about}</p>
                </div>
              )}

              {/* Owned listings by this user */}
              <div className="shadcn-admin-section-box">
                <h4>Published Properties ({detailUser.listingsCount})</h4>
                {!detailUser.listings.length ? (
                  <p className="shadcn-admin-empty-sub">This user has not published any property listings.</p>
                ) : (
                  <div className="shadcn-admin-user-listings-list">
                    {detailUser.listings.map((item) => (
                      <div key={item._id} className="shadcn-admin-user-listing-item">
                        <div>
                          <Link href={`/property/${item.slug}`} target="_blank" className="shadcn-admin-cell-title">
                            {item.title}
                          </Link>
                          <span className="shadcn-admin-cell-sub">
                            {item.location?.city || "Unspecified"} · ₹{item.priceAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span className={`shadcn-admin-status-pill is-${item.status}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
