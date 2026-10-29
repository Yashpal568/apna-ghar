"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import BrandLogo from "./BrandLogo";
import ThemePicker from "./ThemePicker";

const photos = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85",
];
const categories = [
  ["▦", "All categories", "all"], ["⌂", "Apartments & flats", "apartment"],
  ["⌂", "Villas & houses", "house"], ["⌁", "Plots & land", "plot"],
  ["▤", "Shops & offices", "commercial"], ["▧", "PG & coliving", "pg"],
];
const examples = [
  { title: "Modern family home with open living", location: "Whitefield, Bengaluru", price: "₹1.45 Cr", meta: "1,850 sq.ft", type: "house", badge: "FEATURED", detail: "3 Bed · 3 Bath", image: photos[0] },
  { title: "Bright apartment near the city", location: "HSR Layout, Bengaluru", price: "₹38,000", meta: "1,150 sq.ft", type: "apartment", badge: "FOR RENT", detail: "2 Bed · 2 Bath", image: photos[1] },
  { title: "Contemporary villa with garden", location: "Hebbal, Bengaluru", price: "₹3.20 Cr", meta: "3,400 sq.ft", type: "house", badge: "DIRECT OWNER", detail: "4 Bed · 5 Bath", image: photos[2] },
  { title: "Street-facing retail space", location: "Near Metro, Bengaluru", price: "₹85,000", meta: "950 sq.ft", type: "commercial", badge: "COMMERCIAL", detail: "Ground floor", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85" },
  { title: "Residential plot in a growing corridor", location: "North Bengaluru", price: "₹54 Lakh", meta: "1,500 sq.ft", type: "plot", badge: "PLOT / LAND", detail: "North facing", image: photos[3] },
  { title: "Minimal studio with warm interiors", location: "Koramangala, Bengaluru", price: "₹22,000", meta: "600 sq.ft", type: "apartment", badge: "FOR RENT", detail: "Move-in ready", image: photos[5] },
];

export default function MarketplaceHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [transaction, setTransaction] = useState("buy");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [filter, setFilter] = useState("All");
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const visible = examples.filter((item) => category === "all" || item.type === category);
  const searchUrl = "/search?transaction=" + transaction + (location.trim() ? "&location=" + encodeURIComponent(location.trim()) : "") + (category !== "all" ? "&type=" + category : "");

  return <main className="agh-market">
    <header className="agh-header">
      <div className="agh-header-main">
        <a className="agh-brand" href="/" aria-label="Apna Ghar home"><BrandLogo /></a>
        <form className="agh-top-search" action="/search"><span aria-hidden="true">⌕</span><input name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search city, locality, project or landmark…" /><button type="submit" aria-label="Search">⌕</button></form>
        <nav className="agh-desktop-nav" aria-label="Main navigation">
          <a className="active" href="/search">Browse properties</a><a href="/search?transaction=buy">Buy</a><a href="/search?transaction=rent">Rent</a><a href="/search?type=commercial">Commercial</a><a href="/search?type=plot">Plots</a>
        </nav>
        <div className="agh-header-actions">\n          <ThemePicker compact />
          <a className="agh-icon-link" href="/saved" aria-label="Saved homes">♡</a>
          <a className="agh-my-listings" href="/my-listings">My listings</a>
          {isSignedIn ? <button className="agh-account-btn" onClick={() => signOut({ redirectUrl: "/" })}>Sign out</button> : <a className="agh-account-btn" href="/sign-in">Sign in</a>}
          <a className="agh-sell-btn" href="/list-property"><span>＋</span> Sell property</a>
        </div>
        <button className="agh-menu-toggle" type="button" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-controls="agh-mobile-drawer" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}>{menuOpen ? "×" : "☰"}</button>
      </div>
      <div className="agh-mobile-search"><form action="/search"><span aria-hidden="true">⌕</span><input name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search city or locality…" /><button type="submit">Search</button></form></div>
      {menuOpen && <><button className="agh-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" /><nav className="agh-mobile-drawer" id="agh-mobile-drawer" aria-label="Mobile navigation">
        <div className="agh-drawer-head"><strong>Explore Apna Ghar</strong><button onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button></div>
        <a href="/">Home</a><a href="/search">Browse all properties</a><a href="/search?transaction=buy">Buy a property</a><a href="/search?transaction=rent">Rent a property</a><a href="/search?type=commercial">Commercial spaces</a><a href="/search?type=plot">Plots & land</a><a href="/saved">Saved homes</a><a href="/my-listings">My listings</a><a className="agh-drawer-sell" href="/list-property">＋ Post a property</a>
        {isSignedIn ? <button className="agh-drawer-signout" onClick={() => signOut({ redirectUrl: "/" })}>Sign out</button> : <a href="/sign-in">Sign in / Create account</a>}
      </nav></>}
    </header>

    <div className="agh-category-rail" aria-label="Property categories">{categories.map(([icon, label, value]) => <button key={value} className={category === value ? "selected" : ""} onClick={() => setCategory(value)}><span>{icon}</span>{label}{value === "all" && <b>All</b>}</button>)}</div>
    <div className="agh-filter-rail"><span className="agh-filter-label">Quick filters</span>{["Verified owner", "Zero brokerage", "Featured / urgent", "Price range", "2+ bedrooms", "Furnished", "Posted today"].map(item => <button className={filter === item ? "chosen" : ""} onClick={() => setFilter(filter === item ? "All" : item)} key={item}>{item === "Verified owner" ? "✓ " : ""}{item}</button>)}<button className="agh-clear-filter" onClick={() => { setFilter("All"); setCategory("all"); }}>Clear all</button></div>

    <section className="agh-location-bar"><div><span className="agh-location-pin">⌖</span><strong>{location.trim() || "Explore properties across India"}</strong><span className="agh-location-muted">Choose your preferred city or locality</span></div><div className="agh-location-actions"><label>Sort <select defaultValue="newest"><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label><a href="/search" aria-label="Open all listings">▦ <span>All listings</span></a></div></section>

    <section className="agh-seller-banner"><div className="agh-seller-icon">↗</div><div><span className="agh-seller-kicker">FREE SELLER · ZERO COMMISSION P2P</span><h1>Selling or renting your property?</h1><p>Post your property details and connect directly with people looking for a place to call home.</p></div><a href="/list-property">＋ Post free ad <span>↗</span></a></section>

    <section className="agh-listings-section">
      <div className="agh-listings-heading"><div><span className="agh-section-eyebrow">DISCOVER YOUR NEXT PLACE</span><h2>Homes picked for your next chapter</h2><p>Browse a few examples of the Apna Ghar property experience.</p></div><a href="/search">Browse live listings <span>↗</span></a></div>
      <div className="agh-listing-grid">{visible.map((item, index) => <article className="agh-listing-card" key={item.title}>
        <a href={searchUrl} className="agh-listing-photo" style={{ backgroundImage: "linear-gradient(180deg,rgba(5,19,40,.04),rgba(5,19,40,.58)),url('" + item.image + "')" }} aria-label={"Browse " + item.title}><span className={"agh-listing-badge badge-" + item.type}>{item.badge}</span><span className="agh-preview-badge">DESIGN PREVIEW</span><span className="agh-listing-heart" aria-hidden="true">♡</span><strong>{item.price}</strong><small>{item.meta}</small></a>
        <div className="agh-listing-info"><p className="agh-listing-location">⌖ {item.location}</p><h3>{item.title}</h3><p className="agh-listing-description">Illustrative card layout. Open live search to view currently published listings and verified details.</p><div className="agh-listing-facts"><span><small>Area</small><b>{item.meta}</b></span><span><small>Details</small><b>{item.detail}</b></span><span><small>Source</small><b>Preview</b></span></div><div className="agh-listing-actions"><a href={searchUrl}>View listings</a><a href="/search" aria-label="Find similar properties">⌕</a></div></div>
      </article>)}</div>
      <div className="agh-listings-footer"><p>Preview cards are illustrative, not published property advertisements.</p><a href="/search">View live property inventory <span>→</span></a></div>
    </section>

    <section className="agh-trust-strip"><div><strong>₹0</strong><span>Brokerage-first discovery</span></div><div><strong>Owner-led</strong><span>Connect directly where available</span></div><div><strong>Clear details</strong><span>Know what you are exploring</span></div><div><strong>One place</strong><span>Save and manage your journey</span></div></section>
    <footer className="agh-footer"><div className="agh-footer-brand"><a className="agh-brand" href="/"><span className="agh-brand-icon" aria-hidden="true">⌂</span><span className="agh-brand-word">Apna <b>Ghar</b><small>FIND A PLACE TO CALL HOME</small></span></a><p>Explore homes, apartments, plots and commercial spaces across India.</p></div><div><strong>Discover</strong><a href="/search">All properties</a><a href="/search?transaction=buy">Buy</a><a href="/search?transaction=rent">Rent</a><a href="/search?type=commercial">Commercial</a></div><div><strong>For owners</strong><a href="/list-property">Post a property</a><a href="/my-listings">Manage listings</a><a href="/saved">Saved homes</a></div><div><strong>Account & help</strong><a href="/profile">My profile</a><a href="/about">About Apna Ghar</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div><div className="agh-footer-bottom">© {new Date().getFullYear()} Apna Ghar · Property discovery made clearer.</div></footer>
  </main>;
}
