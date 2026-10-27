"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

type Listing = {
  _id: string;
  slug?: string;
  title: string;
  listingType: "sale" | "rent";
  priceAmount: number;
  status?: string;
  areaValue: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  imageUrls?: string[];
  location?: { locality?: string; city?: string; state?: string };
  publishedAt?: string;
};

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

function ListingCard({ listing, getToken, onChanged }: { listing: Listing; getToken: () => Promise<string | null>; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function mutate(action: "visibility" | "delete") {
    const message = action === "delete"
      ? "Delete this listing? It will no longer appear in your workspace."
      : listing.status === "active" ? "Hide this listing from public search?" : "Publish this listing immediately?";
    if (!window.confirm(message)) return;
    setBusy(true);
    setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Sign in again.");
      const response = await fetch(`${apiBase}/properties/${encodeURIComponent(listing._id)}${action === "visibility" ? "/visibility" : ""}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(action === "visibility" ? { "Content-Type": "application/json" } : {}) },
        body: action === "visibility" ? JSON.stringify({ visible: listing.status !== "active" }) : undefined,
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : response.status === 404 ? "Listing not found." : "Could not update this listing. Please retry.");
      setNotice(action === "delete" ? "Listing deleted." : listing.status === "active" ? "Listing hidden." : "Listing published.");
      onChanged();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  return <article className="owner-listing-card">
    <div className="owner-listing-image">{listing.imageUrls?.[0] ? <img src={listing.imageUrls[0]} alt="" loading="lazy" /> : <span aria-hidden="true">⌂</span>}</div>
    <div className="owner-listing-details">
      <div className="owner-listing-meta"><span className={`owner-status owner-status-${listing.status || "active"}`}>{(listing.status || "active").replaceAll("_", " ")}</span><span>{listing.listingType === "rent" ? "For rent" : "For sale"}</span></div>
      <h3>{listing.title}</h3>
      <p>{[listing.location?.locality, listing.location?.city, listing.location?.state].filter(Boolean).join(", ") || "Location not provided"}</p>
      <strong>{money(listing.priceAmount)}{listing.listingType === "rent" ? " / month" : ""}</strong>
      <p className="owner-listing-facts">{listing.bedrooms ? `${listing.bedrooms} beds · ` : ""}{listing.bathrooms ? `${listing.bathrooms} baths · ` : ""}{listing.areaValue} {listing.areaUnit}</p>
      <div className="owner-listing-actions">
        <a className="button button-outline" href={`/property/${encodeURIComponent(listing.slug || listing._id)}`}>View listing</a>
        <button className="button button-outline" type="button" disabled={busy} onClick={() => void mutate("visibility")}>{busy ? "Please wait…" : listing.status === "active" ? "Hide listing" : "Publish listing"}</button>
        <button className="button button-outline owner-delete-action" type="button" disabled={busy} onClick={() => void mutate("delete")}>Delete</button>
      </div>
      {notice && <p className="form-help" role="status">{notice}</p>}
    </div>
  </article>;
}

function ConnectedListings() {
  const { getToken } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session is not ready. Sign in again.");
      const response = await fetch(`${apiBase}/properties/mine`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : "Could not load your listings. Please retry.");
      const data = await response.json() as Listing[];
      setListings(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Could not load your listings.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const active = listings.filter((item) => item.status === "active").length;
  const hidden = listings.filter((item) => item.status !== "active").length;

  return <section className="owner-dashboard-panel">
    <div className="owner-dashboard-heading"><div><p className="eyebrow">PROPERTY MANAGEMENT</p><h2>My listings</h2></div><a className="button button-primary" href="/list-property">Post a property <span aria-hidden="true">↗</span></a></div>
    <div className="owner-listing-stats"><div><span>Total listings</span><strong>{loading ? "—" : listings.length}</strong></div><div><span>Published</span><strong>{loading ? "—" : active}</strong></div><div><span>Hidden / other</span><strong>{loading ? "—" : hidden}</strong></div></div>
    {loading && <div className="search-empty" role="status"><h3>Loading your properties…</h3><p>Fetching your listings securely.</p></div>}
    {!loading && error && <div className="search-empty" role="alert"><h3>Could not load listings</h3><p>{error}</p><button className="button button-outline" type="button" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button><a className="text-link" href="/sign-in">Sign in</a></div>}
    {!loading && !error && listings.length === 0 && <div className="owner-empty-state"><div className="owner-empty-icon" aria-hidden="true">⌂</div><h3>Your first listing starts here</h3><p>Share property details and photos. Once the server validates your listing, it can publish immediately.</p><div className="owner-empty-actions"><a className="button button-primary" href="/list-property">Post a property</a><a className="button button-outline" href="/search">Explore homes</a></div></div>}
    {!loading && !error && listings.length > 0 && <div className="owner-listings-list">{listings.map((listing) => <ListingCard key={listing._id} listing={listing} getToken={getToken} onChanged={() => setRefreshKey((key) => key + 1)} />)}</div>}
    <p className="form-help">Listing changes are sent to the protected API. Only the listing owner can manage these records.</p>
  </section>;
}

function SignInRequired() {
  return <section className="owner-dashboard-panel"><div className="owner-empty-state"><div className="owner-empty-icon" aria-hidden="true">⌂</div><h3>Sign in to manage your listings</h3><p>Your owner workspace uses your authenticated account and protected API. Local browser drafts are not published listings.</p><div className="owner-empty-actions"><a className="button button-primary" href="/sign-in">Continue to sign in</a><a className="button button-outline" href="/list-property">Start a listing</a></div></div></section>;
}

export default function MyListingsPage() {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return <main className="page-shell interior-page">
    <header className="site-header interior-header">
      <a className="brand" href="/" aria-label="Apna Ghar home"><span className="brand-placeholder">INSERT APPROVED APNA GHAR LOGO ASSET</span><span className="brand-name">Apna <b>Ghar</b></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="/search">Explore homes</a><a href="/saved">Saved homes</a><a href="/list-property">List property</a></nav>
      <div className="header-actions"><a className="button button-outline" href="/profile">Profile</a></div>
    </header>
    <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>My listings</span></div>
    <section className="listing-intro"><p className="eyebrow">OWNER WORKSPACE</p><h1>Your properties,<br /><em>all in one place.</em></h1><p>Manage the homes and spaces you advertise on Apna Ghar.</p></section>
    {clerkConfigured ? <ConnectedListings /> : <SignInRequired />}
    <footer className="simple-footer">Apna Ghar · Owner workspace</footer>
  </main>;
}
