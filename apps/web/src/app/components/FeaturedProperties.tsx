"use client";

import { useEffect, useRef, useState } from "react";

type Property = {
  _id: string; slug?: string; title: string; description?: string;
  listingType: "sale" | "rent"; priceAmount: number; areaValue: number; areaUnit: string;
  bedrooms?: number; bathrooms?: number; imageUrls?: string[];
  location?: { city?: string; state?: string; locality?: string };
};
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
const photoFallbacks = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1100&q=85",
];
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function FeaturedProperties() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const card = viewport.querySelector<HTMLElement>(".property-card");
    viewport.scrollBy({ left: direction * ((card?.getBoundingClientRect().width || 320) + 20), behavior: "smooth" });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiBase + "/properties?page=1&limit=9&sort=newest", { signal: controller.signal, headers: { Accept: "application/json" } })
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

  return <div className="property-carousel" aria-label="Featured properties">
    {!loading && items.length > 0 && <div className="property-carousel-controls">
      <span className="property-carousel-count">Showing {items.length} {items.length === 1 ? "property" : "properties"}</span>
      <div className="property-carousel-arrows">
        <button type="button" onClick={() => move(-1)} aria-label="Previous properties">←</button>
        <button type="button" onClick={() => move(1)} aria-label="Next properties">→</button>
      </div>
    </div>}
    <div className="property-carousel-viewport" ref={viewportRef} aria-live="polite">
      <div className="property-carousel-track">
        {loading && Array.from({ length: 3 }, (_, i) => <article className="property-card skeleton-card" key={i} aria-hidden="true"><div className="skeleton skeleton-image" /><div className="property-info"><div className="skeleton skeleton-copy" /><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-price" /></div></article>)}
        {!loading && items.map((home, index) => {
          const photo = home.imageUrls?.find((url) => typeof url === "string" && url.trim()) || photoFallbacks[index % photoFallbacks.length];
          const href = "/property/" + encodeURIComponent(home.slug || home._id);
          return <article className="property-card" key={home._id}>
            <a href={href} className="property-art" aria-label={"View " + home.title} style={{ backgroundImage: 'linear-gradient(180deg,rgba(8,15,25,.02) 30%,rgba(8,15,25,.48)),url("' + photo + '")' }}>
              <span className="property-tag">{home.listingType === "rent" ? "For rent" : "For sale"}</span>
              <span className="property-photo-count">{home.imageUrls?.length || 1} photo{(home.imageUrls?.length || 1) === 1 ? "" : "s"}</span>
            </a>
            <div className="property-info"><p className="property-kind">{home.listingType === "rent" ? "For rent" : "For sale"}</p><h3><a href={href}>{home.title}</a></h3><p className="property-location">⌖ {[home.location?.locality, home.location?.city, home.location?.state].filter(Boolean).join(", ") || "Location not provided"}</p><p className="property-meta">{[home.bedrooms ? home.bedrooms + " beds" : "", home.bathrooms ? home.bathrooms + " baths" : "", home.areaValue ? home.areaValue + " " + home.areaUnit : ""].filter(Boolean).join(" · ") || "Details available on listing"}</p><div className="property-bottom"><strong>{money(home.priceAmount)}{home.listingType === "rent" ? " / month" : ""}</strong><a className="round-arrow" href={href} aria-label={"View details for " + home.title}>↗</a></div></div>
          </article>;
        })}
      </div>
    </div>
    {!loading && items.length === 0 && <div className="search-empty featured-empty"><div className="empty-illustration"><span>⌂</span></div><h3>{failed ? "Live listings are temporarily unavailable" : "Your next home will appear here"}</h3><p>{failed ? "We couldn't reach the property service. Browse search to retry when it's available." : "There are no published properties yet. We won't show fictional listings as real inventory."}</p><a className="button button-primary" href="/search">{failed ? "Open property search" : "Explore properties"} ↗</a></div>}
  </div>;
}
