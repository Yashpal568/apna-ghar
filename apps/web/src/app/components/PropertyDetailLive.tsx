"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import "./property-detail.css";

type Property = {
  _id: string; slug?: string; title: string; description?: string;
  listingType: "sale" | "rent"; priceAmount: number; categoryId?: string;
  location?: { city?: string; state?: string; locality?: string; addressText?: string };
  areaValue?: number; areaUnit?: string; bedrooms?: number; bathrooms?: number;
  parkingCount?: number; furnishing?: string; amenities?: string[]; imageUrls?: string[];
  contactName?: string; contactPhone?: string; isNegotiable?: boolean;
  viewsCount?: number; publishedAt?: string; createdAt?: string;
};
const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "O";
function unwrap(value: unknown, depth = 0): Property | null {
  if (!value || typeof value !== "object" || depth > 4) return null;
  const item = value as Record<string, unknown>;
  if (typeof item._id === "string" && typeof item.title === "string" && typeof item.priceAmount === "number") return item as unknown as Property;
  for (const key of ["data", "result", "property", "item"]) { const found = unwrap(item[key], depth + 1); if (found) return found; }
  return null;
}
type ListingPage = { items: Property[]; pages?: number; total?: number; pagination?: { pages?: number; total?: number } };
function unwrapListing(value: unknown, depth = 0): ListingPage {
  if (Array.isArray(value)) return { items: value.filter((item) => item && typeof item === "object") as Property[] };
  if (!value || typeof value !== "object" || depth > 5) return { items: [] };
  const record = value as Record<string, unknown>;
  const pagination = (record.pagination && typeof record.pagination === "object" ? record.pagination : {}) as Record<string, unknown>;
  if (Array.isArray(record.items)) return {
    items: record.items as Property[],
    pages: Number(record.pages ?? pagination.pages) || undefined,
    total: Number(record.total ?? pagination.total) || undefined,
  };
  for (const key of ["data", "result", "properties", "results"]) {
    if (key in record) {
      const nested = unwrapListing(record[key], depth + 1);
      if (nested.items.length) return {
        ...nested,
        pages: nested.pages ?? (Number(record.pages ?? pagination.pages) || undefined),
        total: nested.total ?? (Number(record.total ?? pagination.total) || undefined),
      };
    }
  }
  return { items: [] };
}
async function findInPublicListings(identifier: string, signal: AbortSignal): Promise<Property | null> {
  const first = await fetch(API + "/properties?page=1&limit=50&sort=newest", {
    signal, cache: "no-store", headers: { Accept: "application/json" },
  });
  if (!first.ok) throw new Error("The property lookup failed (" + first.status + ").");
  const initial = unwrapListing(await first.json());
  const matches = (items: Property[]) => items.find((item) =>
    item._id === identifier || (typeof item.slug === "string" && item.slug.toLowerCase() === identifier.toLowerCase())
  ) || null;
  const found = matches(initial.items);
  if (found) return found;
  const pages = Math.min(1000, Math.max(1, initial.pages || (initial.total ? Math.ceil(initial.total / 50) : 1)));
  for (let page = 2; page <= pages; page += 1) {
    const response = await fetch(API + "/properties?page=" + page + "&limit=50&sort=newest", {
      signal, cache: "no-store", headers: { Accept: "application/json" },
    });
    if (!response.ok) break;
    const listingPage = unwrapListing(await response.json());
    const match = matches(listingPage.items);
    if (match) return match;
    if (!listingPage.items.length) break;
  }
  return null;
}

