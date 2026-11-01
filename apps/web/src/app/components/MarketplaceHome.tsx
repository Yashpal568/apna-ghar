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
const heroSlides = [
  { image: "https://images.unsplash.com/photo-1600585154340-be6161a56c0a?auto=format&fit=crop&w=2560&q=95", eyebrow: "VILLA LIVING", title: <>Discover homes that<br/>make room for <em>more.</em></>, description: "Explore striking villas, spacious family homes and thoughtfully designed places to call your own." },
  { image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2560&q=95", eyebrow: "MODERN ARCHITECTURE", title: <>Find a home with<br/><em>your kind</em> of comfort.</>, description: "From contemporary architecture to welcoming interiors, find a home that fits your everyday." },
  { image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2560&q=95", eyebrow: "SPACES TO GROW", title: <>Your next chapter<br/>starts <em>at home.</em></>, description: "Browse independent houses, premium apartments and family-friendly homes across India." },
  { image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2560&q=95", eyebrow: "LUXURY INTERIORS", title: <>A place that feels<br/>like it was made <em>for you.</em></>, description: "Discover light-filled living spaces, elegant finishes and homes with room to breathe." },
  { image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=2560&q=95", eyebrow: "DESIGNED FOR LIVING", title: <>More home.<br/><em>Less in the way.</em></>, description: "Compare beautiful homes and connect directly with the owners—without brokerage." },
  { image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2560&q=95", eyebrow: "FAMILY HOMES", title: <>Room for every<br/>kind of <em>future.</em></>, description: "Find welcoming family homes, spacious layouts and neighbourhoods you will love." },
  { image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2560&q=95", eyebrow: "REFINED INTERIORS", title: <>Find spaces that<br/>inspire <em>every day.</em></>, description: "Explore beautifully finished living rooms, premium residences and considered details." },
  { image: "https://images.unsplash.com/photo-1600607687644-c7171f2b4e4f?auto=format&fit=crop&w=2560&q=95", eyebrow: "YOUR OWN ADDRESS", title: <>The right address<br/>changes <em>everything.</em></>, description: "Search independent homes and apartments, then speak with property owners directly." },
  { image: "https://images.unsplash.com/photo-1600566752368-204f8d8f7e0a?auto=format&fit=crop&w=2560&q=95", eyebrow: "CALM, COMFORTABLE LIVING", title: <>Room to unwind.<br/>Space to <em>belong.</em></>, description: "From peaceful retreats to vibrant city homes, discover a place that feels right." },
  { image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=2560&q=95", eyebrow: "CONTEMPORARY VILLAS", title: <>Make your next<br/>address feel like <em>home.</em></>, description: "Explore distinctive architecture, private outdoor spaces and thoughtfully planned homes." },
  { image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=2560&q=95", eyebrow: "INDEPENDENT HOMES", title: <>A better fit for<br/>the life you <em>lead.</em></>, description: "Find independent houses and premium residences with the space your plans deserve." },
  { image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2560&q=95", eyebrow: "VILLA COLLECTION", title: <>Meet your next<br/><em>favourite place.</em></>, description: "Discover standout villas and homes, browse real listings and connect owner to buyer." },
];

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


function HomeCategoryIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    apartments: "M4 21V5l8-3 8 3v16M8 9h2m4 0h2M8 13h2m4 0h2M8 17h2m4 0h2M2 21h20",
    houses: "M3 11 12 3l9 8M5 10v11h14V10M10 21v-6h4v6",
    plots: "m2 19 7-12 5 8 3-5 5 9H2Z",
    commercial: "M3 9h18l-2-6H5L3 9Zm1 0v11h16V9M8 20v-7h8v7M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0",
    pg: "M3 11V6m0 5h18v9H3v-9Zm0 0h5a3 3 0 0 0-5 0Zm10 9v-5h5v5",
    farmhouse: "M3 21h18M5 21V9l7-6 7 6v12M9 13h6m-6 4h6",
    "builder-floors": "M4 21V3h16v18M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-3h4v3",
    "new-projects": "M12 2 15 5l4-1 1 4 3 3-3 3-1 4-4-1-3 3-3-3-4 1-1-4-3-3 3-3 1-4 4 1 3-3Zm-3 10 2 2 4-4"
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.houses}/></svg>;
}

function MarketplaceHomeContent({ isSignedIn, getToken }: { isSignedIn: boolean; getToken: () => Promise<string | null> }) {
  const [activeTab, setActiveTab] = useState<"buy" | "rent" | "commercial" | "plots">("buy");
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setHeroIndex(index => (index + 1) % heroSlides.length), 4000); return () => window.clearInterval(timer); }, []);
  const transaction = activeTab === "rent" ? "rent" : "buy";
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
      const response = await fetchApi("/conversations/property/" + encodeURIComponent(property._id), {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Couldn't open this conversation.");
      window.location.assign("/messages?conversation=" + encodeURIComponent(body.conversationId));
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Couldn't open this conversation.");
      setContactBusy("");
    }
  }, [isSignedIn, getToken]);

  return <main className="agh-market agh-home-redesign">
    <SiteHeader active="home" searchValue={location} onSearchChange={setLocation} />

    <section className="agh-home-hero agh-stitch-hero" aria-label="Discover properties">
      <div className="agh-stitch-hero-inner">
        <div className="agh-stitch-kicker"><span>INDIA'S #1 DIRECT OWNER PORTAL</span><i/>100% Aadhaar &amp; Deed Verified</div>
        <h1>Find your dream home with <em>Zero Brokerage.</em></h1>
        <p>Connect directly with verified property owners across India. No middlemen, no spam,<br className="agh-desktop-break"/> 100% verified deeds.</p>
      </div>
    <div className="agh-home-search-panel">
        <div className="agh-home-search-top">
          <div className="agh-home-search-tabs">
            <button type="button" aria-pressed={activeTab === "buy"} className={activeTab === "buy" ? "active" : ""} onClick={() => { setActiveTab("buy"); setCategory("all"); }}>Buy</button>
            <button type="button" aria-pressed={activeTab === "rent"} className={activeTab === "rent" ? "active" : ""} onClick={() => { setActiveTab("rent"); setCategory("all"); }}>Rent</button>
            <button type="button" aria-pressed={activeTab === "commercial"} className={activeTab === "commercial" ? "active" : ""} onClick={() => { setActiveTab("commercial"); setCategory("commercial"); }}>Commercial</button>
            <button type="button" aria-pressed={activeTab === "plots"} className={activeTab === "plots" ? "active" : ""} onClick={() => { setActiveTab("plots"); setCategory("plots"); }}>Plots &amp; Land</button>
          </div>
          <span className="agh-home-search-assurance">♧ &nbsp; Listings from direct owners</span>
        </div>
        <div className="agh-home-search-fields">
          <label className="agh-home-field agh-home-field-location"><small>LOCATION / LOCALITY</small><span>⌖ <input aria-label="City or locality" value={location} onChange={event => setLocation(event.target.value)} placeholder="Enter city, area or landmark" /></span></label>
          <label className="agh-home-field"><small>PROPERTY TYPE</small><select value={category} onChange={event => { const next = event.target.value; setCategory(next); if (next === "commercial") setActiveTab("commercial"); else if (next === "plots") setActiveTab("plots"); else if (activeTab === "commercial" || activeTab === "plots") setActiveTab("buy"); }}><option value="all">All property types</option>{categories.filter(item => item.key !== "all").map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          <label className="agh-home-field"><small>BUDGET RANGE</small><select value={budget} onChange={event => setBudget(event.target.value)}><option value="any">Any budget</option><option value="50">Up to ₹50 lakh</option><option value="100">Up to ₹1 crore</option></select></label>
          <button type="button" className="agh-home-search-button" onClick={() => window.location.assign(searchUrl)}><span className="agh-home-search-button-label">Search properties</span><span className="agh-home-search-button-icon" aria-hidden="true">↗</span></button>
        </div>
        <div className="agh-home-popular"><b>POPULAR FILTERS:</b>{[{label:"Ready to move",value:"ready"},{label:"3+ BHK Only",value:"beds"},{label:"Direct From Owner",value:"owner"},{label:"Furnished",value:"furnished"},{label:"Under ₹50L",value:"budget"}].map(item => <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => { setFilter(filter === item.value ? "" : item.value); if (item.value === "budget") setBudget(budget === "50" ? "any" : "50"); }}>{item.label}</button>)}</div>
      </div>
      <div className="agh-stitch-stats">
        <div><strong>Direct</strong><small>OWNER CONNECTIONS</small></div>
        <div><strong>₹0</strong><small>MIDDLEMEN BROKERAGE</small></div>
        <div><strong>Secure</strong><small>ACCOUNT MESSAGING</small></div>
        <div><strong>Live</strong><small>PROPERTY DISCOVERY</small></div>
      </div>
    </section>


    <section className="agh-home-categories">
      <div className="agh-home-section-heading"><div><span className="agh-home-eyebrow">● &nbsp; DISCOVERY BY ARCHITECTURE</span><h2>Explore Categories</h2></div><a href="/search">All property types <span>↗</span></a></div>
      <div className="agh-home-category-grid">{categories.filter(item => item.key !== "all").slice(0,6).map(item => <button key={item.key} className={category === item.key ? "selected" : ""} onClick={() => { setCategory(item.key); document.getElementById("agh-live-properties")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span className="agh-home-category-icon"><HomeCategoryIcon name={item.key}/></span><strong>{item.label}</strong><small>Explore properties <b>→</b></small></button>)}</div>
    </section>

    <section className="agh-home-listings" id="agh-live-properties">
      <div className="agh-home-section-heading"><div><span className="agh-home-eyebrow agh-home-green-eyebrow">♧ &nbsp; ZERO BROKERAGE GUARANTEED</span><h2>Verified Direct Owner Listings</h2><p>Fresh properties posted directly by verified homeowners. Negotiate freely without agent commissions.</p></div><div className="agh-home-listing-tools"><label>SORT: <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest First</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label><a href={searchUrl}>▦ &nbsp; View all properties</a></div></div>
      {notice && <p className="agh-home-notice" role="status">{notice}</p>}
      {error && <div className="agh-home-empty" role="alert"><h3>We couldn't load live properties</h3><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
      {loading && <div className="agh-home-property-grid">{Array.from({ length: 4 }, (_, index) => <div className="agh-home-skeleton" key={index}><div /><span /><span /></div>)}</div>}
      {!loading && !error && !result?.items.length && <div className="agh-home-empty"><span>⌂</span><h3>No published properties found</h3><p>Try a different location or category, or be the first to list a property.</p><a href="/list-property">Post a property ↗</a></div>}
      {!loading && !error && !!result?.items.length && <div className="agh-home-property-grid">{result.items.slice(0,4).map((property,index) => <article className="agh-home-property-card" key={property._id}>
        <a className={"agh-home-property-image agh-home-property-image-" + (index%4)} href={"/property/" + encodeURIComponent(property.slug || property._id)} ><img className="agh-home-property-photo" src={property.imageUrls?.[0] || undefined} alt={property.title + " property"} loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} /><span className="agh-home-brokerage-tag">0% BROKERAGE</span><span className="agh-home-sale-tag">{property.listingType === "rent" ? "FOR RENT" : "FOR SALE"}</span><b aria-hidden="true">↗</b><strong>{money(property.priceAmount)}{property.listingType === "rent" ? " / mo" : ""}</strong><small>{property.areaValue} {property.areaUnit}</small></a>
        <div className="agh-home-property-content"><span className="agh-home-verified-label">✓ &nbsp; DIRECT OWNER LISTING</span><h3><a href={"/property/" + encodeURIComponent(property.slug || property._id)}>{property.title}</a></h3><p className="agh-home-property-place">⌖ {[property.location?.locality,property.location?.city,property.location?.state].filter(Boolean).join(", ") || "Location not specified"}</p><div className="agh-home-property-facts"><span>▱ {property.areaValue} {property.areaUnit}</span>{property.bedrooms != null && <span>▦ {property.bedrooms} Beds</span>}{property.bathrooms != null && <span>♧ {property.bathrooms} Baths</span>}</div><div className="agh-home-owner"><span className="agh-home-owner-avatar">{(property.contactName || "O").slice(0,1).toUpperCase()}</span><div><strong>{property.contactName || "Property owner"}</strong><small>Listed on Apna Ghar</small></div><b>Direct</b></div><div className="agh-home-card-actions">{property.contactPhone?.trim() ? <a href={"tel:" + property.contactPhone.replace(/[^+0-9]/g,"")}>☎ &nbsp; Call Owner</a> : <button disabled title="No public phone number provided">Call unavailable</button>}<button onClick={() => void contactOwner(property)} disabled={contactBusy === property._id}>▤ &nbsp; {contactBusy === property._id ? "Opening…" : "Chat"}</button></div></div>
      </article>)}</div>}
      <div className="agh-home-results-foot"><span>{result ? result.pagination.total + " published properties" : "Live marketplace inventory"}</span><a href={searchUrl}>Explore all properties →</a></div>
    </section>

    <section className="agh-home-benefits">
      <article><span className="agh-home-benefit-icon green">▣</span><b>ZERO BROKERAGE GUARANTEED</b><h3>Strict 0% Commission</h3><p>Buyers and tenants save an average of ₹2.4 Lakhs in an unbrokered commission on every home purchase.</p><small>✓ &nbsp; Zero Platform Markups</small></article>
      <article><span className="agh-home-benefit-icon blue">♢</span><b>PROPERTY CONFIDENCE</b><h3>Kaveri &amp; DigiLocker Check</h3><p>Property titles, encumbrance certificates (EC), and municipal ownership records are verified directly via state registries.</p><small>✓ &nbsp; State Registry Sync</small></article>
      <article><span className="agh-home-benefit-icon green">▣</span><b>DIRECT CONNECTION</b><h3>Encrypted Masked Calls</h3><p>Your real mobile number is never shared. Talk to owners via a private virtual number, preventing telemarketer spam forever.</p><small>✓ &nbsp; 100% Number Privacy</small></article>
      <article><span className="agh-home-benefit-icon blue">₹</span><b>SECURE TRANSACTIONS</b><h3>Protected Booking Journey</h3><p>Review property details and ownership information carefully before proceeding with a booking.</p><small>✓ &nbsp; Make informed decisions</small></article>
    </section>

    <section className="agh-home-owner-cta">
      <div className="agh-home-cta-copy"><span className="agh-home-cta-pill">♧ &nbsp; ZERO BROKERAGE FOR OWNERS</span><h2>Have a property to share?<br/>Your next connection starts here.</h2><p>Publish your property details and connect with people looking for a place to call home. No middleman calls or hidden charges.</p><div className="agh-home-cta-stats"><span><b>Direct</b><small>OWNER CONTACT</small></span><span><b>100% Free</b><small>TO GET STARTED</small></span><span><b>₹0</b><small>BROKERAGE</small></span></div></div>
      <div className="agh-home-cta-panel">
        <div className="agh-home-cta-photo" role="img" aria-label="Modern home exterior" />
        <div className="agh-home-cta-panel-content"><span>● &nbsp; DIRECT OWNER NETWORK</span><div className="agh-home-cta-house">⌂</div><h3>Direct Owner Self-Serve</h3><p>Showcase your property to people actively looking for a place to call home.</p><a href="/list-property">List your property <span aria-hidden="true">↗</span></a><small>No brokerage · No hidden charges</small></div>
      </div>
    </section>

    <footer className="agh-home-footer">
      <div className="agh-home-footer-brand"><a href="/"><BrandLogo/></a><p>India's next-generation direct marketplace connecting homeowners and buyers without middleman commissions.</p><span>✓ &nbsp; Zero Brokerage Marketplace</span></div>
      <div><strong>Top Real Estate Hubs</strong><a href="/search">Mumbai Metropolitan</a><a href="/search">Bengaluru Tech Corridors</a><a href="/search">Delhi NCR &amp; Gurgaon</a><a href="/search">Hyderabad Financial District</a><a href="/search">Pune IT Hub</a></div>
      <div><strong>Explore Properties</strong><a href="/search">Builder Floors</a><a href="/search">Ready-to-Move Apartments</a><a href="/search">Gated Community Plots</a><a href="/search">Co-working &amp; Retail</a><a href="/search">Luxury Penthouse Suites</a></div>
      <div><strong>Legal &amp; Support</strong><a href="/about">About Apna Ghar</a><a href="/privacy">Privacy Protection</a><a href="/terms">Terms of Discovery</a><a href="/messages">24×7 Support via Messages</a></div>
      <div className="agh-home-footer-bottom"><span>© {new Date().getFullYear()} Apna Ghar PropTech. All rights reserved.</span><span>VERIFIED SECURITY &nbsp; ◈ &nbsp; Secure account access</span></div>
    </footer>
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
