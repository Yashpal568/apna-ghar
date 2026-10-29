"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type Property = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  listingType: "sale" | "rent";
  priceAmount: number;
  currency?: string;
  categoryId: string;
  location: { city: string; state: string; locality?: string };
  areaValue: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  imageUrls?: string[];
  contactPhone?: string;
};

type Result = { items: Property[]; pagination: { page: number; limit: number; total: number; pages: number } };
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

function toggleSavedProperty(property: Property): boolean {
  try {
    const existing = JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[];
    const isSaved = existing.some((item) => item._id === property._id);
    const next = isSaved ? existing.filter((item) => item._id !== property._id) : [property, ...existing];
    localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(next));
    window.dispatchEvent(new Event("apna-ghar-saved-change"));
    return !isSaved;
  } catch {
    return false;
  }
}

export default function PropertySearchResults({ location, transaction, category, minPrice, maxPrice, minBedrooms, minBathrooms, furnishing, initialSort }: { location?: string; transaction: string; category?: string; minPrice?: string; maxPrice?: string; minBedrooms?: string; minBathrooms?: string; furnishing?: string; initialSort?: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">(initialSort === "price_asc" || initialSort === "price_desc" ? initialSort : "newest");
  const [savedNotice, setSavedNotice] = useState("");
  const { isSignedIn, getToken } = useAuth();

  async function contactOwner(property: Property) {
    if (!isSignedIn) {
      window.location.assign("/sign-in?redirect_url=" + encodeURIComponent("/property/" + (property.slug || property._id)));
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again to contact the owner.");
      const response = await fetch(apiBase + "/conversations/property/" + encodeURIComponent(property._id), {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not open this conversation.");
      window.location.assign("/messages?conversation=" + encodeURIComponent(body.conversationId));
    } catch (error) {
      setSavedNotice(error instanceof Error ? error.message : "Could not contact this owner.");
    }
  }

  async function changeSaved(property: Property, isSaved: boolean) {
    const nextSaved = !isSaved;
    const changed = toggleSavedProperty(property);
    if (changed !== nextSaved) {
      setSavedNotice("Could not update saved homes on this device.");
      return;
    }
    setSavedIds((ids) => nextSaved ? [property._id, ...ids.filter((id) => id !== property._id)] : ids.filter((id) => id !== property._id));
    setSavedNotice("");
    if (!isSignedIn) {
      setSavedNotice("Saved on this device. Sign in to sync across devices.");
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session is not ready. Sign in again.");
      const response = await fetch(`${apiBase}/saved-properties/${encodeURIComponent(property._id)}`, {
        method: nextSaved ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : "Account sync failed. This change is saved on this device for now.");
      setSavedNotice(nextSaved ? "Saved to your account." : "Removed from your account.");
    } catch (error) {
      setSavedNotice(error instanceof Error ? error.message : "Account sync failed. This change remains on this device.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    const refreshSaved = () => {
      try {
        setSavedIds((JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[]).map((item) => item._id));
      } catch {
        setSavedIds([]);
      }
    };
    refreshSaved();
    if (isSignedIn) {
      void (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const response = await fetch(apiBase + "/saved-properties", { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
          if (!response.ok) return;
          const serverHomes = await response.json() as Property[];
          if (cancelled || !Array.isArray(serverHomes)) return;
          const localHomes = (() => {
            try { return JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[]; }
            catch { return []; }
          })();
          const merged = [...serverHomes, ...localHomes.filter((home) => !serverHomes.some((serverHome) => serverHome._id === home._id))];
          setSavedIds(merged.map((item) => item._id));
          localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(merged));
        } catch {
          // Local saved state remains available when account sync is offline.
        }
      })();
    }
    window.addEventListener("apna-ghar-saved-change", refreshSaved);
    window.addEventListener("storage", refreshSaved);
    return () => {
      cancelled = true;
      window.removeEventListener("apna-ghar-saved-change", refreshSaved);
      window.removeEventListener("storage", refreshSaved);
    };
  }, [getToken, isSignedIn]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: "12", sort });
      if (location) params.set("q", location);
      if (minPrice && Number(minPrice) >= 0) params.set("minPrice", minPrice);
      if (maxPrice && Number(maxPrice) >= 0) params.set("maxPrice", maxPrice);
      if (minBedrooms && Number(minBedrooms) >= 0) params.set("minBedrooms", minBedrooms);
      if (minBathrooms && Number(minBathrooms) >= 0) params.set("minBathrooms", minBathrooms);
      if (furnishing) params.set("furnishing", furnishing);
      if (transaction === "rent" || transaction === "sale" || transaction === "buy") params.set("listingType", transaction === "buy" ? "sale" : transaction);
      if (category && category !== "all property types") params.set("categoryId", category);
      try {
        const response = await fetch(`${apiBase}/properties?${params.toString()}`, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Property search failed (${response.status}).`);
        setResult(await response.json() as Result);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError("We couldn't connect to live listings. Check that the API is running and try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [location, transaction, category, minPrice, maxPrice, minBedrooms, minBathrooms, furnishing, page, sort]);

  if (loading) return <section className="results-loading" role="status" aria-label="Loading properties"><div className="results-toolbar"><div><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-copy" /></div><div className="skeleton skeleton-action" /></div><div className="property-results-grid">{Array.from({ length: 6 }, (_, index) => <article className="property-result-card skeleton-card" key={index} aria-hidden="true"><div className="skeleton skeleton-image" /><div className="property-result-body"><div className="skeleton skeleton-copy" /><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-price" /><div className="skeleton skeleton-copy skeleton-short" /></div><div className="skeleton skeleton-action skeleton-save" /></article>)}</div><span className="sr-only">Finding properties…</span></section>;
  if (error) return <div className="search-empty" role="alert"><h2>Listings temporarily unavailable</h2><p>{error}</p><button className="button button-outline" onClick={() => window.location.reload()} type="button">Retry</button></div>;
  if (!result?.items.length) return <div className="search-empty"><div className="empty-illustration"><span>⌂</span><span>⌕</span></div><h2>No matching properties yet</h2><p>There are no published listings matching these filters. Try another city or list your property to get started.</p><a className="button button-primary" href="/list-property">List a property</a><a className="text-link" href="/">Back to home</a></div>;

  return <section aria-live="polite">
    <div className="results-toolbar"><div><h2>Available properties</h2><p>{result.pagination.total} listing{result.pagination.total === 1 ? "" : "s"} · live marketplace data</p></div><div className="results-toolbar-actions"><label className="sort-control">Sort by <select aria-label="Sort properties" value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label><a className="text-link" href="/saved">Saved homes ({savedIds.length})</a></div></div>
    <div className="property-results-grid">
      {result.items.map((property) => {
        const isSaved = savedIds.includes(property._id);
        return <article className="property-result-card" key={property._id}>
          <a className="property-result-link" href={`/property/${encodeURIComponent(property.slug || property._id)}`}>
            <div className="property-result-image">{property.imageUrls?.[0] ? <img src={property.imageUrls[0]} alt="" loading="lazy" /> : <span aria-hidden="true">⌂</span>}<span className="property-result-badge">{property.listingType === "rent" ? "FOR RENT" : "FOR SALE"}</span></div>
            <div className="property-result-body"><p className="property-result-location">{[property.location?.locality, property.location?.city, property.location?.state].filter(Boolean).join(", ")}</p><h3>{property.title}</h3><p className="property-result-price">{money(property.priceAmount)}{property.listingType === "rent" ? " / month" : ""}</p><p className="property-result-facts">{property.bedrooms ? `${property.bedrooms} beds · ` : ""}{property.bathrooms ? `${property.bathrooms} baths · ` : ""}{property.areaValue} {property.areaUnit}</p></div>
          </a>
          <div className="property-card-actions">
            <button className="button button-outline property-save-button" type="button" aria-pressed={isSaved} onClick={() => { void changeSaved(property, isSaved); }}>{isSaved ? "♥ Saved" : "♡ Save home"}</button>
            {property.contactPhone?.trim() ? <a className="button button-outline" href={"tel:" + property.contactPhone.replace(/[^+0-9]/g, "")}>☎ Call owner</a> : null}
            <button className="button button-primary" type="button" onClick={() => void contactOwner(property)}>Chat owner</button>
          </div>
        </article>;
      })}
    </div>
    {result.pagination.pages > 1 && <nav className="results-pagination" aria-label="Property result pages">
      <button className="button button-outline" type="button" disabled={page <= 1} onClick={() => { setPage((current) => Math.max(1, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Previous</button>
      <span aria-live="polite">Page <strong>{result.pagination.page}</strong> of <strong>{result.pagination.pages}</strong></span>
      <button className="button button-outline" type="button" disabled={page >= result.pagination.pages} onClick={() => { setPage((current) => Math.min(result.pagination.pages, current + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next →</button>
    </nav>}
  </section>;
}
