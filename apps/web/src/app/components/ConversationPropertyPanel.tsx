"use client";

import { useEffect, useState } from "react";

type PropertySummary = {
  title?: string;
  slug?: string;
  priceAmount?: number;
  imageUrls?: string[];
  location?: { locality?: string; city?: string; state?: string };
  listingType?: string;
  categoryId?: string;
  contactName?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingCount?: number;
  status?: string;
  areaValue?: number;
  areaUnit?: string;
};
const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
function unwrap(value: unknown, depth = 0): PropertySummary | null {
  if (!value || typeof value !== "object" || depth > 4) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.title === "string") return item as PropertySummary;
  for (const key of ["data", "result", "property", "item"]) {
    if (item[key]) { const found = unwrap(item[key], depth + 1); if (found) return found; }
  }
  return null;
}
const money = (value?: number) => typeof value === "number" && Number.isFinite(value)
  ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
  : "Price unavailable";

export default function ConversationPropertyPanel({ propertyId, propertySlug, fallbackTitle }: { propertyId: string; propertySlug?: string; fallbackTitle: string }) {
  const [property, setProperty] = useState<PropertySummary | null>(null);
  useEffect(() => {
    setProperty(null);
    if (!propertyId) return;
    const controller = new AbortController();
    void fetch(API + "/properties/" + encodeURIComponent(propertyId), { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } })
      .then(async response => { if (!response.ok) throw new Error("Property unavailable"); return unwrap(await response.json()); })
      .then(value => { if (!controller.signal.aborted) setProperty(value); })
      .catch(() => { if (!controller.signal.aborted) setProperty(null); });
    return () => controller.abort();
  }, [propertyId]);
  const location = [property?.location?.locality, property?.location?.city, property?.location?.state].filter(Boolean).join(", ");
  const image = property?.imageUrls?.find(url => /^https?:\/\//i.test(url));
  return <aside className="messages-property-panel">
    <p className="eyebrow">PROPERTY DOSSIER</p>
    <div className="messages-property-card">
      {image ? <img src={image} alt={property?.title || fallbackTitle}/> : <div className="messages-property-placeholder">⌂</div>}
      <div className="messages-property-copy">
        <strong>{property?.title || fallbackTitle}</strong>
        <b>{money(property?.priceAmount)}</b>
        {location && <small>{location}</small>}
        <div className="messages-property-meta">{property?.listingType === "rent" ? "For rent" : property?.listingType === "sale" ? "For sale" : "Property listing"}{property?.areaValue ? " · " + property.areaValue + " " + (property.areaUnit || "sqft") : ""}</div><div className="messages-property-facts">{property?.bedrooms ? <span>{property.bedrooms} beds</span> : null}{property?.bathrooms ? <span>{property.bathrooms} baths</span> : null}{property?.parkingCount ? <span>{property.parkingCount} parking</span> : null}</div>
        <a href={"/property/" + encodeURIComponent(propertySlug || propertyId)}>View property ↗</a>
      </div>
    </div>
    <div className="messages-owner-dossier"><span className="messages-owner-avatar">{(property?.contactName||"O").slice(0,1).toUpperCase()}</span><div><strong>{property?.contactName||"Property owner"}</strong><small>Listing contact · Owner details</small></div></div><div className="messages-property-safety"><strong>Buyer safety</strong><p>Verify ownership documents and property details independently. Do not transfer deposits before verification.</p></div>
  </aside>;
}
