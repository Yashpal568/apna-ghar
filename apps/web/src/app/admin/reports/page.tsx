"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

type Report = {
  _id: string;
  propertyId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  createdAt?: string;
};

const api = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
const reasons: Record<string, string> = {
  misleading: "Misleading listing", duplicate: "Duplicate listing", scam: "Possible scam",
  wrong_information: "Incorrect information", inappropriate: "Inappropriate content", other: "Other",
};

export default function AdminReportsPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="admin-page"><section className="admin-main"><div className="admin-warning"><strong>Admin authentication is not configured</strong><span>Configure Clerk and ADMIN_CLERK_USER_IDS on the API before opening the moderation queue.</span></div></section></main>;
  }
  return <AuthenticatedAdminReportsPage />;
}

function AuthenticatedAdminReportsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = await getToken();
      if (!token || !isSignedIn) throw new Error("Sign in with an authorized admin account to view reports.");
      const response = await fetch(api + "/property-reports/admin" + (status ? "?status=" + encodeURIComponent(status) : ""), {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not load the moderation queue.");
      setReports(Array.isArray(body) ? body : []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load reports."); }
    finally { setLoading(false); }
  }, [getToken, isSignedIn, status]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(reportId: string, nextStatus: Report["status"]) {
    setBusyId(reportId); setError(""); setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session has expired. Sign in again.");
      const response = await fetch(api + "/property-reports/admin/" + encodeURIComponent(reportId) + "/status", {
        method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not update this report.");
      setNotice("Report status updated.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update report."); }
    finally { setBusyId(""); }
  }

  if (!isSignedIn) return <main className="admin-page"><section className="admin-main"><div className="admin-warning"><strong>Admin sign-in required</strong><span>Sign in with an account authorized by the API administrator to access reports.</span><a className="button button-primary" href="/sign-in?redirect_url=%2Fadmin%2Freports">Sign in</a></div></section></main>;

  return <main className="admin-page">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/"><span className="brand-name">Apna <b>Ghar</b></span><small>ADMIN CONSOLE</small></a>
      <p className="admin-nav-label">WORKSPACE</p>
      <a className="admin-nav-item" href="/admin">◫ Overview</a>
      <a className="admin-nav-item" href="/admin/listings">▤ Listings</a>
      <a className="admin-nav-item" href="/admin/users">♙ Users</a>
      <a className="admin-nav-item active" href="/admin/reports">⚑ Safety reports</a>
      <p className="admin-nav-label">CONFIGURATION</p>
      <a className="admin-nav-item" href="/admin/plans">◇ Plans & entitlements</a>
      <a className="admin-nav-item" href="/admin/settings">⚙ Settings</a>
      <div className="admin-sidebar-foot"><span className="admin-avatar">AG</span><div><b>Authorized session</b><small>API access controlled</small></div></div>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div><p className="eyebrow">TRUST & SAFETY</p><h1>Safety reports</h1><p>Review user-submitted reports and update their workflow status.</p></div><button className="button button-outline" type="button" onClick={()=>void load()} disabled={loading}>{loading?"Refreshing…":"Refresh queue"}</button></header>
      <div className="admin-warning"><strong>Moderation discipline</strong><span>Changing a report status does not automatically hide a property. Review the listing separately and take moderation action only when justified.</span></div>
      <div className="admin-panel">
        <div className="admin-panel-head"><div><h2>Report queue</h2><p>{loading?"Loading reports…":reports.length+" reports in this view"}</p></div>
          <label className="report-filter-label">Status <select value={status} onChange={e=>setStatus(e.target.value)}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="">All statuses</option></select></label>
        </div>
        {error&&<div className="admin-warning" role="alert"><strong>Could not load moderation data</strong><span>{error}</span><button className="button button-outline" onClick={()=>void load()}>Try again</button></div>}
        {notice&&<p className="form-notice" role="status">{notice}</p>}
        {loading?<div className="report-list-skeleton" aria-label="Loading reports"><div/><div/><div/></div>:!error&&!reports.length?<div className="admin-queue-empty"><span>✓</span><div><b>No reports in this status</b><p>This is a live API result. New reports will appear after a refresh.</p></div></div>:<div className="admin-report-list">{reports.map(report=><article className="admin-report-card" key={report._id}>
          <div className="admin-report-heading"><div><span className={"report-status report-status-"+report.status}>{report.status.replace("_"," ")}</span><h3>{reasons[report.reason]||report.reason}</h3></div><time>{report.createdAt?new Date(report.createdAt).toLocaleString():"Date unavailable"}</time></div>
          <dl><div><dt>Property ID</dt><dd>{report.propertyId}</dd></div><div><dt>Report ID</dt><dd>{report._id}</dd></div><div><dt>Reporter ID</dt><dd>{report.reporterId}</dd></div></dl>
          {report.details&&<p className="admin-report-details">{report.details}</p>}
          <div className="admin-report-actions"><label>Update status <select value={report.status} disabled={busyId===report._id} onChange={e=>void updateStatus(report._id,e.target.value as Report["status"])}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label><span className="text-muted">Property details page is being redesigned.</span></div>
        </article>)}</div>}
      </div>
      <footer className="admin-footer">Apna Ghar Admin · Queue data loaded from the API.</footer>
    </section>
  </main>;
}
