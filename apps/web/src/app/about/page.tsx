import type { Metadata } from "next";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "About Apna Ghar",
  description: "Learn about Apna Ghar and our approach to making property discovery clearer and more accessible.",
};

export default function AboutPage() {
  return <main className="ag-info-page">
    
    <section className="ag-info-hero"><div className="page-shell"><span className="ag-home-section-kicker">ABOUT APNA GHAR</span><h1>A place to begin<br/><em>your next chapter.</em></h1><p>We’re building a more thoughtful way to discover property — with useful details, a clearer search journey and the freedom to explore at your own pace.</p><a className="button button-primary" href="/search">Explore properties ↗</a></div></section>
    <section className="page-shell ag-info-intro"><div><span className="ag-home-section-kicker">OUR PURPOSE</span><h2>Property decisions deserve clarity.</h2></div><div><p>Finding a home, renting a space or publishing a property is a meaningful step. Apna Ghar brings discovery and listing tools together so people can compare available information and decide what to do next with greater confidence.</p><p>We believe the experience should be straightforward: explore listings, review the details, save the places that interest you and connect when you’re ready.</p></div></section>
    <section className="ag-info-values"><div className="page-shell"><span className="ag-home-section-kicker">WHAT GUIDES US</span><h2>Built around the people using it.</h2><div className="ag-info-value-grid"><article><span>01</span><h3>Clarity first</h3><p>Present property details in a way that is easy to review and compare.</p></article><article><span>02</span><h3>Useful by design</h3><p>Keep search, saved homes and property publishing straightforward.</p></article><article><span>03</span><h3>Trust through transparency</h3><p>Make it clear that listing information should be checked before making commitments.</p></article></div></div></section>
    <section className="page-shell ag-info-cta"><div><h2>Your next place could be closer than you think.</h2><p>Start with what matters to you and explore at your own pace.</p></div><a className="button button-primary" href="/search">Find properties ↗</a></section>
    <SiteFooter />
  </main>;
}
