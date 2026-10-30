import type { Metadata } from "next";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Property services",
  description: "Explore Apna Ghar tools for buying, renting and publishing property listings.",
};

const services = [
  { number: "01", icon: "⌂", title: "Buy a property", copy: "Explore available listings, compare locations and prices, and review the details that help you narrow down your options.", href: "/search?transaction=buy", action: "Explore homes" },
  { number: "02", icon: "↗", title: "Sell or list a property", copy: "Share your property details and photos so people searching for a place can discover your listing.", href: "/list-property", action: "List your property" },
  { number: "03", icon: "⌑", title: "Rent a home", copy: "Browse homes and apartments for rent, with listing details to help you compare the options available.", href: "/search?transaction=rent", action: "Find rentals" },
  { number: "04", icon: "♡", title: "Save your shortlist", copy: "Keep properties you’re interested in together so you can return to them as you continue your search.", href: "/saved", action: "View saved homes" },
];

export default function ServicesPage() {
  return <main className="ag-info-page">
    
    <section className="ag-info-hero ag-info-hero-services"><div className="page-shell"><span className="ag-home-section-kicker">PROPERTY, MADE MORE STRAIGHTFORWARD</span><h1>One place to explore.<br/><em>More ways to move.</em></h1><p>Whether you’re searching for a home, comparing rental options or publishing a property, start with the tools that fit your next step.</p><a className="button button-primary" href="/search">Explore the marketplace ↗</a></div></section>
    <section className="page-shell ag-services-list"><div className="ag-info-section-title"><span className="ag-home-section-kicker">EXPLORE WHAT YOU CAN DO</span><h2>Tools for every step.</h2><p>Choose a starting point and continue when you’re ready.</p></div><div className="ag-services-grid">{services.map(item=><article className="ag-service-card" key={item.number}><div className="ag-service-top"><span className="ag-service-icon">{item.icon}</span><span>{item.number}</span></div><h3>{item.title}</h3><p>{item.copy}</p><a href={item.href}>{item.action} <span aria-hidden="true">↗</span></a></article>)}</div></section>
    <section className="ag-info-cta-wrap"><div className="page-shell ag-info-cta"><div><h2>Ready to take the next step?</h2><p>Start exploring properties on Apna Ghar.</p></div><a className="button button-primary" href="/search">Search properties ↗</a></div></section>
    <SiteFooter />
  </main>;
}
