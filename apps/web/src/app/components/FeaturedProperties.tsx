"use client";

import { useEffect, useState } from "react";

type Property = {
  _id: string; slug?: string; title: string; description?: string;
  listingType: "sale" | "rent"; priceAmount: number; areaValue: number; areaUnit: string;
  bedrooms?: number; bathrooms?: number; imageUrls?: string[];
  location?: { city?: string; state?: string; locality?: string };
};
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const photoFallbacks = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
];
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function FeaturedProperties() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/properties?page=1&limit=3&sort=newest`, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load properties");
        const data = await response.json() as { items?: Property[] };
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") setFailed(true);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <div className="property-grid" aria-live="polite">
    {loading && Array.from({ length: 3 }, (_, i) => <article className="property-card skeleton-card" key={i} aria-hidden="true"><div className="skeleton skeleton-image" /><div className="property-info"><div className="skeleton skeleton-copy" /><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-price" /></div></article>)}
    {!loading && items.map((home, index) => <article className="property-card" key={home._id}>
      <a href={`/property/${encodeURIComponent(home.slug || home._id)}`} className="property-art" aria-label={`View ${home.title}`} style={{ backgroundImage: `linear-gradient(180deg,transparent 40%,rgba(8,15,25,.45)),url("${home.imageUrls?.[0] || photoFallbacks[index % photoFallbacks.length]}")` }}>
        <span className="property-tag">{home.listingType === "rent" ? "For rent" : "For sale"}</span>
      </a>
      <div className="property-info"><p className="property-kind">{home.listingType === "rent" ? "For rent" : "For sale"}</p><h3><a href={`/property/${encodeURIComponent(home.slug || home._id)}`}>{home.title}</a></h3><p className="property-location">⌖ {[home.location?.locality, home.location?.city, home.location?.state].filter(Boolean).join(", ") || "Location not provided"}</p><p className="property-meta">{[home.bedrooms ? `${home.bedrooms} beds` : "", home.bathrooms ? `${home.bathrooms} baths` : "", `${home.areaValue} ${home.areaUnit}`].filter(Boolean).join(" · ")}</p><div className="property-bottom"><strong>{money(home.priceAmount)}{home.listingType === "rent" ? " / month" : ""}</strong><a className="round-arrow" href={`/property/${encodeURIComponent(home.slug || home._id)}`} aria-label={`View details for ${home.title}`}>↗</a></div></div>
    </article>)}
    {!loading && items.length === 0 && <div className="search-empty featured-empty"><div className="empty-illustration"><span>⌂</span></div><h3>{failed ? "Live listings are temporarily unavailable" : "Your next home will appear here"}</h3><p>{failed ? "We couldn't reach the property service. Browse search to retry when it's available." : "There are no published properties yet. We won't show fictional listings as real inventory."}</p><a className="button button-primary" href="/search">{failed ? "Open property search" : "Explore properties"} ↗</a></div>}
  </div>;
}
