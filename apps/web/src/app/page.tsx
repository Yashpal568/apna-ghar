import ThemePicker from "./components/ThemePicker";

const categories = [
  { icon: "⌂", title: "Independent homes", copy: "Space to grow, room to belong", type: "house" },
  { icon: "▦", title: "Apartments", copy: "Smart living in connected places", type: "apartment" },
  { icon: "◇", title: "Villas", copy: "A little more room for life", type: "villa" },
  { icon: "▱", title: "Plots & land", copy: "Start with a place of your own", type: "plot" },
];

const homes = [
  { id: "sample-1", kind: "Apartment · For sale", title: "Sunlit 3 BHK apartment", location: "Sector 62, Noida", price: "₹1.24 Cr", meta: "3 beds · 2 baths · 1,420 sq ft", art: "home-art-blue", tag: "New listing" },
  { id: "sample-2", kind: "Independent house · For sale", title: "A calmer kind of home", location: "Indirapuram, Ghaziabad", price: "₹98 L", meta: "3 beds · 3 baths · 1,850 sq ft", art: "home-art-green", tag: "Owner listed" },
  { id: "sample-3", kind: "Plot · For sale", title: "Room to build your future", location: "Greater Noida West", price: "₹42 L", meta: "1,200 sq ft · Residential plot", art: "home-art-sand", tag: "Explore" },
];

export default function HomePage() {
  return <main>
    <header className="site-header page-shell">
      <a className="brand" href="/" aria-label="Apna Ghar home"><span className="brand-placeholder">INSERT APPROVED APNA GHAR LOGO ASSET</span><span className="brand-name">Apna <b>Ghar</b></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="/search">Buy a home</a><a href="/search?type=rent">Rent</a><a href="/list-property">List property</a></nav>
      <div className="header-actions"><ThemePicker compact /><a className="button button-quiet sign-in" href="/sign-in">Sign in</a><a className="button button-primary" href="/list-property">Post a property <span aria-hidden="true">↗</span></a></div>
    </header>

    <section className="hero-wrap page-shell">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> A better way to find your place</div>
        <h1>Somewhere you<br/>can <em>just be.</em></h1>
        <p className="hero-description">Find a home that fits your life, not just your checklist. Explore properties with clarity and confidence.</p>
        <div className="hero-proof"><span className="proof-icon">✓</span><span>Made for real home decisions</span><span className="proof-divider"/><span>Built for India</span></div>
      </div>
      <div className="hero-art" aria-label="Illustration of a modern home">
        <div className="art-sun"/><div className="art-hill art-hill-back"/><div className="art-hill art-hill-front"/>
        <div className="art-house"><div className="art-roof"/><div className="art-house-body"><div className="art-window window-one"/><div className="art-window window-two"/><div className="art-door"/></div></div>
        <div className="art-plant plant-one"/><div className="art-plant plant-two"/><div className="art-caption"><span className="caption-dot"/> A place to call yours</div>
      </div>
      <form action="/search" className="search-card">
        <div className="search-field"><label htmlFor="transaction">I’m looking to</label><select id="transaction" name="transaction" defaultValue="buy"><option value="buy">Buy a property</option><option value="rent">Rent a property</option></select></div>
        <div className="search-field"><label htmlFor="location">Location</label><input id="location" name="location" placeholder="City, neighbourhood or PIN code"/></div>
        <div className="search-field"><label htmlFor="property-type">Property type</label><select id="property-type" name="type" defaultValue="any"><option value="any">All property types</option><option value="house">Independent house</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="plot">Plot / land</option></select></div>
        <button className="button button-primary search-submit" type="submit"><span aria-hidden="true">⌕</span> Find homes</button>
      </form>
    </section>

    <section className="section page-shell" id="explore">
      <div className="section-heading"><div><p className="eyebrow">START WITH WHAT MATTERS</p><h2>Find your kind of place.</h2><p className="section-subtitle">A little inspiration for the next chapter.</p></div><a className="text-link" href="/search">Explore all <span>↗</span></a></div>
      <div className="category-grid">{categories.map((category) => <a className="category-card" key={category.type} href={`/search?type=${category.type}`}><span className="category-icon">{category.icon}</span><h3>{category.title}</h3><p>{category.copy}</p><span className="category-arrow">↗</span></a>)}</div>
    </section>

    <section className="featured-section">
      <div className="page-shell">
        <div className="section-heading"><div><p className="eyebrow">A PLACE TO BEGIN</p><h2>Homes worth a closer look.</h2><p className="section-subtitle">Illustrative sample listings — live inventory is not connected yet.</p></div><a className="text-link" href="/search">See all properties <span>↗</span></a></div>
        <div className="property-grid">{homes.map((home) => <article className="property-card" key={home.id}><a href={`/property/${home.id}`} className={`property-art ${home.art}`} aria-label={`View ${home.title}`}><span className="property-tag">{home.tag}</span><span className="property-art-shape shape-a"/><span className="property-art-shape shape-b"/><span className="property-art-shape shape-c"/></a><div className="property-info"><p className="property-kind">{home.kind}</p><h3><a href={`/property/${home.id}`}>{home.title}</a></h3><p className="property-location"><span aria-hidden="true">⌖</span> {home.location}</p><p className="property-meta">{home.meta}</p><div className="property-bottom"><strong>{home.price}</strong><a className="round-arrow" href={`/property/${home.id}`} aria-label={`View details for ${home.title}`}>↗</a></div></div></article>)}</div>
      </div>
    </section>

    <section className="owner-banner page-shell"><div className="owner-mark">↗</div><div><p className="eyebrow">YOUR PROPERTY, YOUR WAY</p><h2>Have a place to share?</h2><p>Reach people looking for a place just like yours.</p></div><a className="button button-light" href="/list-property">List your property <span>↗</span></a></section>
    <footer className="site-footer page-shell"><a className="footer-brand" href="/">Apna <b>Ghar</b></a><span>Thoughtful search. Better decisions.</span><div><a href="/about">About</a><a href="/safety">Trust & safety</a><a href="/privacy">Privacy</a></div><small>© {new Date().getFullYear()} Apna Ghar. Sample content is illustrative.</small></footer>
  </main>;
}