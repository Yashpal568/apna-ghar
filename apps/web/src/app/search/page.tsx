import type { Metadata } from "next";
import ThemePicker from "../components/ThemePicker";
import PropertySearchResults from "../components/PropertySearchResults";

export const metadata: Metadata = { title: "Explore properties", description: "Explore property types and locations on Apna Ghar." };

export default function SearchPage({ searchParams }: { searchParams: { location?: string; type?: string; transaction?: string } }) {
  const location = searchParams.location?.trim();
  const type = searchParams.type && searchParams.type !== "any" ? searchParams.type : "all property types";
  const transaction = searchParams.transaction === "rent" ? "rent" : "buy";
  return <main className="page-shell interior-page">
    <header className="site-header interior-header"><a className="brand" href="/"><span className="brand-placeholder">INSERT APPROVED APNA GHAR LOGO ASSET</span><span className="brand-name">Apna <b>Ghar</b></span></a><nav className="desktop-nav"><a href="/search">Explore</a><a href="/list-property">List property</a></nav><div className="header-actions"><ThemePicker compact/><a className="button button-primary" href="/sign-in">Sign in</a></div></header>
    <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>Explore properties</span></div>
    <section className="search-page-heading"><p className="eyebrow">YOUR SEARCH, YOUR PACE</p><h1>Find the place<br/>that feels <em>right.</em></h1><p>Browse with a clear head. Compare the details that matter to you.</p></section>
    <form action="/search" className="search-card search-page-form"><div className="search-field"><label htmlFor="location">Location</label><input id="location" name="location" defaultValue={location} placeholder="City, area or PIN code"/></div><div className="search-field"><label htmlFor="transaction">Looking to</label><select id="transaction" name="transaction" defaultValue={transaction}><option value="buy">Buy</option><option value="rent">Rent</option></select></div><div className="search-field"><label htmlFor="type">Property type</label><select id="type" name="type" defaultValue={type}><option value="all property types">All types</option><option value="house">Independent house</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="plot">Plot / land</option></select></div><button className="button button-primary" type="submit">Update search ↗</button></form>
    <PropertySearchResults location={location} transaction={transaction} category={type} />
    <footer className="simple-footer">Apna Ghar · Live property search</footer>
  </main>;
}