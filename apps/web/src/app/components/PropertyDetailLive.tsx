"use client";
import SiteFooter from "./SiteFooter";
import VisitRequestForm from "./VisitRequestForm";
import PropertyReportForm from "./PropertyReportForm";
import { useEffect,useState } from "react";
import { useAuth } from "@clerk/nextjs";
type Property={_id:string;title:string;slug?:string;description?:string;contactName?:string;contactPhone?:string;listingType:"sale"|"rent";priceAmount:number;areaValue:number;areaUnit:string;bedrooms?:number;bathrooms?:number;imageUrls?:string[];amenities?:string[];categoryId?:string;location?:{locality?:string;city?:string;state?:string;addressText?:string}};
const api=(process.env.NEXT_PUBLIC_API_BASE_URL||"https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/,"");

function AuthenticatedSaveButton({ property, identifier, saved, onSaved, onNotice }: { property: Property; identifier: string; saved: boolean; onSaved: (value: boolean) => void; onNotice: (value: string) => void }) {
  const { isSignedIn, getToken } = useAuth();
  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await fetch(api + "/saved-properties", { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, signal: controller.signal });
        if (!response.ok) return;
        const homes = await response.json() as Property[];
        if (Array.isArray(homes) && homes.some((home) => home._id === property._id)) onSaved(true);
      } catch {
        // Keep the browser's saved state when account sync is unavailable.
      }
    })();
    return () => controller.abort();
  }, [getToken, isSignedIn, onSaved, property._id]);
  async function toggle() {
    const nextSaved = !saved;
    try {
      const homes = JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[];
      const next = nextSaved
        ? [{ ...property, slug: property.slug || identifier }, ...homes.filter((home) => home._id !== property._id && home.slug !== property.slug && home.slug !== identifier)]
        : homes.filter((home) => home._id !== property._id && home.slug !== property.slug && home.slug !== identifier);
      localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(next));
      window.dispatchEvent(new Event("apna-ghar-saved-change"));
      onSaved(nextSaved);
      onNotice(nextSaved ? "Saved to your shortlist." : "Removed from saved homes.");
    } catch {
      onNotice("Could not update saved homes on this device.");
      return;
    }
    if (!isSignedIn) {
      onNotice("Saved on this device. Sign in to sync across devices.");
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session is not ready. Sign in again.");
      const response = await fetch(api + "/saved-properties/" + encodeURIComponent(property._id), {
        method: nextSaved ? "POST" : "DELETE",
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : "Account sync failed. The change remains saved on this device.");
      onNotice(nextSaved ? "Saved to your account." : "Removed from your account.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Account sync failed. The change remains on this device.");
    }
  }
  return <button className="button button-outline" type="button" aria-pressed={saved} onClick={() => void toggle()}>{saved ? "♥ Saved" : "♡ Save home"}</button>;
}

