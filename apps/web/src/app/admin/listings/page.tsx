"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/AdminNav";
import ThemePicker from "../../components/ThemePicker";

type PropertyRecord = {
  _id: string;
  title: string;
  slug: string;
  ownerId: string;
  priceAmount: number;
  listingType: "sale" | "rent";
  categoryId: string;
  status: "active" | "hidden_by_owner" | "removed_by_admin" | "deleted";
  location?: { state?: string; city?: string; locality?: string };
  imageUrls?: string[];
  videoUrls?: string[];
  viewsCount?: number;
  publishedAt?: string;
  createdAt?: string;
};

type PropertyDetailResponse = {
  property: PropertyRecord & { description?: string; areaValue?: number; areaUnit?: string; bedrooms?: number; bathrooms?: number };
  owner?: { clerkUserId: string; name?: string; email?: string; phone?: string; role?: string; accountStatus?: string };
  reports?: Array<{ _id: string; reason: string; details?: string; status: string; createdAt?: string }>;
};

const api = "/api/v1";

export default function AdminListingsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Moderation action modal
  const [targetProperty, setTargetProperty] = useState<PropertyRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<"active" | "hidden_by_owner" | "removed_by_admin" | null>(null);
  const [modReason, setModReason] = useState("");
  const [submittingMod, setSubmittingMod] = useState(false);

  // Details drawer
  const [inspectData, setInspectData] = useState<PropertyDetailResponse | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (cityFilter.trim()) params.set("city", cityFilter.trim());
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`${api}/admin/properties?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to load properties.");

      setProperties(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }, [cityFilter, getToken, page, search, statusFilter]);

  useEffect(() => {
    if (isSignedIn) {
      void fetchProperties();
    }
  }, [isSignedIn, fetchProperties]);

  const inspectProperty = async (propertyId: string) => {
    setLoadingInspect(true);
    try {
      const token = await getToken();
      const res = await fetch(`${api}/admin/properties/${encodeURIComponent(propertyId)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to load property details.");
      setInspectData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load property details.");
    } finally {
      setLoadingInspect(false);
    }
  };

  const submitModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProperty || !targetStatus) return;
    if (!modReason.trim()) {
      setError("A moderation reason must be recorded for audit accountability.");
      return;
    }

    setSubmittingMod(true);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      const res = await fetch(`${api}/admin/properties/${encodeURIComponent(targetProperty._id)}/status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: targetStatus, reason: modReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Moderation update failed.");

      setNotice(`Listing "${targetProperty.title}" updated to status: ${targetStatus}.`);
      setTargetProperty(null);
      setTargetStatus(null);
      setModReason("");
      await fetchProperties();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error executing moderation.");
    } finally {
      setSubmittingMod(false);
    }
  };

  return (
    <main className="admin-page">
      <AdminNav activeSection="listings" />
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">MARKETPLACE CONTENT</p>
            <h1>Property Moderation</h1>
          </div>
          <div className="admin-top-actions">
            <ThemePicker compact />
            <button className="button button-outline" onClick={() => void fetchProperties()} disabled={loading} style={{ fontSize: 11 }}>
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
              <p className="eyebrow">MODERATION AUDITED</p>
              <h2 style={{ fontSize: 16, margin: 0 }}>{notice}</h2>
            </div>
          </div>
        )}

        <div className="admin-policy-note" style={{ marginBottom: 20 }}>
          <b>Immediate Publishing Policy</b>
          <p>
            Apna Ghar publishes valid listings immediately after server-side validation. Manual moderation actions are
            strictly reserved for flagged, duplicate, fraudulent, or policy-violating properties.
          </p>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head" style={{ flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2>All Marketplace Listings</h2>
              <p>Filter by publication status, city, or search terms</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search title, slug, locality..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
              />
              <input
                type="text"
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "6px 10px", fontSize: 11, width: 120, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
              />
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
                <option value="hidden_by_owner">Hidden</option>
                <option value="removed_by_admin">Removed by Admin</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-muted)", fontSize: 11, padding: "30px 0", textAlign: "center" }}>Loading properties...</p>
          ) : !properties.length ? (
            <div className="admin-table-empty">
              <span>⌕</span>
              <b>No listings match your criteria</b>
              <p>Adjust your search filters or status selection.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Location</th>
                    <th>Type & Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p._id}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {p.imageUrls?.[0] ? (
                            <img
                              src={p.imageUrls[0]}
                              alt=""
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }}
                            />
                          ) : (
                            <div style={{ width: 44, height: 44, background: "var(--color-surface-subtle)", borderRadius: 6, display: "grid", placeItems: "center", fontSize: 16 }}>
                              ⌂
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700 }}>{p.title}</div>
                            <small style={{ color: "var(--color-muted)", fontSize: 9 }}>
                              Owner: {p.ownerId} · {p.viewsCount ?? 0} views
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <div>{p.location?.city || "—"}</div>
                        <small style={{ color: "var(--color-muted)" }}>{p.location?.locality || ""}</small>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <span style={{ textTransform: "capitalize" }}>{p.listingType}</span> · {p.categoryId}
                      </td>
                      <td style={{ padding: "12px", fontSize: 10, fontWeight: 600 }}>
                        ₹{p.priceAmount?.toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <span className={`report-status report-status-${p.status}`}>{p.status.replace(/_/g, " ")}</span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="button button-outline"
                            style={{ padding: "4px 8px", fontSize: 9 }}
                            onClick={() => void inspectProperty(p._id)}
                          >
                            Inspect
                          </button>
                          {p.status !== "active" && (
                            <button
                              type="button"
                              className="button button-outline"
                              style={{ padding: "4px 8px", fontSize: 9, color: "var(--color-green)", borderColor: "var(--color-green)" }}
                              onClick={() => {
                                setTargetProperty(p);
                                setTargetStatus("active");
                                setModReason("");
                              }}
                            >
                              Restore
                            </button>
                          )}
                          {p.status === "active" && (
                            <button
                              type="button"
                              className="button button-outline"
                              style={{ padding: "4px 8px", fontSize: 9, color: "#D97706", borderColor: "#FCD34D" }}
                              onClick={() => {
                                setTargetProperty(p);
                                setTargetStatus("hidden_by_owner");
                                setModReason("");
                              }}
                            >
                              Hide
                            </button>
                          )}
                          {p.status !== "removed_by_admin" && (
                            <button
                              type="button"
                              className="button button-outline"
                              style={{ padding: "4px 8px", fontSize: 9, color: "#DC2626", borderColor: "#FCA5A5" }}
                              onClick={() => {
                                setTargetProperty(p);
                                setTargetStatus("removed_by_admin");
                                setModReason("");
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
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

        {/* Modal: Moderation Status Change */}
        {targetProperty && targetStatus && (
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
              <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>
                {targetStatus === "removed_by_admin"
                  ? "Remove Violating Listing"
                  : targetStatus === "hidden_by_owner"
                  ? "Hide Listing from Public Search"
                  : "Restore Listing to Active Status"}
              </h2>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
                Target listing: <b>{targetProperty.title}</b> ({targetProperty._id})
              </p>

              <form onSubmit={submitModeration}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                  Moderation Reason (Required for Audit Trail):
                  <textarea
                    required
                    placeholder="Enter policy violation, fraud reason, or restoration note..."
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
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
                      setTargetProperty(null);
                      setTargetStatus(null);
                    }}
                    disabled={submittingMod}
                    style={{ fontSize: 11 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={submittingMod}
                    style={{
                      fontSize: 11,
                      background:
                        targetStatus === "removed_by_admin"
                          ? "#DC2626"
                          : targetStatus === "hidden_by_owner"
                          ? "#D97706"
                          : "var(--color-green)",
                      borderColor:
                        targetStatus === "removed_by_admin"
                          ? "#DC2626"
                          : targetStatus === "hidden_by_owner"
                          ? "#D97706"
                          : "var(--color-green)",
                    }}
                  >
                    {submittingMod ? "Recording Action..." : "Confirm Moderation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Property Inspector Drawer */}
        {inspectData && (
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
                maxWidth: 650,
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
                padding: 24,
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{inspectData.property.title}</h2>
                  <small style={{ color: "var(--color-muted)", fontSize: 10 }}>
                    Slug: {inspectData.property.slug} · ID: {inspectData.property._id}
                  </small>
                </div>
                <button
                  type="button"
                  className="button button-outline"
                  style={{ padding: "4px 8px", fontSize: 10 }}
                  onClick={() => setInspectData(null)}
                >
                  ✕ Close
                </button>
              </div>

              {inspectData.property.imageUrls && inspectData.property.imageUrls.length > 0 && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 16 }}>
                  {inspectData.property.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      style={{ height: 110, borderRadius: 6, objectFit: "cover" }}
                    />
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11, marginBottom: 16 }}>
                <div>
                  <strong>Price:</strong> ₹{inspectData.property.priceAmount?.toLocaleString("en-IN")} ({inspectData.property.listingType})
                </div>
                <div>
                  <strong>Category:</strong> {inspectData.property.categoryId}
                </div>
                <div>
                  <strong>Location:</strong> {inspectData.property.location?.city}, {inspectData.property.location?.locality}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className={`report-status report-status-${inspectData.property.status}`}>
                    {inspectData.property.status}
                  </span>
                </div>
                <div>
                  <strong>Area:</strong> {inspectData.property.areaValue} {inspectData.property.areaUnit}
                </div>
                <div>
                  <strong>Rooms:</strong> {inspectData.property.bedrooms ?? 0} BHK · {inspectData.property.bathrooms ?? 0} Baths
                </div>
              </div>

              {inspectData.owner && (
                <div style={{ padding: 12, borderRadius: 8, background: "var(--color-bg)", marginBottom: 16, fontSize: 11 }}>
                  <strong>Owner Record:</strong>
                  <div style={{ marginTop: 4 }}>
                    {inspectData.owner.name || "Anonymous"} ({inspectData.owner.email || "No email"}) · ID: {inspectData.owner.clerkUserId}
                  </div>
                </div>
              )}

              {inspectData.property.description && (
                <div style={{ fontSize: 11, marginBottom: 16 }}>
                  <strong>Description:</strong>
                  <p style={{ margin: "4px 0", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                    {inspectData.property.description}
                  </p>
                </div>
              )}

              <h4 style={{ fontSize: 13, margin: "16px 0 8px" }}>Safety Reports Filed Against This Property ({inspectData.reports?.length ?? 0})</h4>
              {!inspectData.reports?.length ? (
                <p style={{ fontSize: 11, color: "var(--color-muted)" }}>No reports on file for this listing.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {inspectData.reports.map((r) => (
                    <div key={r._id} style={{ padding: 10, borderRadius: 6, border: "1px solid var(--color-border)", fontSize: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <b>Reason: {r.reason}</b>
                        <span className={`report-status report-status-${r.status}`}>{r.status}</span>
                      </div>
                      {r.details && <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)" }}>{r.details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
