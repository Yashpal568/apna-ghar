"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import VisitRequestForm from "./VisitRequestForm";
import PropertyReportForm from "./PropertyReportForm";

type Property = {
  _id: string;
  slug?: string;
  title: string;
  description?: string;
  categoryId?: string;
  listingType?: "sale" | "rent";
  priceAmount?: number;
  currency?: string;
  areaValue?: number;
  areaUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingCount?: number;
  furnishing?: string;
  amenities?: string[];
  imageUrls?: string[];
  videoUrls?: string[];
  contactName?: string;
  contactPhone?: string;
  location?: { state?: string; city?: string; locality?: string; addressText?: string };
  publishedAt?: string;
  viewsCount?: number;
};
type ListingResponse = { items?: Property[]; pagination?: { pages?: number; total?: number } };
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");

function isProperty(value: unknown): value is Property {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Property>;
  return typeof item._id === "string" && typeof item.title === "string";
}
function unwrapProperty(value: unknown): Property | null {
  if (isProperty(value)) return value;
  if (value && typeof value === "object" && "data" in value) {
    const data = (value as { data?: unknown }).data;
    if (isProperty(data)) return data;
    if (data && typeof data === "object" && "property" in data && isProperty((data as { property?: unknown }).property)) return (data as { property: Property }).property;
  }
  return null;
}
function money(value?: number, currency = "INR") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Price on request";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}
function locationText(property: Property) {
  return [property.location?.locality, property.location?.city, property.location?.state].filter(Boolean).join(", ") || "Location not provided";
}

async function resolveProperty(identifier: string, signal: AbortSignal): Promise<Property> {
  const headers = { Accept: "application/json" };
  const direct = await fetch(API_BASE + "/properties/" + encodeURIComponent(identifier), { signal, cache: "no-store", headers });
  if (direct.ok) {
    const property = unwrapProperty(await direct.json());
    if (property) return property;
    throw new Error("The property API returned an unexpected detail response.");
  }
  if (direct.status !== 404) {
    throw new Error(direct.status === 429 ? "The property service is temporarily rate-limited. Please try again shortly." : `The property service returned HTTP ${direct.status}.`);
  }

  // Older shared links may contain a legacy identifier rather than the current
  // MongoDB slug. Resolve only against real, public API inventory; never render
  // sample data or silently substitute a different property.
  const first = await fetch(API_BASE + "/properties?page=1&limit=50&sort=newest", { signal, cache: "no-store", headers });
  if (!first.ok) throw new Error(`Could not resolve this property from the live listings (HTTP ${first.status}).`);
  const firstPage = await first.json() as ListingResponse;
  const pages = Math.min(Math.max(firstPage.pagination?.pages || 1, 1), 20);
  const all: Property[] = Array.isArray(firstPage.items) ? firstPage.items.filter(isProperty) : [];
  const match = (items: Property[]) => items.find(item => item._id === identifier || item.slug === identifier);
  const found = match(all);
  if (found) return found;
  for (let page = 2; page <= pages; page += 1) {
    const response = await fetch(API_BASE + `/properties?page=${page}&limit=50&sort=newest`, { signal, cache: "no-store", headers });
    if (!response.ok) continue;
    const data = await response.json() as ListingResponse;
    const items = Array.isArray(data.items) ? data.items.filter(isProperty) : [];
    const pageMatch = match(items);
    if (pageMatch) return pageMatch;
  }
  throw new Error("This link does not match a currently published property. Open My listings to confirm the property is published, then open its current View listing link.");
}

