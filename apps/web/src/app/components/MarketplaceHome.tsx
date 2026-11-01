"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import BrandLogo from "./BrandLogo";
import SiteHeader from "./SiteHeader";
import { fetchApi } from "../utils/api";

type Property = {
  _id: string; slug: string; title: string; description?: string;
  listingType: "sale" | "rent"; priceAmount: number; currency?: string;
  categoryId: string; location?: { city?: string; state?: string; locality?: string };
  areaValue: number; areaUnit: string; bedrooms?: number; bathrooms?: number;
  imageUrls?: string[]; contactName?: string; contactPhone?: string; furnishing?: string;
};
type Result = { items: Property[]; pagination: { total: number; pages: number; page: number } };
type Category = { key: string; label: string; icon: string };
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const categoryDefaults: Category[] = [
  { key: "apartments", label: "Flats & Apartments", icon: "▦" },
  { key: "houses", label: "Villas & Houses", icon: "⌂" },
  { key: "plots", label: "Plots & Land", icon: "▧" },
  { key: "commercial", label: "Commercial", icon: "▤" },
  { key: "pg", label: "PG & Co-living", icon: "⌑" },
  { key: "farmhouse", label: "Farmhouses", icon: "♧" },
  { key: "builder-floors", label: "Builder Floors", icon: "▥" },
  { key: "all", label: "All property types", icon: "＋" },
];

