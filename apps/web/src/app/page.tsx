import BrandLogo from "./components/BrandLogo";
import ThemePicker from "./components/ThemePicker";
import FeaturedProperties from "./components/FeaturedProperties";

const categories = [
  { icon: "⌂", title: "Independent homes", copy: "Space to grow, room to belong", type: "house" },
  { icon: "▦", title: "Apartments", copy: "Smart living in connected places", type: "apartment" },
  { icon: "◇", title: "Villas", copy: "A little more room for life", type: "villa" },
  { icon: "▱", title: "Plots & land", copy: "Start with a place of your own", type: "plot" },
];



export default function HomePage() {
  return <main>
    <header className="site-header page-shell">
      <a className="brand" href="/" aria-label="Apna Ghar home"><BrandLogo /></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="/search">Buy a home</a><a href="/search?transaction=rent">Rent</a><a href="/list-property">List property</a></nav>
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
        <div className="section-heading"><div><p className="eyebrow">A PLACE TO BEGIN</p><h2>Good homes. Great possibilities.</h2><p className="section-subtitle">Recently published · Live marketplace listings.</p></div><a className="text-link" href="/search">See all properties <span>↗</span></a></div>
        <FeaturedProperties />
      </div>
    </section>

    <section className="owner-banner page-shell"><div className="owner-mark">↗</div><div><p className="eyebrow">YOUR PROPERTY, YOUR WAY</p><h2>Have a place to share?</h2><p>Reach people looking for a place just like yours.</p></div><a className="button button-light" href="/list-property">List your property <span>↗</span></a></section>
    <footer className="site-footer page-shell"><a className="footer-brand" href="/">Apna <b>Ghar</b></a><span>Thoughtful search. Better decisions.</span><div><a href="/about">About</a><a href="/safety">Trust & safety</a><a href="/privacy">Privacy</a></div><small>© {new Date().getFullYear()} Apna Ghar.</small></footer>
  </main>;
}