function Detail({ id, signedIn, getToken }: { id: string; signedIn: boolean; getToken: () => Promise<string | null> }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const response = await fetch(API + "/properties/" + encodeURIComponent(id), { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } });
        if (response.ok) {
          const result = unwrap(await response.json());
          if (result) { setProperty(result); return; }
        } else if (response.status !== 404) {
          throw new Error("We couldn't load this property (API " + response.status + "). Please try again.");
        }
        // A public listing can still be available even if the slug-based detail endpoint returns 404.
        const fallback = await findInPublicListings(id, controller.signal);
        if (!fallback) throw new Error("This property could not be found in the published listings. Please check that it is still active.");
        setProperty(fallback);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "We couldn't load this property.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!property) return;
    try { const items = JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[]; setSaved(items.some((item) => item._id === property._id)); } catch { setSaved(false); }
  }, [property]);

  const images = useMemo(() => (property?.imageUrls || []).filter((url) => /^https?:\/\//i.test(url)), [property]);
  const location = [property?.location?.locality, property?.location?.city, property?.location?.state].filter(Boolean).join(", ");
  const owner = property?.contactName?.trim() || "Property owner";
  const emi = useMemo(() => {
    if (!property) return 0;
    const principal = property.priceAmount * (1 - down / 100), months = years * 12, r = rate / 1200;
    return Math.round(r ? principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1) : principal / months);
  }, [property, down, rate, years]);

  async function toggleSave() {
    if (!property) return;
    if (!signedIn) { router.push("/sign-in?redirect_url=" + encodeURIComponent("/property/" + (property.slug || property._id))); return; }
    try {
      const token = await getToken(); if (!token) throw new Error("Please sign in again.");
      const next = !saved;
      const response = await fetch(API + "/saved-properties/" + encodeURIComponent(property._id), { method: next ? "POST" : "DELETE", headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
      if (!response.ok) throw new Error("Could not update saved properties. Please retry.");
      setSaved(next);
      const old = (() => { try { return JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[]; } catch { return []; } })();
      localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(next ? [property, ...old.filter((p) => p._id !== property._id)] : old.filter((p) => p._id !== property._id)));
      window.dispatchEvent(new Event("apna-ghar-saved-change")); setNotice(next ? "Saved to your account." : "Removed from saved homes.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not update saved homes."); }
  }

  async function chat() {
    if (!property) return;
    if (!signedIn) { router.push("/sign-in?redirect_url=" + encodeURIComponent("/property/" + (property.slug || property._id))); return; }
    setBusy(true); setNotice("");
    try {
      const token = await getToken(); if (!token) throw new Error("Your session expired. Please sign in again.");
      const response = await fetch(API + "/conversations/property/" + encodeURIComponent(property._id), { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({}) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || typeof body.conversationId !== "string") throw new Error(typeof body.message === "string" ? body.message : "Couldn't start a conversation.");
      router.push("/messages?conversation=" + encodeURIComponent(body.conversationId));
    } catch (e) { setNotice(e instanceof Error ? e.message : "Couldn't contact this owner."); setBusy(false); }
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: property?.title || "Property on Apna Ghar", url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setNotice("Property link copied."); }
    } catch (e) { if (e instanceof Error && e.name !== "AbortError") setNotice("Couldn't share this link."); }
  }

  if (loading) return <main className="pd-page"><div className="pd-state"><div className="pd-spinner" /><h1>Loading property details</h1><p>Fetching the latest published listing…</p></div></main>;
  if (error || !property) return <main className="pd-page"><div className="pd-state"><span className="pd-state-icon">⌂</span><p className="pd-eyebrow">APNA GHAR · PROPERTY DETAILS</p><h1>We couldn’t load this listing</h1><p>{error || "This property is not available."}</p><div className="pd-state-actions"><button onClick={() => window.location.reload()} type="button">Try again</button><a href="/search">Browse properties</a></div></div></main>;

  const area = property.areaValue ? property.areaValue.toLocaleString("en-IN") + " " + (property.areaUnit || "") : "Not specified";
  const perArea = property.areaValue ? money(property.priceAmount / property.areaValue) + " / " + (property.areaUnit || "unit") : "";
  const published = property.publishedAt || property.createdAt;
  const date = published ? new Date(published).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently listed";
  const amenities = (property.amenities || []).filter(Boolean);
  const map = encodeURIComponent([property.location?.addressText, location].filter(Boolean).join(", ") || location);
  const facts = [["⌂", "Bedrooms", property.bedrooms ? String(property.bedrooms) : "—"], ["♨", "Bathrooms", property.bathrooms ? String(property.bathrooms) : "—"], ["▱", "Area", area], ["▣", "Parking", property.parkingCount ? String(property.parkingCount) : "—"], ["⌑", "Furnishing", property.furnishing && property.furnishing !== "unknown" ? property.furnishing.replace(/-/g, " ") : "—"]];

  return <main className="pd-page">
    <header className="pd-topbar"><div className="pd-topbar-inner"><button className="pd-back" type="button" onClick={() => router.back()} aria-label="Go back">← <span>Back</span></button><div className="pd-topbar-title">Property details</div><div className="pd-top-actions"><button type="button" onClick={() => void share()}>↗ <span>Share</span></button><button type="button" onClick={() => void toggleSave()} className={saved ? "is-saved" : ""}>{saved ? "♥" : "♡"} <span>{saved ? "Saved" : "Save"}</span></button></div></div></header>
    <div className="pd-container">
      <section className="pd-gallery" aria-label="Property photo gallery"><div className="pd-gallery-main">
        {images.length ? <img src={images[photo]} alt={property.title + " photo " + (photo + 1)} /> : <div className="pd-no-image"><span>⌂</span><b>Photos not added yet</b></div>}
        <div className="pd-gallery-scrim" /><div className="pd-gallery-badges"><span className="pd-listing-badge">{property.listingType === "rent" ? "FOR RENT" : "FOR SALE"}</span><span className="pd-photo-count">▧ {images.length ? (photo + 1) + " / " + images.length + " photos" : "No photos"}</span></div>
        {images.length > 1 && <div className="pd-gallery-controls"><button type="button" aria-label="Previous photo" onClick={() => setPhoto((photo + images.length - 1) % images.length)}>‹</button><button type="button" aria-label="Next photo" onClick={() => setPhoto((photo + 1) % images.length)}>›</button></div>}
        <div className="pd-gallery-caption"><span>{property.title}</span><small>{location}</small></div>
      </div>{images.length > 1 && <div className="pd-thumbnails">{images.slice(0, 8).map((src, index) => <button key={src + index} type="button" className={photo === index ? "active" : ""} onClick={() => setPhoto(index)} aria-label={"Show photo " + (index + 1)}><img src={src} alt="" /></button>)}{images.length > 8 && <span>+{images.length - 8} photos</span>}</div>}</section>

      <div className="pd-layout"><div className="pd-main-column">
        <section className="pd-summary pd-panel"><div className="pd-summary-top"><div><div className="pd-price-row"><h1>{money(property.priceAmount)}{property.listingType === "rent" ? <small> / month</small> : null}</h1>{property.isNegotiable && <span className="pd-negotiable">Negotiable</span>}</div><h2>{property.title}</h2></div><span className="pd-zero-brokerage">Direct owner listing</span></div><p className="pd-location">⌖ <span>{location || "Location not provided"}</span></p><div className="pd-summary-meta"><span>Listed {date}</span><span>{(property.viewsCount || 0).toLocaleString("en-IN")} views</span><span>{(property.categoryId || "property").replace(/[-_]/g, " ")}</span></div></section>
        <section className="pd-specs" aria-label="Property specifications">{facts.map(([icon, label, value]) => <div className="pd-spec" key={label}><span>{icon}</span><div><small>{label}</small><b>{value}</b></div></div>)}</section>
        <section className="pd-panel pd-description"><div className="pd-section-heading"><div><p className="pd-eyebrow">GET TO KNOW THE PROPERTY</p><h2>About this property</h2></div></div><p>{property.description?.trim() || "The owner has not added a description for this property yet."}</p></section>
        {amenities.length > 0 && <section className="pd-panel"><div className="pd-section-heading"><div><p className="pd-eyebrow">COMFORT & CONVENIENCE</p><h2>Property amenities</h2></div><span>{amenities.length} listed</span></div><div className="pd-amenities">{amenities.map((item) => <span key={item}>✓ {item}</span>)}</div></section>}
        <section className="pd-panel pd-emi"><div className="pd-section-heading"><div><p className="pd-eyebrow">PLAN YOUR BUDGET</p><h2>Home loan EMI estimator</h2><p>Illustrative estimate only. Actual rates and eligibility depend on your lender.</p></div></div><div className="pd-emi-result"><small>Estimated monthly EMI</small><strong>{money(emi)} <small>/ month</small></strong></div><div className="pd-range-row"><label htmlFor="pd-down">Down payment <b>{down}% · {money(property.priceAmount * down / 100)}</b></label><input id="pd-down" type="range" min="10" max="60" step="5" value={down} onChange={(event) => setDown(Number(event.target.value))} /></div><div className="pd-emi-controls"><label>Interest rate<select value={rate} onChange={(event) => setRate(Number(event.target.value))}><option value="7.5">7.5%</option><option value="8">8.0%</option><option value="8.5">8.5%</option><option value="9">9.0%</option><option value="9.5">9.5%</option><option value="10">10.0%</option></select></label><label>Loan tenure<select value={years} onChange={(event) => setYears(Number(event.target.value))}><option value="5">5 years</option><option value="10">10 years</option><option value="15">15 years</option><option value="20">20 years</option><option value="25">25 years</option><option value="30">30 years</option></select></label></div></section>
        <section className="pd-panel pd-location-panel"><div className="pd-section-heading"><div><p className="pd-eyebrow">EXPLORE THE NEIGHBOURHOOD</p><h2>Property location</h2></div></div><div className="pd-map-placeholder"><div><span>⌖</span><b>{location || "Location not provided"}</b><small>{property.location?.addressText || "Exact address has not been shared by the owner."}</small></div><a href={"https://www.google.com/maps/search/?api=1&query=" + map} target="_blank" rel="noreferrer">Open in Google Maps ↗</a></div></section>
      </div>
      <aside className="pd-sidebar"><section className="pd-panel pd-owner-card"><p className="pd-eyebrow">CONTACT THE OWNER</p><div className="pd-owner-profile"><div className="pd-avatar">{initials(owner)}</div><div><h2>{owner}</h2><span>Property owner</span></div></div><div className="pd-owner-facts"><span>⌁ Direct listing</span><span>◷ Listed {date}</span></div><p className="pd-owner-note">Connect with the owner directly to ask questions, arrange a visit and discuss this property.</p>{property.contactPhone?.trim() ? <a className="pd-call-button" href={"tel:" + property.contactPhone.replace(/[^+0-9]/g, "")}>☎ <span>Call owner</span></a> : <button className="pd-call-button is-disabled" type="button" disabled>☎ <span>Phone not available</span></button>}<button className="pd-chat-button" type="button" onClick={() => void chat()} disabled={busy}>{busy ? "Opening chat…" : "▤ Chat with owner"}</button><p className="pd-privacy-note">Verify property details and ownership documents independently before making a payment.</p></section>
      <section className="pd-panel pd-price-card"><p className="pd-eyebrow">PRICE OVERVIEW</p><div><small>Asking price</small><strong>{money(property.priceAmount)}</strong></div>{perArea && <div><small>Price per {property.areaUnit}</small><b>{perArea}</b></div>}<div><small>Listing type</small><b>{property.listingType === "rent" ? "For rent" : "For sale"}</b></div><button type="button" onClick={() => void chat()}>Enquire about this property ↗</button></section></aside></div>
      {notice && <div className="pd-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    </div>
    <div className="pd-mobile-contact"><div><small>ASKING PRICE</small><strong>{money(property.priceAmount)}</strong></div><div className="pd-mobile-contact-actions">{property.contactPhone?.trim() ? <a href={"tel:" + property.contactPhone.replace(/[^+0-9]/g, "")}>Call</a> : null}<button type="button" onClick={() => void chat()} disabled={busy}>{busy ? "Opening…" : "Chat owner"}</button></div></div>
  </main>;
}

function WithClerk({ id }: { id: string }) { const { isSignedIn, getToken } = useAuth(); return <Detail id={id} signedIn={Boolean(isSignedIn)} getToken={getToken} />; }
function WithoutClerk({ id }: { id: string }) { return <Detail id={id} signedIn={false} getToken={async () => null} />; }
export default function PropertyDetailLive({ id }: { id: string }) { return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <WithClerk id={id} /> : <WithoutClerk id={id} />; }
