"use client";

import { useEffect, useState } from "react";

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

export default function PropertySearchResults({ location, transaction, category }: { location?: string; transaction: string; category?: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const refreshSaved = () => {
      try {
        setSavedIds((JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[]).map((item) => item._id));
      } catch {
        setSavedIds([]);
      }
    };
    refreshSaved();
    window.addEventListener("apna-ghar-saved-change", refreshSaved);
    window.addEventListener("storage", refreshSaved);
    return () => {
      window.removeEventListener("apna-ghar-saved-change", refreshSaved);
      window.removeEventListener("storage", refreshSaved);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: "1", limit: "12", sort: "newest" });
      if (location) params.set("city", location);
      if (transaction === "rent" || transaction === "sale") params.set("listingType", transaction);
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
  }, [location, transaction, category]);

  if (loading) return <div className="search-empty" role="status"><h2>Finding properties…</h2><p>Loading live listings from Apna Ghar.</p></div>;
  if (error) return <div className="search-empty" role="alert"><h2>Listings temporarily unavailable</h2><p>{error}</p><button className="button button-outline" onClick={() => window.location.reload()} type="button">Retry</button></div>;
  if (!result?.items.length) return <div className="search-empty"><div className="empty-illustration"><span>⌂</span><span>⌕</span></div><h2>No matching properties yet</h2><p>There are no published listings matching these filters. Try another city or list your property to get started.</p><a className="button button-primary" href="/list-property">List a property</a><a className="text-link" href="/">Back to home</a></div>;

  return <section aria-live="polite">
    <div className="results-toolbar"><div><h2>Available properties</h2><p>{result.pagination.total} listing{result.pagination.total === 1 ? "" : "s"} · live marketplace data</p></div><a className="text-link" href="/saved">Saved homes ({savedIds.length})</a></div>
    <div className="property-results-grid">
      {result.items.map((property) => {
        const isSaved = savedIds.includes(property._id);
        return <article className="property-result-card" key={property._id}>
          <a className="property-result-link" href={`/property/${encodeURIComponent(property.slug || property._id)}`}>
            <div className="property-result-image">{property.imageUrls?.[0] ? <img src={property.imageUrls[0]} alt="" loading="lazy" /> : <span aria-hidden="true">⌂</span>}<span className="property-result-badge">{property.listingType === "rent" ? "FOR RENT" : "FOR SALE"}</span></div>
            <div className="property-result-body"><p className="property-result-location">{[property.location?.locality, property.location?.city, property.location?.state].filter(Boolean).join(", ")}</p><h3>{property.title}</h3><p className="property-result-price">{money(property.priceAmount)}{property.listingType === "rent" ? " / month" : ""}</p><p className="property-result-facts">{property.bedrooms ? `${property.bedrooms} beds · ` : ""}{property.bathrooms ? `${property.bathrooms} baths · ` : ""}{property.areaValue} {property.areaUnit}</p></div>
          </a>
          <button className="button button-outline property-save-button" type="button" aria-pressed={isSaved} onClick={() => { toggleSavedProperty(property); setSavedIds((ids) => isSaved ? ids.filter((id) => id !== property._id) : [property._id, ...ids]); }}>{isSaved ? "♥ Saved" : "♡ Save home"}</button>
        </article>;
      })}
    </div>
  </section>;
}
