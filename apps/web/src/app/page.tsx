import type { Metadata } from "next";
import FeaturedProperties from "./components/FeaturedProperties";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export const metadata: Metadata = {
  title: "Find a place to call home",
  description: "Explore homes, apartments, plots and commercial properties for sale or rent across India with Apna Ghar.",
};

const categories = [
  { icon: "⌂", title: "Independent homes", copy: "Space to grow, room to belong", type: "house", count: "Homes for every chapter" },
  { icon: "▦", title: "Apartments", copy: "Connected, convenient living", type: "apartment", count: "Find your everyday" },
  { icon: "◇", title: "Villas", copy: "More room for what matters", type: "villa", count: "Room to make it yours" },
  { icon: "▱", title: "Plots & land", copy: "A place to build your future", type: "plot", count: "Start with a blank canvas" },
];

const benefits = [
  { icon: "◎", title: "Search on your terms", copy: "Filter by location, budget and property type to focus on what matters to you." },
  { icon: "↗", title: "Details up front", copy: "Review the price, area, photos and listing information before you reach out." },
  { icon: "⌂", title: "Your journey, in one place", copy: "Keep track of saved homes and manage the properties you publish." },
];

export default function HomePage() {
  return <main className="ag-home">
    <SiteHeader active="home" />

    <section className="ag-home-hero">
      <div className="ag-home-hero-image" aria-hidden="true" />
      <div className="ag-home-hero-shade" aria-hidden="true" />
      <div className="ag-home-hero-content page-shell">
        <div className="ag-home-hero-copy">
          <span className="ag-home-kicker"><span /> A better way to find your place</span>
          <h1>Find a place.<br /><em>Find your belonging.</em></h1>
          <p>From your first home to your next big move, discover places that fit your life, your plans and your budget.</p>
          <div className="ag-home-hero-actions">
            <a className="button button-primary" href="/search">Explore properties <span aria-hidden="true">↗</span></a>
            <a className="ag-home-hero-secondary" href="/list-property">List your property</a>
          </div>
          <div className="ag-home-trust-points"><span><b>✓</b> Clear listing details</span><span><b>✓</b> Search that fits you</span></div>
        </div>
      </div>
      <form action="/search" className="ag-home-search page-shell" role="search">
        <div className="ag-home-search-tabs" aria-label="Transaction type">
          <label><input type="radio" name="transaction" value="buy" defaultChecked /> Buy</label>
          <label><input type="radio" name="transaction" value="rent" /> Rent</label>
        </div>
        <div className="ag-home-search-fields">
          <label className="ag-home-search-field"><span>Location</span><input name="location" placeholder="City, neighbourhood or PIN code" /></label>
          <label className="ag-home-search-field"><span>Property type</span><select name="type" defaultValue="any"><option value="any">All property types</option><option value="house">Independent home</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="plot">Plot &amp; land</option></select></label>
          <label className="ag-home-search-field"><span>Maximum budget</span><select name="maxPrice" defaultValue=""><option value="">Any budget</option><option value="2500000">Up to ₹25 lakh</option><option value="5000000">Up to ₹50 lakh</option><option value="10000000">Up to ₹1 crore</option><option value="50000000">Up to ₹5 crore</option></select></label>
          <button className="button button-primary" type="submit"><span aria-hidden="true">⌕</span> Search homes</button>
        </div>
      </form>
    </section>

    <section className="ag-home-section page-shell" id="categories">
      <div className="ag-home-section-heading">
        <div><span className="ag-home-section-kicker">A PLACE FOR EVERY PLAN</span><h2>What does home look like <em>to you?</em></h2><p>Start with the kind of space you have in mind.</p></div>
        <a className="ag-home-text-link" href="/search">Explore all properties <span aria-hidden="true">↗</span></a>
      </div>
      <div className="ag-home-category-grid">{categories.map((category, index) => <a className={`ag-home-category ag-home-category-${index + 1}`} href={`/search?type=${category.type}`} key={category.type}>
        <span className="ag-home-category-art" aria-hidden="true"><span>{category.icon}</span></span>
        <span className="ag-home-category-copy"><small>{category.count}</small><strong>{category.title}</strong><span>{category.copy}</span></span>
        <span className="ag-home-category-arrow" aria-hidden="true">↗</span>
      </a>)}</div>
    </section>

    <section className="ag-home-featured">
      <div className="page-shell">
        <div className="ag-home-section-heading">
          <div><span className="ag-home-section-kicker">ROOM TO DISCOVER</span><h2>Places worth a closer look.</h2><p>Explore the latest properties shared on Apna Ghar.</p></div>
          <a className="ag-home-text-link" href="/search">View all listings <span aria-hidden="true">↗</span></a>
        </div>
        <FeaturedProperties />
      </div>
    </section>

    <section className="ag-home-about page-shell" id="about">
      <div className="ag-home-about-visual" role="img" aria-label="Contemporary home surrounded by greenery"><div className="ag-home-about-note"><span>YOUR NEXT CHAPTER</span><strong>Starts with the right place.</strong></div></div>
      <div className="ag-home-about-copy"><span className="ag-home-section-kicker">A MORE THOUGHTFUL PROPERTY JOURNEY</span><h2>Finding a home should feel <em>clearer.</em></h2><p>Property decisions are big decisions. Apna Ghar brings property discovery, useful listing details and your saved homes into one straightforward experience.</p><p>Explore at your pace, compare what matters and take the next step when you feel ready.</p><a className="button button-primary" href="/about">Get to know Apna Ghar <span aria-hidden="true">↗</span></a></div>
    </section>

    <section className="ag-home-benefits">
      <div className="page-shell">
        <div className="ag-home-section-heading"><div><span className="ag-home-section-kicker">MADE AROUND YOU</span><h2>A simpler way to move forward.</h2><p>Useful tools and clear information, without the noise.</p></div></div>
        <div className="ag-home-benefit-grid">{benefits.map((benefit) => <article className="ag-home-benefit" key={benefit.title}><span className="ag-home-benefit-icon" aria-hidden="true">{benefit.icon}</span><h3>{benefit.title}</h3><p>{benefit.copy}</p></article>)}</div>
      </div>
    </section>

    <section className="ag-home-owner page-shell"><div className="ag-home-owner-mark" aria-hidden="true">⌂</div><div className="ag-home-owner-copy"><span className="ag-home-section-kicker">HAVE A PROPERTY TO SHARE?</span><h2>Your next connection could start here.</h2><p>Publish your property details and help the right people discover your space.</p></div><a className="button ag-home-owner-button" href="/list-property">Post a property <span aria-hidden="true">↗</span></a></section>

    <section className="ag-home-bottom-cta"><div className="page-shell ag-home-bottom-cta-inner"><div><span className="ag-home-section-kicker">YOUR NEXT CHAPTER IS OUT THERE</span><h2>Let’s find your place.</h2><p>Start exploring homes and spaces that make sense for you.</p></div><a className="button button-primary" href="/search">Explore Apna Ghar <span aria-hidden="true">↗</span></a></div></section>
    <SiteFooter />
  </main>;
}