export default function PropertyDetailLive({ id }: { id: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const images = useMemo(() => (property?.imageUrls || []).filter((url): url is string => typeof url === "string" && /^https?:\/\//i.test(url)), [property?.imageUrls]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setProperty(null);
    setActiveImage(0);
    setNotice("");
    resolveProperty(id, controller.signal)
      .then(result => { if (!controller.signal.aborted) setProperty(result); })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load this property.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, retry]);

  const share = useCallback(async () => {
    try {
      if (navigator.share) await navigator.share({ title: property?.title || "Apna Ghar property", url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setNotice("Property link copied."); }
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === "AbortError")) setNotice("Could not share this property.");
    }
  }, [property?.title]);

  if (loading) return <main className="page-shell interior-page property-detail-new"><SiteHeader active="search"/><div className="pd-loading"><div className="pd-loading-photo"/><div className="pd-loading-line"/><div className="pd-loading-line short"/></div><SiteFooter/></main>;
  if (error || !property) return <main className="page-shell interior-page property-detail-new"><SiteHeader active="search"/><section className="pd-error"><span className="pd-error-icon">⌂</span><p className="eyebrow">APNA GHAR · PROPERTY DETAILS</p><h1>We couldn’t find this listing</h1><p>{error || "This property is not available right now."}</p><div className="pd-actions"><button className="button button-outline" type="button" onClick={() => setRetry(value => value + 1)}>Try again</button><a className="button button-primary" href="/search">Browse properties</a><a className="button button-quiet" href="/my-listings">My listings</a></div></section><SiteFooter/></main>;

  const price = money(property.priceAmount, property.currency || "INR");
  const address = locationText(property);
  const listingType = property.listingType === "rent" ? "For rent" : "For sale";
  return <main className="page-shell interior-page property-detail-new">
    <SiteHeader active="search"/>
    <nav className="pd-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/search">Properties</a><span>/</span><span>{property.title}</span></nav>
    <section className="pd-heading">
      <div><span className="pd-status"><i/> {listingType} · {property.categoryId || "Property"}</span><h1>{property.title}</h1><p>⌖ {address}</p></div>
      <div className="pd-heading-actions"><button className="button button-outline" type="button" onClick={() => void share()}>↗ Share</button><a className="button button-primary" href="/list-property">＋ Post property</a></div>
    </section>
    {notice && <p className="form-notice" role="status">{notice}</p>}
    <section className="pd-gallery" aria-label="Property photos">
      <div className="pd-main-photo">{images.length ? <img src={images[Math.min(activeImage, images.length - 1)]} alt={property.title}/> : <div className="pd-no-photo"><span>⌂</span><strong>No property photos uploaded</strong><small>The advertiser has not added photos yet.</small></div>}
        {images.length > 1 && <><button className="pd-gallery-arrow prev" type="button" aria-label="Previous image" onClick={() => setActiveImage(v => (v - 1 + images.length) % images.length)}>‹</button><button className="pd-gallery-arrow next" type="button" aria-label="Next image" onClick={() => setActiveImage(v => (v + 1) % images.length)}>›</button></>}
        {images.length > 0 && <span className="pd-image-count">{activeImage + 1} / {images.length}</span>}
      </div>
      <div className="pd-thumbnails">{images.slice(0, 4).map((url, index) => <button key={url + index} type="button" className={activeImage === index ? "is-active" : ""} onClick={() => setActiveImage(index)} aria-label={`Show photo ${index + 1}`}><img src={url} alt=""/></button>)}{images.length > 4 && <button className="pd-more-photos" type="button" onClick={() => setActiveImage(4)}>+{images.length - 4}<small>photos</small></button>}</div>
    </section>
    <div className="pd-content-layout">
      <article className="pd-main-content">
        <section className="pd-price-mobile"><span>Asking price</span><strong>{price}{property.listingType === "rent" ? <small> / month</small> : null}</strong></section>
        <div className="pd-facts">{[{label:"Area",value:property.areaValue ? `${property.areaValue.toLocaleString("en-IN")} ${property.areaUnit || "sqft"}` : "—"},{label:"Bedrooms",value:property.bedrooms ?? "—"},{label:"Bathrooms",value:property.bathrooms ?? "—"},{label:"Parking",value:property.parkingCount ?? "—"}].map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        <section className="pd-section"><p className="eyebrow">THE PROPERTY</p><h2>About this property</h2><p className="pd-description">{property.description?.trim() || "The owner has not added a description for this property."}</p></section>
        <section className="pd-section"><p className="eyebrow">DETAILS</p><h2>Features & amenities</h2>{property.amenities?.length ? <div className="pd-amenities">{property.amenities.map(item => <span key={item}>✓ {item}</span>)}</div> : <p className="pd-muted">No additional amenities listed.</p>}<div className="pd-extra-details"><div><span>Property type</span><strong>{property.categoryId || "Not specified"}</strong></div><div><span>Furnishing</span><strong>{property.furnishing || "Not specified"}</strong></div><div><span>Listing type</span><strong>{listingType}</strong></div><div><span>Listed on</span><strong>{property.publishedAt ? new Date(property.publishedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "Recently"}</strong></div></div></section>
        <section className="pd-section"><p className="eyebrow">NEIGHBOURHOOD</p><h2>Location</h2><div className="pd-location"><span>⌖</span><div><strong>{address}</strong><small>{property.location?.addressText || "Exact address can be confirmed with the property owner."}</small></div></div></section>
        {property.videoUrls?.length ? <section className="pd-section"><p className="eyebrow">PROPERTY TOUR</p><h2>Videos</h2><div className="pd-videos">{property.videoUrls.map((url,index)=><video key={url+index} src={url} controls preload="metadata"/> )}</div></section> : null}
        <p className="pd-disclaimer">Property information is provided by the advertiser. Please independently verify ownership, documents and details before making a payment.</p>
      </article>
      <aside className="pd-sidebar">
        <div className="pd-contact-card"><p className="eyebrow">ASKING PRICE</p><strong className="pd-price">{price}{property.listingType === "rent" ? <small> / month</small> : null}</strong><div className="pd-owner"><span>{(property.contactName || "P").trim().charAt(0).toUpperCase()}</span><div><small>Listed by</small><strong>{property.contactName || "Property owner"}</strong></div></div>{property.contactPhone?.trim() ? <a className="button button-outline button-full" href={`tel:${property.contactPhone.replace(/[^+0-9]/g,"")}`}>☎ Call owner</a> : <p className="pd-muted">Phone number is not publicly available.</p>}<a className="button button-primary button-full" href={"/sign-in?redirect_url=" + encodeURIComponent("/property/" + (property.slug || property._id))}>▤ Sign in to chat with owner</a><p className="pd-safe">Never transfer money before verifying the property and owner.</p></div>
        <div className="pd-form-card"><h3>Schedule a visit</h3><VisitRequestForm propertyId={property._id}/></div>
        <div className="pd-form-card"><h3>Report this listing</h3><PropertyReportForm propertyId={property._id}/></div>
      </aside>
    </div>
    <SiteFooter/>
  </main>;
}
