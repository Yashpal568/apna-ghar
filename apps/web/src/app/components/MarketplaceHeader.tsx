"use client";
import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";
import ThemePicker from "./ThemePicker";
type Props = { active?: string; isSignedIn?: boolean; signOut?: (options: { redirectUrl: string }) => Promise<void>; searchValue?: string; onSearchChange?: (value: string) => void };
export default function MarketplaceHeader({ active="home", isSignedIn=false, signOut=async()=>undefined, searchValue, onSearchChange }: Props) {
 const [menuOpen,setMenuOpen]=useState(false),[query,setQuery]=useState("");
 const value=searchValue ?? query, setValue=onSearchChange ?? setQuery;
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setMenuOpen(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[]);
 return <div className="agh-market-header-scope"><header className="agh-header"><div className="agh-header-main">
 <a className="agh-brand" href="/" aria-label="Apna Ghar home"><BrandLogo/></a>
 <form className="agh-top-search" action="/search"><span aria-hidden="true">⌕</span><input name="location" value={value} onChange={e=>setValue(e.target.value)} placeholder="Search city, locality, project or landmark…"/><button type="submit" aria-label="Search">⌕</button></form>
 <nav className="agh-desktop-nav" aria-label="Main navigation"><a className={active==="search"||active==="home"?"active":""} href="/search">Browse properties</a><a className={active==="buy"?"active":""} href="/search?transaction=buy">Buy</a><a className={active==="rent"?"active":""} href="/search?transaction=rent">Rent</a><a href="/search?type=commercial">Commercial</a><a href="/search?type=plot">Plots</a><a href="/messages">Messages</a></nav>
 <div className="agh-header-actions"><ThemePicker compact/><a className="agh-icon-link" href="/saved" aria-label="Saved homes">♡</a><a className="agh-my-listings" href="/my-listings">My listings</a>{isSignedIn?<button className="agh-account-btn" onClick={()=>void signOut({redirectUrl:"/"})}>Sign out</button>:<a className="agh-account-btn" href="/sign-in">Sign in</a>}<a className="agh-sell-btn agh-post-btn" href="/list-property"><span aria-hidden="true">＋</span><span>Post</span></a></div>
 <button className="agh-menu-toggle" type="button" onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen} aria-controls="agh-mobile-drawer" aria-label={menuOpen?"Close navigation menu":"Open navigation menu"}>{menuOpen?"×":"☰"}</button></div>
 <div className="agh-mobile-search"><form action="/search"><span aria-hidden="true">⌕</span><input name="location" value={value} onChange={e=>setValue(e.target.value)} placeholder="Search city or locality…"/><button type="submit">Search</button></form></div>
 {menuOpen&&<><button className="agh-drawer-backdrop" onClick={()=>setMenuOpen(false)} aria-label="Close navigation overlay"/><nav className="agh-mobile-drawer" id="agh-mobile-drawer" aria-label="Mobile navigation"><div className="agh-drawer-head"><strong>Explore Apna Ghar</strong><button onClick={()=>setMenuOpen(false)} aria-label="Close menu">×</button></div><div className="agh-drawer-theme"><span>Appearance</span><ThemePicker/></div><a href="/">Home</a><a href="/search">Browse all properties</a><a href="/search?transaction=buy">Buy a property</a><a href="/search?transaction=rent">Rent a property</a><a href="/search?type=commercial">Commercial spaces</a><a href="/search?type=plot">Plots & land</a><a href="/saved">Saved homes</a><a href="/my-listings">My listings</a><a href="/messages">Messages</a><a className="agh-drawer-sell" href="/list-property">＋ Post a property</a>{isSignedIn?<button className="agh-drawer-signout" onClick={()=>void signOut({redirectUrl:"/"})}>Sign out</button>:<a href="/sign-in">Sign in / Create account</a>}</nav></>}
 </header></div>;
}