function MarketplaceHomeContent({ isSignedIn, getToken }: { isSignedIn: boolean; getToken: () => Promise<string | null> }) {
  const [transaction, setTransaction] = useState<"buy" | "rent">("buy");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("any");
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactBusy, setContactBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const categories = categoryOptions.length ? categoryOptions : categoryDefaults;

  useEffect(() => {
    const controller = new AbortController();
    void fetchApi("/categories", { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async response => { if (!response.ok) throw new Error("Categories unavailable"); const data = await response.json() as Category[]; if (Array.isArray(data) && data.length) setCategoryOptions(data); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      const query = new URLSearchParams({ page: "1", limit: "8", sort });
      if (location.trim()) query.set("q", location.trim());
      query.set("listingType", transaction === "rent" ? "rent" : "sale");
      if (category !== "all") query.set("categoryId", category);
      if (budget === "50") { query.set("minPrice", "0"); query.set("maxPrice", "5000000"); }
      if (budget === "100") { query.set("minPrice", "0"); query.set("maxPrice", "10000000"); }
      if (filter === "beds") query.set("minBedrooms", "3");
      if (filter === "furnished") query.set("furnishing", "furnished");
      try {
        const response = await fetchApi("/properties?" + query.toString(), { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Live property search returned " + response.status);
        setResult(await response.json() as Result);
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError("Live listings are temporarily unavailable. Please retry in a moment."); setResult(null);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [transaction, category, location, budget, sort, filter, retry]);

  const searchUrl = "/search?transaction=" + transaction + (location.trim() ? "&location=" + encodeURIComponent(location.trim()) : "") + (category !== "all" ? "&type=" + encodeURIComponent(category) : "");
  const contactOwner = useCallback(async (property: Property) => {
    if (!isSignedIn) { window.location.assign("/sign-in?redirect_url=" + encodeURIComponent("/search")); return; }
    setContactBusy(property._id); setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again to contact the owner.");
      const response = await fetchApi("/conversations/property/" + encodeURIComponent(property._id), { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({}) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Couldn't open this conversation.");
      window.location.assign("/messages?conversation=" + encodeURIComponent(body.conversationId));
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Couldn't open this conversation."); setContactBusy(""); }
  }, [getToken, isSignedIn]);

  return <main className="agh-market agh-home-redesign">
    <SiteHeader active="home" searchValue={location} onSearchChange={setLocation} />
    <section className="agh-home-hero">
      <div className="agh-home-hero-carousel" aria-hidden="true"><span className="agh-home-hero-slide agh-home-hero-slide-one" /><span className="agh-home-hero-slide agh-home-hero-slide-two" /><span className="agh-home-hero-slide agh-home-hero-slide-three" /></div>
      <div className="agh-home-hero-top"><span className="agh-home-kicker"><i /> INDIA'S DIRECT-OWNER PROPERTY MARKETPLACE</span><span className="agh-home-trust">✓ Built for transparent property discovery</span></div>
      <div className="agh-home-hero-grid">
        <div className="agh-home-hero-copy">
          <span className="agh-home-mobile-eyebrow">ZERO BROKERAGE · DIRECT OWNER</span>
          <h1>Discover a home<br />that feels like <em>yours.</em></h1>
          <p className="agh-home-lede">Find verified homes, apartments and plots across India. Connect directly with owners and move forward with confidence.</p>
          <div className="agh-home-proof"><span>✓ Direct owner connections</span><b /> <span>✓ No middleman commission</span></div>
          <div className="agh-home-location"><span>⌖</span><div><small>EXPLORE YOUR CITY</small><strong>{location.trim() || "Across India"}</strong></div><span className="agh-home-location-count">{loading ? "…" : (result?.pagination.total ?? 0) + " listings"}</span></div>
        </div>
        <div className="agh-home-promo" role="complementary" aria-label="Direct owner property discovery">
          <div className="agh-home-promo-photo" />
          <div className="agh-home-promo-copy"><span>ZERO BROKERAGE</span><strong>Find your home, direct from owners.</strong><p>Transparent deals. Phone-verified sellers. No hidden middlemen.</p><div><a href="/search?transaction=buy">Buy a home</a><a href="/search?transaction=rent">Rent a home</a></div></div>
        </div>
      </div>
      <div className="agh-home-search-panel">
        <div className="agh-home-search-tabs"><button className={transaction === "buy" ? "active" : ""} onClick={() => setTransaction("buy")}>Buy</button><button className={transaction === "rent" ? "active" : ""} onClick={() => setTransaction("rent")}>Rent</button><button className={category === "commercial" ? "active" : ""} onClick={() => setCategory("commercial")}>Commercial</button><button onClick={() => { setCategory("plots"); setTransaction("buy"); }}>Plots & Land</button></div>
        <div className="agh-home-search-fields">
          <label className="agh-home-field agh-home-field-location"><small>LOCATION / LOCALITY</small><span>⌖ <input aria-label="City or locality" value={location} onChange={event => setLocation(event.target.value)} placeholder="Enter city, area or landmark" /></span></label>
          <label className="agh-home-field"><small>PROPERTY TYPE</small><select value={category} onChange={event => setCategory(event.target.value)}><option value="all">All property types</option>{categories.filter(item => item.key !== "all").map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          <label className="agh-home-field"><small>YOUR BUDGET</small><select value={budget} onChange={event => setBudget(event.target.value)}><option value="any">Any budget</option><option value="50">Up to ₹50 lakh</option><option value="100">Up to ₹1 crore</option></select></label>
          <a className="agh-home-search-button" href={searchUrl}>Search properties <span>↗</span></a>
        </div>
        <div className="agh-home-popular"><b>POPULAR:</b>{[{label:"Ready to move",value:"ready"},{label:"3+ BHK",value:"beds"},{label:"Furnished",value:"furnished"},{label:"Under ₹50L",value:"budget"}].map(item => <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => { setFilter(filter === item.value ? "" : item.value); if (item.value === "budget") setBudget(budget === "50" ? "any" : "50"); }}>{item.label}</button>)}</div>
      </div>
    </section>

    <section className="agh-home-categories">
      <div className="agh-home-section-heading"><div><span className="agh-home-eyebrow">EXPLORE BY CATEGORY</span><h2>Find the right space for you</h2><p>From your first apartment to your next business address.</p></div><a href="/search">View all properties <span>↗</span></a></div>
      <div className="agh-home-category-grid">{categories.map(item => <button key={item.key} className={category === item.key ? "selected" : ""} onClick={() => { setCategory(item.key); document.getElementById("agh-live-properties")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span className="agh-home-category-icon">{item.icon}</span><strong>{item.label}</strong><small>Explore properties <b>→</b></small></button>)}</div>
    </section>

    <section className="agh-home-listings" id="agh-live-properties">
      <div className="agh-home-section-heading"><div><span className="agh-home-eyebrow">FRESH ON APNA GHAR</span><h2>{transaction === "rent" ? "Homes available for rent" : "Spaces worth coming home to"}</h2><p>Explore currently published properties from the live marketplace.</p></div><div className="agh-home-listing-tools"><label>Sort by <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label><a href={searchUrl}>See all <span>↗</span></a></div></div>
      <div className="agh-home-filter-row"><button className={!filter ? "active" : ""} onClick={() => setFilter("")}>All homes</button><button className={filter === "beds" ? "active" : ""} onClick={() => setFilter(filter === "beds" ? "" : "beds")}>3+ bedrooms</button><button className={filter === "furnished" ? "active" : ""} onClick={() => setFilter(filter === "furnished" ? "" : "furnished")}>Furnished</button><button onClick={() => { setBudget("50"); setFilter("budget"); }}>Under ₹50L</button></div>
      {notice && <p className="agh-home-notice" role="status">{notice}</p>}
      {error && <div className="agh-home-empty" role="alert"><h3>We couldn't load live properties</h3><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
      {loading && <div className="agh-home-property-grid">{Array.from({ length: 4 }, (_, index) => <div className="agh-home-skeleton" key={index}><div /><span /><span /></div>)}</div>}
      {!loading && !error && !result?.items.length && <div className="agh-home-empty"><span>⌂</span><h3>No published properties found</h3><p>Try a different location or category, or be the first to list a property.</p><a href="/list-property">Post a property ↗</a></div>}
      {!loading && !error && !!result?.items.length && <div className="agh-home-property-grid">{result.items.map(property => <article className="agh-home-property-card" key={property._id}>
        <a className="agh-home-property-image" href={"/property/" + encodeURIComponent(property.slug || property._id)} style={{ backgroundImage: property.imageUrls?.[0] ? "url('" + property.imageUrls[0] + "')" : "linear-gradient(135deg,var(--color-surface-subtle),var(--color-border))" }}><span>{property.listingType === "rent" ? "FOR RENT" : "FOR SALE"}</span><b>↗</b></a>
        <div className="agh-home-property-content"><div className="agh-home-property-price">{money(property.priceAmount)}{property.listingType === "rent" && <small> / month</small>}</div><h3><a href={"/property/" + encodeURIComponent(property.slug || property._id)}>{property.title}</a></h3><p className="agh-home-property-place">⌖ {[property.location?.locality, property.location?.city, property.location?.state].filter(Boolean).join(", ") || "Location not specified"}</p><div className="agh-home-property-facts"><span>▱ {property.areaValue} {property.areaUnit}</span>{property.bedrooms != null && <span>▦ {property.bedrooms} beds</span>}{property.bathrooms != null && <span>◌ {property.bathrooms} baths</span>}</div><div className="agh-home-owner"><span className="agh-home-owner-avatar">{(property.contactName || "O").slice(0, 1).toUpperCase()}</span><div><strong>{property.contactName || "Property owner"}</strong><small>Property listed on Apna Ghar</small></div></div><div className="agh-home-card-actions">{property.contactPhone?.trim() ? <a href={"tel:" + property.contactPhone.replace(/[^+0-9]/g, "")}>☎ Call owner</a> : <button disabled title="No public phone number provided">Call unavailable</button>}<button onClick={() => void contactOwner(property)} disabled={contactBusy === property._id}>{contactBusy === property._id ? "Opening…" : "Message owner"}</button></div></div>
      </article>)}</div>}
      <div className="agh-home-results-foot"><span>{result ? result.pagination.total + " published properties" : "Live marketplace inventory"}</span><a href={searchUrl}>Explore all properties →</a></div>
    </section>

    <section className="agh-home-owner-cta"><div className="agh-home-cta-mark" aria-hidden="true"><span>⌂</span></div><div><span className="agh-home-eyebrow">A BETTER WAY TO SELL OR RENT</span><h2>Your property deserves the right audience.</h2><p>List your property and start conversations directly with people looking for a place like yours.</p></div><a href="/list-property">Post your property <span>↗</span></a></section>
    <section className="agh-home-trust"><div><b>₹0</b><span>Free to get started</span></div><div><b>Direct</b><span>Connect with owners</span></div><div><b>India-wide</b><span>Discover across cities</span></div><div><b>Your choice</b><span>Buy, rent or explore</span></div></section>
    <footer className="agh-home-footer"><div className="agh-home-footer-brand"><a href="/"><BrandLogo /></a><p>Find your place. Connect directly. Move forward with confidence.</p></div><div><strong>Discover</strong><a href="/search">All properties</a><a href="/search?transaction=buy">Buy a home</a><a href="/search?transaction=rent">Rent a home</a><a href="/search?type=commercial">Commercial</a></div><div><strong>For property owners</strong><a href="/list-property">Post a property</a><a href="/my-listings">Manage listings</a></div><div><strong>Your account</strong><a href="/profile">My profile</a><a href="/messages">Messages</a><a href="/about">About us</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div><div className="agh-home-footer-bottom">© {new Date().getFullYear()} Apna Ghar. Made for finding what feels like home.</div></footer>
    <nav className="agh-home-mobile-nav" aria-label="Mobile navigation"><a className="active" href="/">⌂<small>Home</small></a><a href="/search">⌕<small>Search</small></a><a className="post" href="/list-property">＋<small>Post</small></a><a href="/messages">▤<small>Chat</small></a><a href="/profile">◉<small>Profile</small></a></nav>
  </main>;
}

function MarketplaceHomeWithClerk() {
  const { isSignedIn, getToken } = useAuth();
  return <MarketplaceHomeContent isSignedIn={Boolean(isSignedIn)} getToken={getToken} />;
}
function MarketplaceHomeWithoutClerk() {
  return <MarketplaceHomeContent isSignedIn={false} getToken={async () => null} />;
}
export default function MarketplaceHome() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <MarketplaceHomeWithClerk /> : <MarketplaceHomeWithoutClerk />;
}
