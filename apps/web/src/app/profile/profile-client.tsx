"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import AccountSettingsPanel from "../components/AccountSettingsPanel";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

type Profile = { name: string; email: string; phone: string; city: string; about: string };
const blank: Profile = { name: "", email: "", phone: "", city: "", about: "" };
const configuredApi = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const api = (configuredApi || (process.env.NODE_ENV === "development"
  ? "http://localhost:4000/api/v1"
  : "https://apna-ghar-api-j4fo.onrender.com/api/v1")).replace(/\/$/, "");
const fallbackPhoto = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=95";
const heroPhotos = [
  { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=95", alt: "Bright contemporary home with warm neutral architecture" },
  { src: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2000&q=95", alt: "Sunlit modern living room opening onto a garden" },
  { src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2000&q=95", alt: "Modern house exterior with landscaped surroundings" },
];
const Icon = ({ children, className = "" }: { children: string; className?: string }) => <span aria-hidden="true" className={"material-symbols-outlined " + className}>{children}</span>;

export default function ProfilePage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile>(blank);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [imageFallback, setImageFallback] = useState<Record<number, boolean>>({});
  const [tourNotifications, setTourNotifications] = useState(true);
  const [securityTab, setSecurityTab] = useState<"profile" | "security" | "sessions">("profile");

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
        const response = await fetch(api + "/users/me/profile", { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not load your account profile.");
        if (!cancelled) {
          const serverProfile = { ...blank, ...body };
          setProfile({ ...serverProfile, email: serverProfile.email || user?.primaryEmailAddress?.emailAddress || "" });
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          const detail = error instanceof Error ? error.message : "";
          setMessage(detail === "Failed to fetch"
            ? "We couldn't reach the Apna Ghar API. Check the API deployment and CORS configuration, then retry."
            : detail || "Could not load your account profile.");
        }
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, getToken, user]);

  useEffect(() => {
    const timer = window.setInterval(() => setHeroSlide(index => (index + 1) % heroPhotos.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("apna-ghar-tour-notifications");
      if (saved !== null) setTourNotifications(saved === "true");
    } catch { /* storage may be disabled */ }
  }, []);

  const set = (key: keyof Profile, value: string) => setProfile(old => ({ ...old, [key]: value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage("");
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
        const updated = { ...blank, ...body, email: body.email || profile.email };
        setProfile(updated);
        localStorage.setItem("apna-ghar-profile", JSON.stringify(updated));
        setMessage("Profile saved to your account.");
      } else {
        localStorage.setItem("apna-ghar-profile", JSON.stringify(profile));
        setMessage("Saved on this device. Sign in to sync your profile across devices.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Profile could not be saved."); }
    finally { setSaving(false); }
  };
  const changeTourNotifications = (checked: boolean) => {
    setTourNotifications(checked);
    try { localStorage.setItem("apna-ghar-tour-notifications", String(checked)); } catch { /* storage may be disabled */ }
  };
  const displayName = profile.name.trim() || user?.fullName || "Your Apna Ghar profile";
  const initials = displayName === "Your Apna Ghar profile" ? "AG" : displayName.split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join("");

  return <main className="interior-page profile-redesign">
    <SiteHeader active="account" />
    <div className="profile-redesign-shell">
      <div className="profile-design-breadcrumb">
        <div><a href="/"><Icon>home</Icon> Home</a><Icon className="crumb-separator">chevron_right</Icon><span>My profile</span></div>
        <span className="profile-verified-label"><Icon>verified</Icon> Personal account</span>
      </div>

      <section className="profile-stitch-hero" aria-label="Personal discovery profile">
        <div className="profile-stitch-slides">
          {heroPhotos.map((photo, index) => <div className={"profile-stitch-slide " + (heroSlide === index ? "is-active" : "")} key={photo.src} aria-hidden={heroSlide !== index}>
            <img src={imageFallback[index] ? fallbackPhoto : photo.src} alt={photo.alt} onError={() => setImageFallback(old => ({ ...old, [index]: true }))} />
          </div>)}
          <div className="profile-stitch-hero-shade" />
        </div>
        <div className="profile-stitch-carousel-controls">
          <button type="button" aria-label="Previous image" onClick={() => setHeroSlide(i => (i + heroPhotos.length - 1) % heroPhotos.length)}><Icon>chevron_left</Icon></button>
          <button type="button" aria-label="Next image" onClick={() => setHeroSlide(i => (i + 1) % heroPhotos.length)}><Icon>chevron_right</Icon></button>
        </div>
        <div className="profile-stitch-hero-content">
          <div className="profile-stitch-hero-copy">
            <span className="profile-stitch-kicker"><Icon>token</Icon> Personal Discovery Profile</span>
            <h1>A little more <span>about you.</span></h1>
            <p>Keep your contact details handy for property enquiries, private scheduling and visit requests.</p>
            <div className="profile-stitch-status"><span />{isSignedIn ? "Connected to your Apna Ghar account" : "Profile saved on this device"}</div>
            <div className="profile-stitch-indicators" aria-label="Choose hero image">
              {heroPhotos.map((photo, index) => <button key={photo.src} type="button" aria-label={"Show image " + (index + 1)} aria-pressed={heroSlide === index} className={heroSlide === index ? "is-active" : ""} onClick={() => setHeroSlide(index)} />)}
            </div>
          </div>
          <div className="profile-stitch-hero-insights">
            <div className="profile-stitch-insight-heading"><span className="profile-stitch-kicker"><Icon>insights</Icon> Your account</span><span className="profile-stitch-account-label">Quick links</span></div>
            <div className="profile-stitch-insight-links">
              <a href="/saved"><span className="profile-stitch-insight-icon"><Icon>favorite</Icon></span><strong>Saved homes</strong></a>
              <a href="/my-listings"><span className="profile-stitch-insight-icon"><Icon>real_estate_agent</Icon></span><strong>My properties</strong></a>
              <a href="/search"><span className="profile-stitch-insight-icon"><Icon>search</Icon></span><strong>Explore homes</strong></a>
            </div>
          </div>
          <div className="profile-stitch-completeness">
            <div><span>Profile strength</span><strong>{Math.round([profile.name,profile.email || user?.primaryEmailAddress?.emailAddress,profile.phone,profile.city,profile.about].filter(value => Boolean(value?.trim())).length / 5 * 100)}% completed</strong></div>
            <div className="profile-stitch-progress"><span style={{width: Math.round([profile.name,profile.email || user?.primaryEmailAddress?.emailAddress,profile.phone,profile.city,profile.about].filter(value => Boolean(value?.trim())).length / 5 * 100) + "%"}} /></div>
            <small>Complete your contact details to make property enquiries easier.</small>
          </div>
        </div>
      </section>

      <div className="profile-stitch-badges">
        <span><Icon>verified</Icon> Account profile</span>
        <span><Icon>lock</Icon> Secure account access</span>
      </div>

      <div className="profile-stitch-grid">
        <div className="profile-stitch-main-column">
          <section className="profile-stitch-card profile-stitch-form-card">
            <div className="profile-stitch-card-heading">
              <div className="profile-stitch-avatar">{initials}</div>
              <div><span className="profile-stitch-overline">YOUR ACCOUNT</span><h2>Profile details</h2><p>Keep your contact information up to date.</p></div>
            </div>
            <form id="profileForm" className="profile-stitch-form" onSubmit={save}>
              <div className="profile-stitch-field"><label htmlFor="profile-name">Full name</label><div className="profile-stitch-input-wrap"><Icon>person</Icon><input id="profile-name" value={profile.name} maxLength={100} onChange={e => set("name", e.target.value)} placeholder="Your full name" autoComplete="name" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-email">Email address</label><div className="profile-stitch-input-wrap"><Icon>mail</Icon><input id="profile-email" type="email" value={profile.email} maxLength={254} onChange={e => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-phone">Phone number</label><div className="profile-stitch-input-wrap"><Icon>call</Icon><input id="profile-phone" type="tel" value={profile.phone} maxLength={30} onChange={e => set("phone", e.target.value)} placeholder="+91" autoComplete="tel" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-city">City / Preferred Locality</label><div className="profile-stitch-input-wrap"><Icon>location_on</Icon><input id="profile-city" value={profile.city} maxLength={100} onChange={e => set("city", e.target.value)} placeholder="City or neighbourhood" autoComplete="address-level2" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-about">About &amp; buyer preferences</label><div className="profile-stitch-input-wrap profile-stitch-textarea-wrap"><Icon>edit_note</Icon><textarea id="profile-about" rows={4} value={profile.about} maxLength={500} onChange={e => set("about", e.target.value)} placeholder="Tell us a little about the kind of property you're looking for..." /></div><small>{profile.about.length}/500 characters</small></div>
              {loading && <p className="profile-stitch-notice" role="status">Loading your account profile…</p>}
              {message && <p className="profile-stitch-notice" role="status">{message}</p>}
              <div className="profile-stitch-form-footer"><span><Icon>shield_lock</Icon> Your information stays associated with your account.</span><button type="submit" disabled={saving || loading}>{saving ? <><Icon>sync</Icon> Saving…</> : <><Icon>check</Icon> Save profile</>}</button></div>
            </form>
          </section>

          <section className="profile-stitch-card profile-stitch-notification-card">
            <div className="profile-stitch-notification-icon"><Icon>notifications_active</Icon></div>
            <div className="profile-stitch-notification-copy"><h2>Property tour updates</h2><p>Receive updates about tour requests and scheduling on this device.</p></div>
            <label className="profile-stitch-switch"><input type="checkbox" checked={tourNotifications} onChange={e => changeTourNotifications(e.target.checked)} /><span /><b>{tourNotifications ? "On" : "Off"}</b></label>
          </section>

          <section className="profile-stitch-card profile-stitch-shortcuts">
            <div><span className="profile-stitch-overline">QUICK ACCESS</span><h2>Your property journey</h2><p>Pick up where you left off.</p></div>
            <a href="/saved"><Icon>favorite</Icon><span><strong>Saved homes</strong><small>Properties you bookmarked</small></span><Icon>arrow_outward</Icon></a>
            <a href="/my-listings"><Icon>real_estate_agent</Icon><span><strong>My listings</strong><small>Manage properties you posted</small></span><Icon>arrow_outward</Icon></a>
          </section>
        </div>

        <aside className="profile-stitch-side-column">
          <section className="profile-stitch-card profile-stitch-security-card">
            <div className="profile-stitch-security-heading"><div><span className="profile-stitch-overline">ACCOUNT</span><h2>Sign-in &amp; security</h2><p>Manage your profile and account access.</p></div><span className="profile-stitch-security-icon"><Icon>admin_panel_settings</Icon></span></div>
            <div className="profile-stitch-tabs" role="tablist" aria-label="Account settings sections">
              <button type="button" role="tab" aria-selected={securityTab === "profile"} className={securityTab === "profile" ? "is-active" : ""} onClick={() => setSecurityTab("profile")}><Icon>person</Icon> Profile</button>
              <button type="button" role="tab" aria-selected={securityTab === "security"} className={securityTab === "security" ? "is-active" : ""} onClick={() => setSecurityTab("security")}><Icon>shield</Icon> Security</button>
              <button type="button" role="tab" aria-selected={securityTab === "sessions"} className={securityTab === "sessions" ? "is-active" : ""} onClick={() => setSecurityTab("sessions")}><Icon>devices</Icon> Sessions</button>
            </div>
            {securityTab === "profile" && <div className="profile-stitch-security-content" role="tabpanel"><div className="profile-stitch-security-row"><span className="profile-stitch-row-icon"><Icon>mail</Icon></span><div><strong>Email address</strong><p>{profile.email || user?.primaryEmailAddress?.emailAddress || "No email available"}</p></div><span className="profile-stitch-row-status"><Icon>{profile.email || user?.primaryEmailAddress?.emailAddress ? "check_circle" : "info"}</Icon></span></div><div className="profile-stitch-security-row"><span className="profile-stitch-row-icon"><Icon>call</Icon></span><div><strong>Phone number</strong><p>{profile.phone || "Add a phone number to your profile"}</p></div></div><div className="profile-stitch-security-row"><span className="profile-stitch-row-icon"><Icon>account_circle</Icon></span><div><strong>Account status</strong><p>{isSignedIn ? "Signed in with Apna Ghar" : "Using this device"}</p></div><span className="profile-stitch-row-status"><Icon>{isSignedIn ? "verified_user" : "devices"}</Icon></span></div></div>}
            {securityTab === "security" && <div className="profile-stitch-security-content" role="tabpanel"><div className="profile-stitch-security-row"><span className="profile-stitch-row-icon"><Icon>lock</Icon></span><div><strong>Authentication</strong><p>{isSignedIn ? "Your sign-in is managed by your authentication provider." : "Sign in to manage account security."}</p></div></div><a className="profile-stitch-security-link" href="/sign-in"><Icon>login</Icon> Open sign-in options <Icon>arrow_outward</Icon></a></div>}
            {securityTab === "sessions" && <div className="profile-stitch-security-content" role="tabpanel"><div className="profile-stitch-session-note"><Icon>devices</Icon><p>For your security, session management is handled by your sign-in provider. Use account settings there to review active sessions.</p></div><a className="profile-stitch-security-link" href="/sign-in"><Icon>manage_accounts</Icon> Manage sign-in <Icon>arrow_outward</Icon></a></div>}
            <div className="profile-stitch-security-foot"><Icon>verified_user</Icon> Never share your password or one-time codes.</div>
          </section>

          <section className="profile-stitch-recommendation">
            <div className="profile-stitch-recommendation-photo"><img src={fallbackPhoto} alt="Modern home with warm lighting and landscaped surroundings" /><span><Icon>home_pin</Icon> Explore properties</span></div>
            <div className="profile-stitch-recommendation-body"><span className="profile-stitch-overline">YOUR NEXT CHAPTER</span><h2>Find a place that feels like home.</h2><p>Explore available properties, compare listing details and save the ones you want to revisit.</p><div className="profile-stitch-recommendation-actions"><a href="/search"><Icon>search</Icon> Browse homes</a><a href="/saved" aria-label="View saved homes"><Icon>favorite</Icon></a></div></div>
          </section>
          <section className="profile-stitch-owner-cta"><div className="profile-stitch-owner-icon"><Icon>real_estate_agent</Icon></div><div><h2>Have a property to share?</h2><p>Publish your listing and help the right people discover your space.</p></div><a href="/list-property">Post a property <Icon>arrow_outward</Icon></a></section>
        </aside>
      </div>
    </div>
    <SiteFooter />
  </main>;
}
