import type { Metadata } from "next";
import FeaturedProperties from "./components/FeaturedProperties";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export const metadata: Metadata = {
  title: "Apna Ghar — Buy, rent and discover property",
  description: "Discover homes, apartments, plots and commercial properties for sale and rent across India. Search listings and publish your property on Apna Ghar.",
};

const categories = [
  { icon: "⌂", title: "Houses & apartments", description: "Homes for sale", type: "house", transaction: "buy" },
  { icon: "▦", title: "Rent a home", description: "Houses & apartments", type: "apartment", transaction: "rent" },
  { icon: "◇", title: "Plots & land", description: "Find a place to build", type: "plot", transaction: "buy" },
  { icon: "▤", title: "Shops & offices", description: "Commercial property", type: "commercial", transaction: "buy" },
];

const steps = [
  { number: "01", title: "Search nearby", copy: "Choose a city or locality and narrow the results by budget and property type." },
  { number: "02", title: "Compare listings", copy: "Review photos, price, area and details shared by the property owner." },
  { number: "03", title: "Connect directly", copy: "Save places you like and take the next step when you’re ready." },
];

export default function HomePage() {
  return <main className="ag-home ag-marketplace-home">
    <SiteHeader active="home" />
    <section className="ag-marketplace-search-band">
      <div className="page-shell">
        <div className="ag-marketplace-intro">
          <span className="ag-home-section-kicker">YOUR PROPERTY SEARCH STARTS HERE</span>
          <h1>Find a home that fits <em>your life.</em></h1>
          <p>Buy, rent or list a property — all in one place.</p>
        </div>
        <div className="ag-marketplace-search-card">
          <div className="ag-marketplace-transaction-tabs" aria-label="Property transaction">
            <a className="is-selected" href="/search?transaction=buy">Buy</a>
            <a href="/search?transaction=rent">Rent</a>
            <a href="/search?type=plot">Plots &amp; land</a>
            <a href="/search?type=commercial">Commercial</a>
          </div>
          <form action="/search" className="ag-marketplace-search-form" role="search">
            <label><span>City or locality</span><input name="location" placeholder="Enter city, neighbourhood or PIN code" /></label>
            <label><span>Property type</span><select name="type" defaultValue="all property types"><option value="all property types">All property types</option><option value="house">Independent house</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="plot">Plot / land</option></select></label>
            <label><span>Maximum budget</span><select name="maxPrice" defaultValue=""><option value="">Any budget</option><option value="2500000">Up to ₹25 lakh</option><option value="5000000">Up to ₹50 lakh</option><option value="10000000">Up to ₹1 crore</option><option value="50000000">Up to ₹5 crore</option></select></label>
            <input type="hidden" name="transaction" value="buy" />
            <button className="button button-primary" type="submit"><span aria-hidden="true">⌕</span> Search properties</button>
          </form>
          <div className="ag-marketplace-search-foot"><span><b>✓</b> Browse at your pace</span><span><b>✓</b> Save listings you like</span><span><b>✓</b> Post your property</span></div>
        </div>
      </div>
    </section>

    <section className="page-shell ag-marketplace-categories">
      <div className="ag-marketplace-section-heading"><div><span className="ag-home-section-kicker">EXPLORE BY CATEGORY</span><h2>What are you looking for?</h2><p>Start with the kind of property that works for you.</p></div><a href="/search" className="ag-home-text-link">All properties <span aria-hidden="true">↗</span></a></div>
      <div className="ag-marketplace-category-grid">{categories.map((category,index)=><a className={`ag-marketplace-category ag-marketplace-category-${index+1}`} href={`/search?transaction=${category.transaction}&type=${category.type}`} key={category.title}><span className="ag-marketplace-category-icon" aria-hidden="true">{category.icon}</span><span className="ag-marketplace-category-title">{category.title}</span><span className="ag-marketplace-category-description">{category.description}</span><span className="ag-marketplace-category-arrow" aria-hidden="true">↗</span></a>)}</div>
    </section>

    <section className="ag-marketplace-listings"><div className="page-shell"><div className="ag-marketplace-section-heading"><div><span className="ag-home-section-kicker">FRESH ON APNA GHAR</span><h2>Recently listed properties</h2><p>Explore listings shared by property owners.</p></div><a href="/search" className="ag-home-text-link">View all listings <span aria-hidden="true">↗</span></a></div><FeaturedProperties /></div></section>

    <section className="page-shell ag-marketplace-how"><div className="ag-marketplace-how-heading"><span className="ag-home-section-kicker">SIMPLE FROM THE START</span><h2>Find it. Compare it. Make your move.</h2><p>A straightforward property journey, from your first search to your next step.</p></div><div className="ag-marketplace-steps">{steps.map(step=><article key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div></section>

    <section className="ag-marketplace-sell"><div className="page-shell ag-marketplace-sell-inner"><div className="ag-marketplace-sell-icon" aria-hidden="true">⌂</div><div><span className="ag-home-section-kicker">HAVE A PROPERTY TO LIST?</span><h2>Put your property in front of the right people.</h2><p>Add your listing details and photos to help interested people discover your property.</p></div><a className="button ag-marketplace-sell-button" href="/list-property">+ Post property</a></div></section>

    <section className="ag-marketplace-app-promo"><div className="page-shell ag-marketplace-app-inner"><div className="ag-marketplace-app-art" aria-hidden="true"><div className="ag-marketplace-phone"><span>⌂</span><b>Apna Ghar</b><i>Find your place.</i><div>⌕ &nbsp; Search properties</div><div className="ag-marketplace-phone-card" /></div></div><div><span className="ag-home-section-kicker">APNA GHAR, ON THE GO</span><h2>Your property search goes wherever you do.</h2><p>Explore listings and manage your property journey from your phone. The Apna Ghar mobile app will be available through the official app stores when published.</p><div className="ag-marketplace-app-actions"><a className="button button-primary" href="/search">Explore on web ↗</a><span className="ag-marketplace-store-note">Mobile app download link will appear here after Play Store release.</span></div></div></div></section>
    <SiteFooter />
  </main>;
}
