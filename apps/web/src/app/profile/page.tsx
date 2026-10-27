"use client";

import BrandLogo from "../components/BrandLogo";

import { useEffect, useState } from "react";
import ThemePicker from "../components/ThemePicker";
import AccountSettingsPanel from "../components/AccountSettingsPanel";

type Profile={name:string;email:string;phone:string;city:string;about:string};
const blank:Profile={name:"",email:"",phone:"",city:"",about:""};
export default function ProfilePage(){
 const [profile,setProfile]=useState<Profile>(blank);
 const [message,setMessage]=useState("");
 useEffect(()=>{try{const raw=localStorage.getItem("apna-ghar-profile");if(raw)setProfile({...blank,...JSON.parse(raw)});}catch{setMessage("Could not load this browser's saved profile.");}},[]);
 const set=(key:keyof Profile,value:string)=>setProfile(old=>({...old,[key]:value}));
 const save=(e:React.FormEvent)=>{e.preventDefault();try{localStorage.setItem("apna-ghar-profile",JSON.stringify(profile));setMessage("Profile saved on this device. Account sync will be available after API integration.");}catch{setMessage("Could not save profile in this browser.");}};
 return <main className="page-shell interior-page"><header className="site-header interior-header"><a className="brand" href="/" aria-label="Apna Ghar home"><BrandLogo /></a><nav className="desktop-nav"><a href="/saved">Saved homes</a><a href="/my-listings">My listings</a></nav><div className="header-actions"><ThemePicker compact/><a className="button button-quiet" href="/sign-in">Sign in</a></div></header>
 <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>My profile</span></div>
 <section className="listing-intro"><p className="eyebrow">YOUR ACCOUNT</p><h1>A little more<br/><em>about you.</em></h1><p>Keep your contact details handy for property enquiries and visits.</p></section>
 <section className="auth-single" style={{maxWidth:680,marginTop:0}}><form className="auth-card auth-form" onSubmit={save}><div className="profile-avatar" aria-hidden="true">{profile.name.trim()?profile.name.trim().split(/\s+/).slice(0,2).map(x=>x[0].toUpperCase()).join(""):"AG"}</div><h2>Profile details</h2><p className="auth-muted">Your profile is saved locally in this browser for now, not in a shared account.</p>
 <label htmlFor="profile-name">Full name</label><input id="profile-name" value={profile.name} maxLength={100} onChange={e=>set("name",e.target.value)} placeholder="Your name"/>
 <label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={profile.email} onChange={e=>set("email",e.target.value)} placeholder="you@example.com"/>
 <label htmlFor="profile-phone">Phone number</label><input id="profile-phone" type="tel" value={profile.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91"/>
 <label htmlFor="profile-city">City</label><input id="profile-city" value={profile.city} onChange={e=>set("city",e.target.value)} placeholder="Your city"/>
 <label htmlFor="profile-about">About (optional)</label><textarea id="profile-about" rows={4} value={profile.about} maxLength={500} onChange={e=>set("about",e.target.value)} placeholder="A short introduction"/>
 {message&&<p role="status" className="form-notice">{message}</p>}<button className="button button-primary button-full" type="submit">Save profile</button>
 <div className="profile-links"><a href="/saved">View saved homes ↗</a><a href="/my-listings">Manage my listings ↗</a></div></form></section><section className="profile-account-settings" style={{maxWidth:680,margin:"28px auto 0"}}><AccountSettingsPanel /></section><footer className="simple-footer">Apna Ghar · Profile</footer></main>;
}