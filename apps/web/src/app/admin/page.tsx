"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "./components/AdminShell";
import { AdminOverviewData, fetchAdminApi } from "./lib/adminApi";

export default function AdminOverviewPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadMetrics = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is required to load admin data.");
      const overview = await fetchAdminApi<AdminOverviewData>("/overview", token);
      setData(overview);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin overview.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void loadMetrics();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, loadMetrics]);

  if (isLoaded && !isSignedIn) {
    return (
      <AdminShell activeSection="overview" title="Admin Operations Console">
        <div className="shadcn-admin-auth-card">
          <div className="shadcn-admin-auth-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2>Admin Authentication Required</h2>
          <p>Sign in with an authorized administrator account to access the real-time operations console.</p>
          <Link href="/sign-in?redirect_url=%2Fadmin" className="shadcn-admin-btn-primary">
            Sign In as Admin
          </Link>
        </div>
      </AdminShell>
    );
  }

  const formatPrice = (val?: number) => {
    if (typeof val !== "number" || isNaN(val)) return "₹0";
    if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(2)} Cr`;
    if (val >= 100_000) return `₹${(val / 100_000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <AdminShell
      activeSection="overview"
      title="Platform Operations & Health"
      description="Live real-time MongoDB Atlas aggregates for property listings, user accounts, and moderation actions."
      pendingReportsCount={data?.metrics?.pendingReports || 0}
      actions={
        <div className="shadcn-admin-action-row">
          {lastRefreshed && (
            <span className="shadcn-admin-refreshed-label">
              Updated: {lastRefreshed}
            </span>
          )}
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void loadMetrics()}
            disabled={loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "shadcn-spin" : ""}>
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>{loading ? "Refreshing…" : "Refresh Metrics"}</span>
          </button>
          <Link href="/list-property" className="shadcn-admin-btn is-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Post Listing</span>
          </Link>
        </div>
      }
    >
      {/* Alert banner if error occurs */}
      {error && (
        <div className="shadcn-admin-banner is-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Error connecting to production admin service</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => void loadMetrics()} className="shadcn-admin-btn is-sm is-outline">
            Retry
          </button>
        </div>
      )}

      {/* 1. METRICS CARDS GRID (SHADCN STUDIO CARDS) */}
      <div className="shadcn-admin-stats-grid">
        {/* Metric 1: Total Registered Users */}
        <div className="shadcn-admin-stat-card">
          <div className="shadcn-admin-stat-head">
            <span className="shadcn-admin-stat-label">Total Registered Users</span>
            <span className="shadcn-admin-stat-icon is-blue" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <div className="shadcn-admin-stat-value">
            {loading ? "…" : data?.metrics?.totalUsers ?? 0}
          </div>
          <div className="shadcn-admin-stat-meta">
            <span className="shadcn-admin-badge is-emerald">
              {data?.metrics?.activeUsers ?? 0} active
            </span>
            {data?.metrics?.suspendedUsers ? (
              <span className="shadcn-admin-badge is-rose">
                {data.metrics.suspendedUsers} suspended
              </span>
            ) : null}
            <Link href="/admin/users" className="shadcn-admin-stat-link">View directory →</Link>
          </div>
        </div>

        {/* Metric 2: Active Listings */}
        <div className="shadcn-admin-stat-card">
          <div className="shadcn-admin-stat-head">
            <span className="shadcn-admin-stat-label">Active Listings</span>
            <span className="shadcn-admin-stat-icon is-emerald" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <path d="M10 6h4" />
                <path d="M10 10h4" />
              </svg>
            </span>
          </div>
          <div className="shadcn-admin-stat-value">
            {loading ? "…" : data?.metrics?.activeListings ?? 0}
          </div>
          <div className="shadcn-admin-stat-meta">
            <span className="shadcn-admin-meta-text">
              {data?.metrics?.totalProperties ?? 0} total properties on file
            </span>
            <Link href="/admin/listings" className="shadcn-admin-stat-link">Manage →</Link>
          </div>
        </div>

        {/* Metric 3: Hidden / Moderated */}
        <div className="shadcn-admin-stat-card">
          <div className="shadcn-admin-stat-head">
            <span className="shadcn-admin-stat-label">Hidden / Moderated</span>
            <span className="shadcn-admin-stat-icon is-amber" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </span>
          </div>
          <div className="shadcn-admin-stat-value">
            {loading ? "…" : (data?.metrics?.hiddenListings ?? 0) + (data?.metrics?.removedListings ?? 0)}
          </div>
          <div className="shadcn-admin-stat-meta">
            <span className="shadcn-admin-meta-text">
              {data?.metrics?.hiddenListings ?? 0} by owner · {data?.metrics?.removedListings ?? 0} by admin
            </span>
          </div>
        </div>

        {/* Metric 4: Safety Reports */}
        <div className="shadcn-admin-stat-card">
          <div className="shadcn-admin-stat-head">
            <span className="shadcn-admin-stat-label">Pending Safety Reports</span>
            <span className="shadcn-admin-stat-icon is-rose" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </span>
          </div>
          <div className="shadcn-admin-stat-value">
            {loading ? "…" : data?.metrics?.pendingReports ?? 0}
          </div>
          <div className="shadcn-admin-stat-meta">
            <span className="shadcn-admin-badge is-emerald">
              {data?.metrics?.resolvedReports ?? 0} resolved
            </span>
            <Link href="/admin/reports" className="shadcn-admin-stat-link">Queue →</Link>
          </div>
        </div>
      </div>

      {/* 2. RECENT ACTIVITY DUAL COLUMN */}
      <div className="shadcn-admin-activity-grid">
        {/* Recent Listings Card */}
        <div className="shadcn-admin-card">
          <div className="shadcn-admin-card-head">
            <div>
              <h3 className="shadcn-admin-card-title">Recent Property Listings</h3>
              <p className="shadcn-admin-card-sub">Latest properties submitted to the marketplace</p>
            </div>
            <Link href="/admin/listings" className="shadcn-admin-btn is-sm is-ghost">
              Manage all →
            </Link>
          </div>

          <div className="shadcn-admin-table-wrap">
            <table className="shadcn-admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="shadcn-admin-table-empty">
                      Loading recent listings from MongoDB Atlas…
                    </td>
                  </tr>
                ) : !data?.recentProperties?.length ? (
                  <tr>
                    <td colSpan={4} className="shadcn-admin-table-empty">
                      No property listings recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recentProperties.map((prop) => (
                    <tr key={prop._id}>
                      <td>
                        <div className="shadcn-admin-table-primary-cell">
                          <Link href={`/property/${prop.slug}`} target="_blank" className="shadcn-admin-cell-title">
                            {prop.title}
                          </Link>
                          <span className="shadcn-admin-cell-sub">
                            {prop.listingType === "rent" ? "For Rent" : "For Sale"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="shadcn-admin-cell-text">
                          {prop.location?.city || "Unspecified"}
                        </span>
                      </td>
                      <td>
                        <strong className="shadcn-admin-price-pill">
                          {formatPrice(prop.priceAmount)}
                        </strong>
                      </td>
                      <td>
                        <span className={`shadcn-admin-status-pill is-${prop.status}`}>
                          {prop.status === "active"
                            ? "Active"
                            : prop.status === "hidden_by_owner"
                            ? "Hidden"
                            : "Removed"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users Card */}
        <div className="shadcn-admin-card">
          <div className="shadcn-admin-card-head">
            <div>
              <h3 className="shadcn-admin-card-title">Recent Registered Users</h3>
              <p className="shadcn-admin-card-sub">Latest authenticated buyer and owner profiles</p>
            </div>
            <Link href="/admin/users" className="shadcn-admin-btn is-sm is-ghost">
              Manage users →
            </Link>
          </div>

          <div className="shadcn-admin-table-wrap">
            <table className="shadcn-admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="shadcn-admin-table-empty">
                      Loading registered users…
                    </td>
                  </tr>
                ) : !data?.recentUsers?.length ? (
                  <tr>
                    <td colSpan={3} className="shadcn-admin-table-empty">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  data.recentUsers.map((u) => (
                    <tr key={u.clerkUserId}>
                      <td>
                        <div className="shadcn-admin-user-cell">
                          <div className="shadcn-admin-user-cell-avatar">
                            {u.name?.slice(0, 2).toUpperCase() || "U"}
                          </div>
                          <div className="shadcn-admin-user-cell-info">
                            <strong className="shadcn-admin-cell-title">
                              {u.name || "Anonymous User"}
                            </strong>
                            <span className="shadcn-admin-cell-sub">{u.email || "No email"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="shadcn-admin-role-pill is-subtle">
                          {u.role || "USER"}
                        </span>
                      </td>
                      <td>
                        <span className={`shadcn-admin-status-pill is-${u.accountStatus || "active"}`}>
                          {u.accountStatus === "suspended" ? "Suspended" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. RECENT AUDIT TRAIL STREAM */}
      <div className="shadcn-admin-card" style={{ marginTop: 20 }}>
        <div className="shadcn-admin-card-head">
          <div>
            <h3 className="shadcn-admin-card-title">Live Moderation Audit Trail</h3>
            <p className="shadcn-admin-card-sub">Real-time immutable log of administrative interventions and policy updates</p>
          </div>
          <Link href="/admin/audit-logs" className="shadcn-admin-btn is-sm is-ghost">
            View complete trail →
          </Link>
        </div>

        <div className="shadcn-admin-table-wrap">
          <table className="shadcn-admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Target Scope</th>
                <th>Stated Reason</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="shadcn-admin-table-empty">
                    Loading audit trail…
                  </td>
                </tr>
              ) : !data?.recentAuditLogs?.length ? (
                <tr>
                  <td colSpan={4} className="shadcn-admin-table-empty">
                    No moderation interventions recorded. System operating normally.
                  </td>
                </tr>
              ) : (
                data.recentAuditLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className="shadcn-admin-action-pill">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="shadcn-admin-cell-text">
                        <strong>{log.targetType.toUpperCase()}:</strong> {log.targetId}
                      </span>
                    </td>
                    <td>
                      <span className="shadcn-admin-cell-sub">
                        {log.reason || "Operational review"}
                      </span>
                    </td>
                    <td>
                      <span className="shadcn-admin-cell-time">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Recent"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
