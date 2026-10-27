import ThemePicker from "./components/ThemePicker";

const categories = [
  { icon: "⌂", title: "Independent homes", copy: "Space to grow, room to belong", type: "house" },
  { icon: "▦", title: "Apartments", copy: "Smart living in connected places", type: "apartment" },
  { icon: "◇", title: "Villas", copy: "A little more room for life", type: "villa" },
  { icon: "▱", title: "Plots & land", copy: "Start with a place of your own", type: "plot" },
];

const homes = [
  { id: "sample-1", kind: "Apartment · For sale", title: "Cedar Grove Residences", location: "Whitefield, Bengaluru", price: "₹1.28 Cr", meta: "3 BHK · 1,650 sq ft · Ready to move", art: "home-art-blue", tag: "New listing" },
  { id: "sample-2", kind: "Independent house · For sale", title: "Indiranagar Garden Home", location: "Indiranagar, Bengaluru", price: "₹1.85 Cr", meta: "3 BHK · 1,780 sq ft · Ready to move", art: "home-art-green", tag: "Owner listed" },
  { id: "sample-3", kind: "Plot · For sale", title: "Whitefield Residential Plot", location: "Whitefield, Bengaluru", price: "₹86 L", meta: "1,200 sq ft · Residential plot", art: "home-art-sand", tag: "Explore" },
];

export default function HomePage() {
  return <main>
    <header className="site-header page-shell">
      <a className="brand" href="/" aria-label="Apna Ghar home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48" role="img"><rect x="1" y="1" width="46" height="46" rx="12" fill="#e8f6f1"/><path d="M8 23 24 10l16 13" fill="none" stroke="#087f70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 21v16h22V21M21 37V26h7v11" fill="none" stroke="#087f70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="brand-name">Apna <b>Ghar</b></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="/search">Buy a home</a><a href="/search?type=rent">Rent</a><a href="/list-property">List property</a></nav>
      <div className="header-actions"><ThemePicker compact /><a className="button button-quiet sign-in" href="/sign-in">Sign in</a><a className="button button-primary" href="/list-property">Post a property <span aria-hidden="true">↗</span></a></div>
    </header>

    <section className="hero-wrap page-shell">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> Made for your life in Bengaluru</div>
        <h1>More than a place.<br/><em>Your place.</em></h1>
        <p className="hero-description">Discover homes, explore neighbourhoods and connect directly with owners.</p>
        <div className="hero-proof"><span className="proof-icon">✓</span><span>Details you can trust</span><span className="proof-divider"/><span>People, not middlemen</span></div>
      </div>
      <div className="hero-art" aria-label="Illustration of a modern home">
        <div className="art-sun"/><div className="art-hill art-hill-back"/><div className="art-hill art-hill-front"/>
        <div className="art-house"><div className="art-roof"/><div className="art-house-body"><div className="art-window window-one"/><div className="art-window window-two"/><div className="art-door"/></div></div>
        <div className="art-plant plant-one"/><div className="art-plant plant-two"/><div className="art-caption"><span className="caption-dot"/> A place to call yours</div>
      </div>
      <form action="/search" className="search-card">
        <div className="search-field"><label htmlFor="transaction">I’m looking to</label><select id="transaction" name="transaction" defaultValue="buy"><option value="buy">Buy</option><option value="rent">Rent</option></select></div>
        <div className="search-field"><label htmlFor="location">Location</label><input id="location" name="location" placeholder="Bengaluru · Locality or project"/></div>
        <div className="search-field"><label htmlFor="property-type">Property type</label><select id="property-type" name="type" defaultValue="any"><option value="any">Property type</option><option value="house">Independent house</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="plot">Plot / land</option></select></div>
        <button className="button button-primary search-submit" type="submit"><span aria-hidden="true">⌕</span> Search homes</button>
      </form>
    </section>

    <section className="section page-shell" id="explore">
      <div className="section-heading"><div><p className="eyebrow">EVERY KIND OF HOME</p><h2>Every kind of you.</h2><p className="section-subtitle">Apartments, independent homes, plots and new projects.</p></div><a className="text-link" href="/search">Explore all <span>↗</span></a></div>
      <div className="category-grid">{categories.map((category) => <a className="category-card" key={category.type} href={`/search?type=${category.type}`}><span className="category-icon">{category.icon}</span><h3>{category.title}</h3><p>{category.copy}</p><span className="category-arrow">↗</span></a>)}</div>
    </section>

    <section className="featured-section">
      <div className="page-shell">
        <div className="section-heading"><div><p className="eyebrow">A PLACE TO BEGIN</p><h2>Good homes. Great possibilities.</h2><p className="section-subtitle">Concept preview · Fictional listings and illustrative data.</p></div><a className="text-link" href="/search">See all properties <span>↗</span></a></div>
        <div className="property-grid">{homes.map((home) => <article className="property-card" key={home.id}><a href={`/property/${home.id}`} className={`property-art ${home.art}`} aria-label={`View ${home.title}`}><span className="property-tag">{home.tag}</span><span className="property-art-shape shape-a"/><span className="property-art-shape shape-b"/><span className="property-art-shape shape-c"/></a><div className="property-info"><p className="property-kind">{home.kind}</p><h3><a href={`/property/${home.id}`}>{home.title}</a></h3><p className="property-location"><span aria-hidden="true">⌖</span> {home.location}</p><p className="property-meta">{home.meta}</p><div className="property-bottom"><strong>{home.price}</strong><a className="round-arrow" href={`/property/${home.id}`} aria-label={`View details for ${home.title}`}>↗</a></div></div></article>)}</div>
      </div>
    </section>

    <section className="owner-banner page-shell"><div className="owner-mark">↗</div><div><p className="eyebrow">YOUR PROPERTY, YOUR WAY</p><h2>Have a place to share?</h2><p>Reach people looking for a place just like yours.</p></div><a className="button button-light" href="/list-property">List your property <span>↗</span></a></section>
    <footer className="site-footer page-shell"><a className="footer-brand" href="/">Apna <b>Ghar</b></a><span>Thoughtful search. Better decisions.</span><div><a href="/about">About</a><a href="/safety">Trust & safety</a><a href="/privacy">Privacy</a></div><small>© {new Date().getFullYear()} Apna Ghar. Sample content is illustrative.</small></footer>
  </main>;
}