function AuthenticatedPropertyContactActions({ propertyId, slug, phone }: { propertyId: string; slug: string; phone?: string }) {
  const { isSignedIn, getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function startChat() {
    if (!isSignedIn) {
      window.location.assign("/sign-in?redirect_url=" + encodeURIComponent("/property/" + slug));
      return;
    }
    setBusy(true); setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Sign in again.");
      const response = await fetch(api + "/conversations/property/" + encodeURIComponent(propertyId), {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not start this conversation.");
      window.location.assign("/messages?conversation=" + encodeURIComponent(body.conversationId));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start chat.");
      setBusy(false);
    }
  }
  return <div className="property-contact-actions">
    {phone?.trim() ? <a className="button button-outline button-full" href={"tel:" + phone.replace(/[^+0-9]/g, "")}>☎ Call owner</a> : <p className="contact-phone-missing">The owner has not added a public contact number.</p>}
    <button className="button button-primary button-full" type="button" onClick={() => void startChat()} disabled={busy}>{busy ? "Opening chat…" : "▤ Chat with owner"}</button>
    {notice && <p className="form-notice" role="status">{notice}</p>}
  </div>;
}

function PropertyContactActions({ propertyId, slug, phone }: { propertyId: string; slug: string; phone?: string }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <div className="property-contact-actions">
      {phone?.trim() ? <a className="button button-outline button-full" href={"tel:" + phone.replace(/[^+0-9]/g, "")}>☎ Call owner</a> : <p className="contact-phone-missing">The owner has not added a public contact number.</p>}
      <a className="button button-primary button-full" href={"/sign-in?redirect_url=" + encodeURIComponent("/property/" + slug)}>▤ Sign in to chat</a>
    </div>;
  }
  return <AuthenticatedPropertyContactActions propertyId={propertyId} slug={slug} phone={phone} />;
}

export default function PropertyDetailLive({id}:{id:string}){const [p,setP]=useState<Property|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(true);const [saved,setSaved]=useState(false);const [notice,setNotice]=useState("");
useEffect(()=>{try{const savedHomes=JSON.parse(localStorage.getItem("apna-ghar-saved-homes")||"[]") as Property[];setSaved(savedHomes.some(home=>home._id===id||home.slug===id));}catch{setSaved(false)}const c=new AbortController();fetch(api+"/properties/"+encodeURIComponent(id),{signal:c.signal,headers:{Accept:"application/json"}}).then(async r=>{if(!r.ok)throw new Error(r.status===404?"This property is not available.":"Could not load property details.");return r.json() as Promise<Property>}).then(setP).catch(e=>{if(e.name!=="AbortError")setError(e.message||"Could not load property details.")}).finally(()=>{if(!c.signal.aborted)setLoading(false)});return()=>c.abort()},[id]);
if(loading)return <main className="page-shell interior-page"><div className="detail-skeleton" role="status" aria-label="Loading property details"><div className="skeleton skeleton-heading"/><div className="skeleton skeleton-copy"/><div className="skeleton skeleton-image"/><div className="skeleton skeleton-heading"/><div className="skeleton skeleton-copy"/><span className="sr-only">Loading property details…</span></div></main>;
if(error||!p)return <main className="page-shell interior-page"><div className="breadcrumb"><a href="/">Home</a><span>/</span><a href="/search">Explore</a><span>/</span><span>Property unavailable</span></div><div className="search-empty" role="alert"><h1>Property unavailable</h1><p>{error||"No property found."}</p><a className="button button-primary" href="/search">Browse properties</a></div><SiteFooter /></main>;
const price=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(p.priceAmount);
return <main className="page-shell interior-page"><div className="breadcrumb"><a href="/">Home</a><span>/</span><a href="/search">Explore</a><span>/</span><span>Property details</span></div><div className="detail-topline"><div><p className="eyebrow">PROPERTY OVERVIEW</p><h1>{p.title}</h1><p>{[p.location?.locality,p.location?.city,p.location?.state].filter(Boolean).join(", ")}</p></div><div className="detail-quick-actions"><span className="sample-pill">Live listing</span>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <AuthenticatedSaveButton property={p} identifier={id} saved={saved} onSaved={setSaved} onNotice={setNotice} /> : <button className="button button-outline" type="button" aria-pressed={saved} onClick={()=>{try{const homes=JSON.parse(localStorage.getItem("apna-ghar-saved-homes")||"[]") as Property[];const exists=homes.some(home=>home._id===p._id||home.slug===p.slug||home.slug===id);const next=exists?homes.filter(home=>home._id!==p._id&&home.slug!==p.slug&&home.slug!==id):[{...p,slug:p.slug||id},...homes];localStorage.setItem("apna-ghar-saved-homes",JSON.stringify(next));window.dispatchEvent(new Event("apna-ghar-saved-change"));setSaved(!exists);setNotice(exists?"Removed from saved homes.":"Saved to your shortlist.");}catch{setNotice("Could not update saved homes in this browser.");}}}>{saved?"♥ Saved":"♡ Save home"}</button>}<button className="button button-outline" type="button" onClick={async()=>{try{if(navigator.share)await navigator.share({title:p.title,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);setNotice("Property link copied.");}}catch(e){if(e instanceof Error&&e.name!=="AbortError")setNotice("Could not share this property.");}}}>Share ↗</button></div></div>{notice&&<p className="form-notice" role="status">{notice}</p>}<section className="detail-gallery"><div className="gallery-main">{p.imageUrls?.[0]?<img src={p.imageUrls[0]} alt={p.title}/>:<span>Photos not provided</span>}<small>Property photos</small></div><div className="gallery-side"><div>{p.imageUrls?.[1]?<img src={p.imageUrls[1]} alt=""/>:<span>Additional photos</span>}</div><div>{p.imageUrls?.[2]?<img src={p.imageUrls[2]} alt=""/>:<span>More photos</span>}</div></div></section><div className="detail-layout"><article className="detail-content"><p className="property-kind">{p.listingType==="rent"?"FOR RENT":"FOR SALE"} · {p.categoryId||"PROPERTY"}</p><h2>{p.title}</h2><p className="detail-lead">{p.description||"No description has been provided for this listing."}</p><div className="facts-grid"><div><span>Bedrooms</span><strong>{p.bedrooms??"—"}</strong></div><div><span>Bathrooms</span><strong>{p.bathrooms??"—"}</strong></div><div><span>Area</span><strong>{p.areaValue} {p.areaUnit}</strong></div><div><span>Listing</span><strong>{p.listingType==="rent"?"Rent":"Sale"}</strong></div></div><h3>Features and amenities</h3><div className="amenity-list">{p.amenities?.length?p.amenities.map(a=><span key={a}>{a}</span>):<p>No amenities provided.</p>}</div><h3>Location</h3><div className="location-placeholder">{[p.location?.addressText,p.location?.locality,p.location?.city,p.location?.state].filter(Boolean).join(", ")||"Location details not provided"}</div><p className="fine-print">Listing details are supplied by the advertiser and are not independently verified by this page.</p></article><aside className="contact-card"><p className="eyebrow">LISTING PRICE</p><h2>{price}{p.listingType==="rent"?" / month":""}</h2><p>{p.contactName ? `Listed by ${p.contactName}. ` : ""}Contact the advertiser directly or start a private conversation about this property.</p><PropertyContactActions propertyId={p._id} slug={p.slug||id} phone={p.contactPhone}/><VisitRequestForm propertyId={p._id}/><hr/><a className="text-link" href="/safety">Safety tips for buyers ↗</a><hr/><PropertyReportForm propertyId={p._id}/></aside></div><SiteFooter /></main>;
}
