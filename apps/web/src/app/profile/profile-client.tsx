"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import AccountSettingsPanel from "../components/AccountSettingsPanel";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

type Profile = { name: string; email: string; phone: string; city: string; about: string };
const blank: Profile = { name: "", email: "", phone: "", city: "", about: "" };
const api = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function ProfilePage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile>(blank);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) {
        try {
          const raw = localStorage.getItem("apna-ghar-profile");
          if (raw && !cancelled) setProfile({ ...blank, ...JSON.parse(raw) });
        } catch { if (!cancelled) setMessage("Could not load this browser's saved profile."); }
        return;
      }
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Your session is not ready. Please sign in again.");
        const response = await fetch(api + "/users/me/profile", {
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not load your account profile.");
        if (!cancelled) {
          const serverProfile = { ...blank, ...body };
          const email = user?.primaryEmailAddress?.emailAddress || "";
          setProfile({ ...serverProfile, email: serverProfile.email || email });
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load your account profile.");
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, getToken, user]);

  const set = (key: keyof Profile, value: string) => setProfile(old => ({ ...old, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (isSignedIn) {
        const token = await getToken();
        if (!token) throw new Error("Your session is not ready. Please sign in again.");
        const response = await fetch(api + "/users/me/profile", {
          method: "PUT",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(profile),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Profile could not be saved.");
        setProfile({ ...blank, ...body });
        localStorage.setItem("apna-ghar-profile", JSON.stringify(body));
        setMessage("Profile saved to your account.");
      } else {
        localStorage.setItem("apna-ghar-profile", JSON.stringify(profile));
        setMessage("Saved on this device. Sign in to sync your profile across devices.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally { setSaving(false); }
  };

  return <main className="interior-page"><SiteHeader active="account" /><div className="profile-page-shell">
    <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>My profile</span></div>
    <section className="profile-page-hero"><section className="listing-intro"><p className="eyebrow">YOUR ACCOUNT</p><h1>A little more<br/><em>about you.</em></h1><p>Keep your contact details handy for property enquiries and visits.</p></section></section>
    <div className="profile-page-layout"><section className="auth-single"><form id="profile-details" className="auth-card auth-form" onSubmit={save}>
      <div className="profile-avatar" aria-hidden="true">{profile.name.trim() ? profile.name.trim().split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join("") : "AG"}</div><h2>Profile details</h2>
      <p className="auth-muted">{isSignedIn ? "Your details sync with your Apna Ghar account." : "Sign in to sync these details across your devices."}</p>
      {loading && <p role="status" className="form-notice">Loading your account profile…</p>}
      <label htmlFor="profile-name">Full name</label><input id="profile-name" value={profile.name} maxLength={100} onChange={e => set("name", e.target.value)} placeholder="Your name"/>
      <label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={profile.email} maxLength={254} onChange={e => set("email", e.target.value)} placeholder="you@example.com"/>
      <label htmlFor="profile-phone">Phone number</label><input id="profile-phone" type="tel" value={profile.phone} maxLength={30} onChange={e => set("phone", e.target.value)} placeholder="+91"/>
      <label htmlFor="profile-city">City</label><input id="profile-city" value={profile.city} maxLength={100} onChange={e => set("city", e.target.value)} placeholder="Your city"/>
      <label htmlFor="profile-about">About (optional)</label><textarea id="profile-about" rows={4} value={profile.about} maxLength={500} onChange={e => set("about", e.target.value)} placeholder="A short introduction"/>
      {message && <p role="status" className="form-notice">{message}</p>}<button className="button button-primary button-full" type="submit" disabled={saving || loading}>{saving ? "Saving…" : "Save profile"}</button>
      <div className="profile-links"><a href="/saved">View saved homes ↗</a><a href="/my-listings">Manage my listings ↗</a></div>
    </form></section><section className="profile-account-settings"><AccountSettingsPanel /></section></div><SiteFooter /></div></main>;
}
