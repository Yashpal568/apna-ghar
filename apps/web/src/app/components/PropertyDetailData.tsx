"use client";

import { useEffect, useState } from "react";

type Property = {
  _id: string; slug: string; title: string; description: string; listingType: "sale" | "rent";
  priceAmount: number; categoryId: string; location: { state: string; city: string; locality?: string; addressText?: string };
  areaValue: number; areaUnit: string; bedrooms?: number; bathrooms?: number; parkingCount?: number;
  furnishing?: string; amenities?: string[]; imageUrls?: string[]; publishedAt?: string;
};
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export default function PropertyDetailData({ identifier }: { identifier: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/properties/${encodeURIComponent(identifier)}`, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async response => {
        if (response.status === 404) throw new Error("This property is no longer available or the link is incorrect.");
        if (!response.ok) throw new Error("Property details could not be loaded. Please try again.");
        return response.json() as Promise<Property>;
      })
      .then(setProperty)
      .catch(e => { if (!(e instanceof Error && e.name === "AbortError")) setError(e instanceof Error ? e.message : "Property details could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [identifier]);

  if (loading) return <main className="page-shell interior-page"><div className="search-empty" role="status"><h1>Loading property…</h1><p>Getting the latest listing details.</p></div></main>;
  if (error || !property) return <main className="page-shell interior-page"><div className="search-empty" role="alert"><h1>Property unavailable</h1><p>{error || "This property could not be found."}</p><a className="button button-primary" href="/search">Browse properties</a></div></main>;

  return <main className="page-shell interior-page">
    <header className="site-header interior-header"><a className="brand" href="/"><span className="brand-placeholder">INSERT APPROVED APNA GHAR LOGO ASSET</span><span className="brand-name">Apna <b>Ghar</b></span></a><nav className="desktop-nav"><a href="/search">Explore</a><a href="/list-property">List property</a></nav><div className="header-actions"><a className="button button-primary" href="/sign-in">Sign in</a></div></header>
    <div className="breadcrumb"><a href="/">Home</a><span>/</span><a href="/search">Explore</a><span>/</span><span>Property details</span></div>
    <div className="detail-topline"><div><p className="eyebrow">PROPERTY OVERVIEW</p><h1>{property.title}</h1><p>{[property.location.locality, property.location.city, property.location.state].filter(Boolean).join(", ")}</p></div><span className="sample-pill">Live listing</span></div>
    <section className="detail-gallery"><div className="gallery-main">{property.imageUrls?.[0] ? <img src={property.imageUrls[0]} alt={property.title} /> : <span>Photos not provided for this listing</span>}<small>Property photos</small></div><div className="gallery-side"><div>{property.imageUrls?.[1] ? <img src={property.imageUrls[1]} alt="" /> : <span>Additional photos</span>}</div><div>{property.imageUrls?.[2] ? <img src={property.imageUrls[2]} alt="" /> : <span>More photos</span>}</div></div></section>
    <div className="detail-layout"><article className="detail-content"><p className="property-kind">{property.listingType === "rent" ? "FOR RENT" : "FOR SALE"} · {property.categoryId}</p><h2>{property.title}</h2><p className="detail-lead">{property.description}</p><div className="facts-grid"><div><span>Bedrooms</span><strong>{property.bedrooms ?? "—"}</strong></div><div><span>Bathrooms</span><strong>{property.bathrooms ?? "—"}</strong></div><div><span>Area</span><strong>{property.areaValue} {property.areaUnit}</strong></div><div><span>Parking</span><strong>{property.parkingCount ?? "—"}</strong></div></div><h3>Features and amenities</h3><div className="amenity-list">{property.amenities?.length ? property.amenities.map(item => <span key={item}>{item}</span>) : <p>No amenities provided.</p>}</div><h3>Location</h3><div className="location-placeholder">{[property.location.locality, property.location.city, property.location.state].filter(Boolean).join(", ")}</div><p className="fine-print">Only details supplied in the listing are shown. Apna Ghar does not independently verify ownership through this page.</p></article><aside className="contact-card"><p className="eyebrow">LISTING PRICE</p><h2>{money(property.priceAmount)}{property.listingType === "rent" ? " / month" : ""}</h2><p>Contact features will be available when sign-in and enquiry flows are connected.</p><button className="button button-primary button-full" disabled>Contact owner (coming next)</button><button className="button button-outline button-full" disabled>Schedule a visit (coming next)</button><hr/><a className="text-link" href="/safety">Safety tips for buyers ↗</a></aside></div>
    <footer className="simple-footer">Apna Ghar · Live property details</footer>
  </main>;
}
