"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "./components/AdminNav";
import ThemePicker from "../components/ThemePicker";

type OverviewData = {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    totalProperties: number;
    activeListings: number;
    hiddenListings: number;
    removedListings: number;
    pendingReports: number;
    resolvedReports: number;
  };
  recentUsers: Array<{
    clerkUserId: string;
    name?: string;
    email?: string;
    role?: string;
    accountStatus?: string;
    createdAt?: string;
  }>;
  recentProperties: Array<{
    _id: string;
    title: string;
    slug: string;
    priceAmount: number;
    listingType: string;
    status: string;
    location?: { city?: string };
    createdAt?: string;
  }>;
  recentAuditLogs: Array<{
    _id: string;
    action: string;
    targetType: string;
    targetId: string;
    reason?: string;
    createdAt?: string;
  }>;
};

const api = "/api/v1";

export default function AdminOverviewPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is required to load admin data.");
      const res = await fetch(`${api}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body.message === "string" ? body.message : "Could not load admin overview data.");
      }
      setData(body);
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
      <main className="admin-page">
        <AdminNav activeSection="overview" />
        <section className="admin-main">
          <div className="admin-warning" role="alert">
            <strong>Admin Sign-In Required</strong>
            <span>Sign in with an authorized administrator account to access the operations console.</span>
            <div style={{ marginTop: 12 }}>
              <Link className="button button-primary" href="/sign-in?redirect_url=%2Fadmin">
                Sign In as Admin
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <AdminNav activeSection="overview" />
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">OPERATIONS</p>
            <h1>Overview</h1>
          </div>
          <div className="admin-top-actions">
            <ThemePicker compact />
            <button
              className="button button-outline"
              type="button"
              onClick={() => void loadMetrics()}
              disabled={loading}
              style={{ fontSize: 11, padding: "7px 12px" }}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        {error ? (
          <div className="admin-warning" role="alert">
            <strong>Access or Network Error</strong>
            <span>{error}</span>
            <div style={{ marginTop: 8 }}>
              <button className="button button-outline" onClick={() => void loadMetrics()}>
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-welcome">
            <div>
              <p className="eyebrow">APNA GHAR OPERATIONS</p>
              <h2>Live marketplace health.</h2>
              <p>Real-time MongoDB aggregates for inventory, user accounts, and moderation actions.</p>
            </div>
            <div className="admin-welcome-mark">⌂</div>
          </div>
        )}

        <div className="admin-metrics">
          <article className="admin-metric">
            <span>Total Registered Users</span>
            <strong>{loading ? "..." : data?.metrics?.totalUsers ?? 0}</strong>
            <small>{data?.metrics?.activeUsers ?? 0} active · {data?.metrics?.suspendedUsers ?? 0} suspended</small>
          </article>
          <article className="admin-metric">
            <span>Active Listings</span>
            <strong>{loading ? "..." : data?.metrics?.activeListings ?? 0}</strong>
            <small>{data?.metrics?.totalProperties ?? 0} total listings on file</small>
          </article>
          <article className="admin-metric">
            <span>Hidden / Moderated</span>
            <strong>{loading ? "..." : (data?.metrics?.hiddenListings ?? 0) + (data?.metrics?.removedListings ?? 0)}</strong>
            <small>{data?.metrics?.hiddenListings ?? 0} by owner · {data?.metrics?.removedListings ?? 0} by admin</small>
          </article>
          <article className="admin-metric">
            <span>Pending Safety Reports</span>
            <strong style={{ color: (data?.metrics?.pendingReports ?? 0) > 0 ? "var(--color-primary)" : "inherit" }}>
              {loading ? "..." : data?.metrics?.pendingReports ?? 0}
            </strong>
            <small>{data?.metrics?.resolvedReports ?? 0} resolved reports</small>
          </article>
        </div>

        <div className="admin-content-grid">
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <h2>Recent Listings</h2>
                <p>Latest properties submitted to the marketplace</p>
              </div>
              <Link href="/admin/listings">Manage all listings ↗</Link>
            </div>
            {loading ? (
              <p style={{ color: "var(--color-muted)", fontSize: 11, padding: "20px 0" }}>Loading listings...</p>
            ) : !data?.recentProperties?.length ? (
              <div className="admin-queue-empty">
                <span>✓</span>
                <div>
                  <b>No property records yet</b>
                  <p>When users post properties, the latest additions appear here.</p>
                </div>
              </div>
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
                    {data.recentProperties.map((prop) => (
                      <tr key={prop._id}>
                        <td style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600 }}>{prop.title}</td>
                        <td style={{ padding: "10px 12px", fontSize: 10 }}>{prop.location?.city || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 10 }}>₹{prop.priceAmount?.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "10px 12px", fontSize: 10 }}>
                          <span className={`report-status report-status-${prop.status}`}>{prop.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <h2>Recent Users</h2>
                <p>Latest registered buyer and owner accounts</p>
              </div>
              <Link href="/admin/users">Manage directory ↗</Link>
            </div>
            {loading ? (
              <p style={{ color: "var(--color-muted)", fontSize: 11, padding: "20px 0" }}>Loading users...</p>
            ) : !data?.recentUsers?.length ? (
              <div className="admin-queue-empty">
                <span>✓</span>
                <div>
                  <b>No registered accounts</b>
                  <p>New signups will be logged here in real time.</p>
                </div>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name / Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentUsers.map((user) => (
                      <tr key={user.clerkUserId}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{user.name || "Anonymous User"}</div>
                          <small style={{ color: "var(--color-muted)", fontSize: 9 }}>{user.email || user.clerkUserId}</small>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 10 }}>
                          <span style={{ fontWeight: 700 }}>{user.role || "USER"}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 10 }}>
                          <span className={`report-status report-status-${user.accountStatus || "active"}`}>
                            {user.accountStatus || "active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className="admin-panel" style={{ marginTop: 20 }}>
          <div className="admin-panel-head">
            <div>
              <h2>Recent Moderation Audit Trail</h2>
              <p>Persistent logs of admin interventions and policy enforcements</p>
            </div>
            <Link href="/admin/audit-logs">View full audit logs ↗</Link>
          </div>
          {loading ? (
            <p style={{ color: "var(--color-muted)", fontSize: 11, padding: "20px 0" }}>Loading audit log...</p>
          ) : !data?.recentAuditLogs?.length ? (
            <div className="admin-queue-empty">
              <span>✓</span>
              <div>
                <b>No moderation events recorded</b>
                <p>Actions like hiding properties or suspending accounts will create tamper-evident logs.</p>
              </div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAuditLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ padding: "10px 12px", fontSize: 10, color: "var(--color-muted)" }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700 }}>{log.action}</td>
                      <td style={{ padding: "10px 12px", fontSize: 10 }}>
                        {log.targetType}: {log.targetId}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 10 }}>{log.reason || "No reason specified"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-footer">
          Apna Ghar Administration Console · All metrics derived from verified MongoDB collections.
        </footer>
      </section>
    </main>
  );
}
