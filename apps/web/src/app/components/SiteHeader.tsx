"use client";

import { useState } from "react";
import BrandLogo from "./BrandLogo";
import ThemePicker from "./ThemePicker";

export default function SiteHeader({active="home"}:{active?:string}) {
  const [menuOpen,setMenuOpen]=useState(false);
  const [query,setQuery]=useState("");
  return <header className="ag-site-header">
    <div className="ag-header-inner">
      <a className="ag-brand" href="/" aria-label="Apna Ghar home"><BrandLogo/></a>
      <nav className="ag-main-nav" aria-label="Main navigation">
        <a className={active==="buy"?"is-active":""} href="/search?transaction=buy">Buy</a>
        <a className={active==="rent"?"is-active":""} href="/search?transaction=rent">Rent</a>
        <a className={active==="search"?"is-active":""} href="/search">Explore</a>
        <a className={active==="saved"?"is-active":""} href="/saved">Saved homes</a>
      </nav>
      <form className="ag-header-search" action="/search" role="search">
        <span aria-hidden="true">⌕</span><input name="location" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search city, locality or project" aria-label="Search city, locality or project"/><button type="submit">Search</button>
      </form>
      <div className="ag-header-actions"><ThemePicker compact/><a className="ag-signin-link" href="/sign-in">Sign in</a><a className="ag-signup-link" href="/sign-up">Sign up</a><a className="ag-account-link" href="/profile">My account</a><a className="button button-primary ag-post-button" href="/list-property">Post property <span aria-hidden="true">↗</span></a></div>
      <button className="ag-mobile-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen?"Close navigation":"Open navigation"} onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"✕":"☰"}</button>
    </div>
    {menuOpen&&<div className="ag-mobile-menu"><a href="/search?transaction=buy">Buy a home</a><a href="/search?transaction=rent">Rent a home</a><a href="/search">Explore properties</a><a href="/saved">Saved homes</a><a href="/my-listings">My listings</a><a href="/sign-in">Sign in</a><a href="/sign-up">Create account</a><a href="/profile">My account</a><a className="button button-primary" href="/list-property">Post a property ↗</a></div>}
  </header>;
}
