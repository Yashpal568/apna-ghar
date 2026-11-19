"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "../components/AdminShell";
import { AdminPropertyRecord, fetchAdminApi } from "../lib/adminApi";

type PropertyDetailResponse = {
  property: AdminPropertyRecord & {
    description?: string;
    areaValue?: number;
    areaUnit?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
  owner?: {
    clerkUserId: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    accountStatus?: string;
  };
  reports?: Array<{
    _id: string;
    reason: string;
    details?: string;
    status: string;
    createdAt?: string;
  }>;
};

export default function AdminListingsPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [properties, setProperties] = useState<AdminPropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Moderation action modal
  const [targetProperty, setTargetProperty] = useState<AdminPropertyRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<"active" | "hidden_by_owner" | "removed_by_admin" | null>(null);
  const [modReason, setModReason] = useState("");
  const [submittingMod, setSubmittingMod] = useState(false);

  // Details drawer
  const [inspectData, setInspectData] = useState<PropertyDetailResponse | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const fetchProperties = useCallback(async () => {
    if (!isSignedIn) return;
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

      const data = await fetchAdminApi<{
        items: AdminPropertyRecord[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/properties?${params.toString()}`, token);

      setProperties(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }, [cityFilter, getToken, isSignedIn, page, search, statusFilter]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchProperties();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchProperties]);

  const inspectProperty = async (propertyId: string) => {
    setLoadingInspect(true);
    try {
      const token = await getToken();
      const data = await fetchAdminApi<PropertyDetailResponse>(
        `/properties/${encodeURIComponent(propertyId)}`,
        token
      );
      setInspectData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load property details.");
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleModerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProperty || !targetStatus || !modReason.trim()) return;

    setSubmittingMod(true);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      await fetchAdminApi(`/properties/${encodeURIComponent(targetProperty._id)}/status`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          reason: modReason.trim(),
        }),
      });

      setNotice(`Listing "${targetProperty.title}" successfully set to "${targetStatus}".`);
      setTargetProperty(null);
      setTargetStatus(null);
      setModReason("");
      if (inspectData?.property._id === targetProperty._id) {
        setInspectData(null);
      }
      await fetchProperties();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Moderation action failed.");
    } finally {
      setSubmittingMod(false);
    }
  };

  const formatPrice = (val?: number) => {
    if (typeof val !== "number" || isNaN(val)) return "₹0";
    if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(2)} Cr`;
    if (val >= 100_000) return `₹${(val / 100_000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <AdminShell
      activeSection="listings"
      title="Property Inventory Moderation"
      description={`Manage live properties, inspect owner details, and enforce zero-brokerage quality standards (${totalCount} properties on file).`}
      actions={
        <div className="shadcn-admin-action-row">
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void fetchProperties()}
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <Link href="/list-property" className="shadcn-admin-btn is-primary">
            + Add Property
          </Link>
        </div>
      }
    >
      {/* Notifications */}
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

      {/* FILTER CONTROLS BAR (SHADCN STUDIO TOOLBAR) */}
      <div className="shadcn-admin-filter-bar">
        <div className="shadcn-admin-search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className="shadcn-admin-search-input"
            placeholder="Search by title, locality, slug or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void fetchProperties()}
          />
          {search && (
            <button type="button" className="shadcn-admin-input-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        <div className="shadcn-admin-filter-selects">
          <select
            className="shadcn-admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active (Live)</option>
            <option value="hidden_by_owner">Hidden by Owner</option>
            <option value="removed_by_admin">Removed by Admin</option>
          </select>

          <input
            type="text"
            className="shadcn-admin-input"
            placeholder="Filter city (e.g. Amritsar)…"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void fetchProperties()}
            style={{ width: 170 }}
          />

          <button
            type="button"
            className="shadcn-admin-btn is-secondary"
            onClick={() => void fetchProperties()}
          >
            Apply Filters
          </button>

          {(search || statusFilter || cityFilter) && (
            <button
              type="button"
              className="shadcn-admin-btn is-ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setCityFilter("");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* PROPERTIES TABLE */}
      <div className="shadcn-admin-card">
        <div className="shadcn-admin-table-wrap">
          <table className="shadcn-admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Location</th>
                <th>Price</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    Loading property inventory from MongoDB…
                  </td>
                </tr>
              ) : !properties.length ? (
                <tr>
                  <td colSpan={6} className="shadcn-admin-table-empty">
                    No properties match your current search filters.
                  </td>
                </tr>
              ) : (
                properties.map((prop) => (
                  <tr key={prop._id}>
                    <td>
                      <div className="shadcn-admin-property-cell">
                        <div className="shadcn-admin-thumb">
                          {prop.imageUrls?.[0] ? (
                            <img src={prop.imageUrls[0]} alt="" />
                          ) : (
                            <span className="shadcn-admin-thumb-fallback">⌂</span>
                          )}
                        </div>
                        <div className="shadcn-admin-property-info">
                          <Link href={`/property/${prop.slug}`} target="_blank" className="shadcn-admin-cell-title">
                            {prop.title}
                          </Link>
                          <span className="shadcn-admin-cell-sub">
                            Slug: {prop.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="shadcn-admin-cell-text">
                        {prop.location?.locality ? `${prop.location.locality}, ` : ""}
                        <strong>{prop.location?.city || "Unspecified"}</strong>
                      </span>
                    </td>
                    <td>
                      <strong className="shadcn-admin-price-pill">
                        {formatPrice(prop.priceAmount)}
                      </strong>
                    </td>
                    <td>
                      <span className="shadcn-admin-type-pill">
                        {prop.listingType === "rent" ? "Rent" : "Sale"}
                      </span>
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
                    <td>
                      <div className="shadcn-admin-table-actions">
                        <button
                          type="button"
                          className="shadcn-admin-btn is-xs is-outline"
                          onClick={() => void inspectProperty(prop._id)}
                        >
                          Inspect
                        </button>
                        {prop.status !== "active" ? (
                          <button
                            type="button"
                            className="shadcn-admin-btn is-xs is-emerald"
                            onClick={() => {
                              setTargetProperty(prop);
                              setTargetStatus("active");
                              setModReason("Verified listing meets quality standards.");
                            }}
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="shadcn-admin-btn is-xs is-danger"
                            onClick={() => {
                              setTargetProperty(prop);
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
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

      {/* MODERATION CONFIRMATION MODAL */}
      {targetProperty && targetStatus && (
        <div className="shadcn-admin-modal-backdrop">
          <div className="shadcn-admin-modal-dialog">
            <div className="shadcn-admin-modal-head">
              <h3>Confirm Moderation Action</h3>
              <button type="button" onClick={() => setTargetProperty(null)} className="shadcn-admin-modal-close">×</button>
            </div>
            <form onSubmit={handleModerateSubmit} className="shadcn-admin-modal-body">
              <p>
                You are setting listing <strong>&quot;{targetProperty.title}&quot;</strong> to{" "}
                <span className={`shadcn-admin-status-pill is-${targetStatus}`}>{targetStatus}</span>.
              </p>
              <div className="shadcn-admin-field">
                <label htmlFor="mod-reason">Reason for audit log (Required):</label>
                <textarea
                  id="mod-reason"
                  rows={3}
                  className="shadcn-admin-textarea"
                  placeholder="Enter reason for this moderation intervention…"
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  required
                />
              </div>
              <div className="shadcn-admin-modal-actions">
                <button
                  type="button"
                  className="shadcn-admin-btn is-ghost"
                  onClick={() => setTargetProperty(null)}
                  disabled={submittingMod}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`shadcn-admin-btn ${targetStatus === "active" ? "is-primary" : "is-destructive"}`}
                  disabled={submittingMod || !modReason.trim()}
                >
                  {submittingMod ? "Updating…" : `Confirm ${targetStatus === "active" ? "Approval" : "Removal"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT PROPERTY DRAWER */}
      {inspectData && (
        <div className="shadcn-admin-drawer-backdrop" onClick={() => setInspectData(null)}>
          <div className="shadcn-admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="shadcn-admin-drawer-head">
              <div>
                <span className="shadcn-admin-drawer-eyebrow">PROPERTY INSPECTOR</span>
                <h3 className="shadcn-admin-drawer-title">{inspectData.property.title}</h3>
              </div>
              <button type="button" onClick={() => setInspectData(null)} className="shadcn-admin-drawer-close">×</button>
            </div>

            <div className="shadcn-admin-drawer-body">
              {/* Photo gallery preview */}
              {inspectData.property.imageUrls && inspectData.property.imageUrls.length > 0 && (
                <div className="shadcn-admin-drawer-photos">
                  {inspectData.property.imageUrls.map((url, i) => (
                    <img key={i} src={url} alt="" className="shadcn-admin-drawer-photo" />
                  ))}
                </div>
              )}

              {/* Price & specs */}
              <div className="shadcn-admin-specs-row">
                <div className="shadcn-admin-spec-item">
                  <small>Price</small>
                  <strong>{formatPrice(inspectData.property.priceAmount)}</strong>
                </div>
                <div className="shadcn-admin-spec-item">
                  <small>Type</small>
                  <strong>{inspectData.property.listingType === "rent" ? "For Rent" : "For Sale"}</strong>
                </div>
                <div className="shadcn-admin-spec-item">
                  <small>Bedrooms</small>
                  <strong>{inspectData.property.bedrooms ?? "N/A"}</strong>
                </div>
                <div className="shadcn-admin-spec-item">
                  <small>Bathrooms</small>
                  <strong>{inspectData.property.bathrooms ?? "N/A"}</strong>
                </div>
              </div>

              {/* Owner Identity */}
              <div className="shadcn-admin-section-box">
                <h4>Verified Owner Identity</h4>
                {inspectData.owner ? (
                  <div className="shadcn-admin-owner-info">
                    <p><strong>Name:</strong> {inspectData.owner.name || "N/A"}</p>
                    <p><strong>Email:</strong> {inspectData.owner.email || "N/A"}</p>
                    <p><strong>Phone:</strong> {inspectData.owner.phone || "N/A"}</p>
                    <p><strong>Clerk ID:</strong> <code>{inspectData.owner.clerkUserId}</code></p>
                  </div>
                ) : (
                  <p className="shadcn-admin-empty-sub">Owner account information unavailable.</p>
                )}
              </div>

              {/* Description */}
              <div className="shadcn-admin-section-box">
                <h4>Listing Description</h4>
                <p className="shadcn-admin-desc-text">
                  {inspectData.property.description || "No description provided."}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="shadcn-admin-drawer-actions">
                <Link
                  href={`/property/${inspectData.property.slug}`}
                  target="_blank"
                  className="shadcn-admin-btn is-outline"
                >
                  View Live on Site ↗
                </Link>
                {inspectData.property.status === "active" ? (
                  <button
                    type="button"
                    className="shadcn-admin-btn is-danger"
                    onClick={() => {
                      setTargetProperty(inspectData.property);
                      setTargetStatus("removed_by_admin");
                      setModReason("");
                    }}
                  >
                    Remove from Site
                  </button>
                ) : (
                  <button
                    type="button"
                    className="shadcn-admin-btn is-primary"
                    onClick={() => {
                      setTargetProperty(inspectData.property);
                      setTargetStatus("active");
                      setModReason("Verified listing meets standards.");
                    }}
                  >
                    Restore to Active
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
