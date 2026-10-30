"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
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
function friendlyProfileError(detail: string) {
  if (detail === "Authentication is not configured" || detail === "Authentication is not configured.") return "Profile sync is unavailable because the API is missing its Clerk secret configuration. Set CLERK_SECRET_KEY in the API host to the same Clerk instance used by this website, then redeploy. Your changes are not synced yet.";
  if (detail === "Invalid or expired authentication token") return "The API could not verify this sign-in session. Confirm the website and API use the same Clerk instance, then sign in again.";
  if (detail === "Failed to fetch") return "We couldn't reach the Apna Ghar API. Check the API deployment and CORS configuration, then retry.";
  return detail || "Could not load your account profile.";
}
const heroPhotos = [
  { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=95", alt: "Bright contemporary home with warm neutral architecture" },
  { src: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2000&q=95", alt: "Sunlit modern living room opening onto a garden" },
  { src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2000&q=95", alt: "Modern house exterior with landscaped surroundings" },
];
const iconPaths: Record<string, string[]> = {
  home: ["M3 10.8 12 3l9 7.8", "M5.5 9.5V21h13V9.5", "M9 21v-7h6v7"],
  verified: ["M12 2.5 15 4l3.4-.1.8 3.3 2.3 2.5-1.5 3 0 3.4-3.3.8-2.7 2.2-3-1.5-3.4 0-.8-3.3L4.5 12l1.5-3 0-3.4 3.3-.8z", "m8.5 11.8 2.2 2.2 4.8-5"],
  chevron_left: ["m15 18-6-6 6-6"], chevron_right: ["m9 18 6-6-6-6"],
  token: ["M12 3 20 7.5v9L12 21l-8-4.5v-9z", "m8.5 12 2.2 2.2 4.8-5"],
  insights: ["M4 19V5", "M4 19h17", "m7 15 4-4 3 2 5-7"],
  favorite: ["M20.8 8.8c0 5.1-8.8 11-8.8 11s-8.8-5.9-8.8-11A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"],
  real_estate_agent: ["M3 10 12 3l9 7", "M5 9v12h14V9", "M9 21v-6h6v6", "M15 5v4"],
  search: ["M20 20l-4.5-4.5", "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"],
  lock: ["M5 10h14v11H5z", "M8 10V7a4 4 0 0 1 8 0v3", "M12 14v3"],
  person: ["M20 21a8 8 0 0 0-16 0", "M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"],
  mail: ["M3 5h18v14H3z", "m3 6 9 7 9-7"],
  call: ["M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 3a15 15 0 0 1-8-8l3-2z"],
  location_on: ["M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z", "M12 10a2.3 2.3 0 1 0 0-4.6A2.3 2.3 0 0 0 12 10Z"],
  edit_note: ["M4 5h11", "M4 10h8", "M4 15h6", "m14 16 5-5 2 2-5 5-3 1z"],
  shield_lock: ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z", "M9 11V9a3 3 0 0 1 6 0v2", "M8 11h8v6H8z"],
  sync: ["M20 7v5h-5", "M4 17v-5h5", "M6 9a7 7 0 0 1 12-2l2 5", "M18 15a7 7 0 0 1-12 2l-2-5"],
  check: ["m5 12 4 4L19 6"],
  notifications_active: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4", "M21 4l-2 2", "M3 4l2 2"],
  arrow_outward: ["M7 17 17 7", "M8 7h9v9"],
  admin_panel_settings: ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z", "M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z", "M8.5 16a3.5 3.5 0 0 1 7 0"],
  shield: ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"],
  devices: ["M4 5h16v11H4z", "M2 20h20", "M9 16v4", "M15 16v4"],
  login: ["M10 17l5-5-5-5", "M15 12H3", "M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"],
  verified_user: ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z", "m8 12 2.5 2.5L16 9"],
  home_pin: ["M3 10 12 3l9 7", "M5 9v12h14V9", "M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z", "M12 11v3"],
};
const Icon = ({ children, className = "" }: { children: string; className?: string }) => (
  <svg aria-hidden="true" className={"profile-inline-icon " + className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(iconPaths[children] || iconPaths.home).map((d, i) => <path d={d} key={i} />)}
  </svg>
);

function ProfileClientWithClerk() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile>(blank);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [imageFallback, setImageFallback] = useState<Record<number, boolean>>({});
  const [tourNotifications, setTourNotifications] = useState(true);
  const [securityTab, setSecurityTab] = useState<"profile" | "security" | "sessions">("security");

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
        const identityResponse = await fetch(api + "/users/me", { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
        if (!identityResponse.ok) {
          const identityError = await identityResponse.json().catch(() => ({}));
          if (identityResponse.status !== 404) throw new Error(typeof identityError.message === "string" ? identityError.message : "Could not synchronize your account identity.");
        }
        const identity = identityResponse.ok ? await identityResponse.json() as Partial<Profile> : {};
        const response = await fetch(api + "/users/me/profile", { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not load your account profile.");
        if (!cancelled) {
          const serverProfile = { ...blank, ...body };
          setProfile({ ...serverProfile, name: serverProfile.name || identity.name || user?.fullName || "", email: serverProfile.email || identity.email || user?.primaryEmailAddress?.emailAddress || "" });
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          const detail = error instanceof Error ? error.message : "";
          let local: Profile = blank;
          try {
            const raw = localStorage.getItem("apna-ghar-profile");
            if (raw) local = { ...blank, ...JSON.parse(raw) };
          } catch { /* keep a safe empty fallback */ }
          setProfile({
            ...local,
            name: local.name || user?.fullName || "",
            email: local.email || user?.primaryEmailAddress?.emailAddress || "",
          });
          setMessage(friendlyProfileError(detail));
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
        if (!response.ok) throw new Error(friendlyProfileError(typeof body.message === "string" ? body.message : "Profile could not be saved."));
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
          <section className="profile-stitch-card profile-stitch-form-card" id="profile-details">
            <div className="profile-stitch-card-heading">
              <div className="profile-stitch-avatar">{user?.imageUrl ? <img src={user.imageUrl} alt="" /> : initials}</div>
              <div><span className="profile-stitch-overline">YOUR ACCOUNT</span><h2>Profile details</h2><p>Keep your contact information up to date.</p></div>
            </div>
            <form id="profileForm" className="profile-stitch-form" onSubmit={save}>
              <div className="profile-stitch-field"><label htmlFor="profile-name">Full name</label><div className="profile-stitch-input-wrap"><Icon>person</Icon><input id="profile-name" value={profile.name} maxLength={100} onChange={e => set("name", e.target.value)} placeholder="Your full name" autoComplete="name" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-email">Email address</label><div className="profile-stitch-input-wrap"><Icon>mail</Icon><input id="profile-email" type="email" value={profile.email} maxLength={254} onChange={e => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-phone">Phone number</label><div className="profile-stitch-input-wrap"><Icon>call</Icon><input id="profile-phone" type="tel" value={profile.phone} maxLength={30} onChange={e => set("phone", e.target.value)} placeholder="+91" autoComplete="tel" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-city">City / Preferred Locality</label><div className="profile-stitch-input-wrap"><Icon>location_on</Icon><input id="profile-city" value={profile.city} maxLength={100} onChange={e => set("city", e.target.value)} placeholder="City or neighbourhood" autoComplete="address-level2" /></div></div>
              <div className="profile-stitch-field"><label htmlFor="profile-about">About &amp; buyer preferences</label><div className="profile-stitch-input-wrap profile-stitch-textarea-wrap"><Icon>edit_note</Icon><textarea id="profile-about" rows={4} value={profile.about} maxLength={500} onChange={e => set("about", e.target.value)} placeholder="Tell us a little about the kind of property you're looking for..." /></div><small>{profile.about.length}/500 characters</small></div>
              {loading && <p className="profile-stitch-notice" role="status">Loading your account profile…</p>}
              {message && <p className={"profile-stitch-notice" + (/unavailable|could not|couldn.t|couldn’t|not synced|could not verify/i.test(message) ? " is-error" : "")} role="status">{message}</p>}
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
            <div className="profile-stitch-security-heading"><div><span className="profile-stitch-overline">ACCOUNT PROTECTION</span><h2>Security &amp; access</h2><p>Manage sign-in and active account access.</p></div><span className="profile-stitch-security-icon"><Icon>admin_panel_settings</Icon></span></div>
            <div className="profile-stitch-tabs" role="tablist" aria-label="Account settings sections">
              
              <button type="button" role="tab" aria-selected={securityTab === "security"} className={securityTab === "security" ? "is-active" : ""} onClick={() => setSecurityTab("security")}><Icon>shield</Icon> Security</button>
              <button type="button" role="tab" aria-selected={securityTab === "sessions"} className={securityTab === "sessions" ? "is-active" : ""} onClick={() => setSecurityTab("sessions")}><Icon>devices</Icon> Sessions</button>
            </div>
            {securityTab === "security" && <div className="profile-stitch-security-content" role="tabpanel"><div className="profile-stitch-security-row"><span className="profile-stitch-row-icon"><Icon>lock</Icon></span><div><strong>Authentication</strong><p>{isSignedIn ? "Your sign-in is managed by your authentication provider." : "Sign in to manage account security."}</p></div></div>{isSignedIn ? <button className="profile-stitch-security-link" type="button" onClick={() => openUserProfile()}><Icon>shield</Icon> Manage security settings <Icon>arrow_outward</Icon></button> : <a className="profile-stitch-security-link" href="/sign-in"><Icon>login</Icon> Sign in to secure your account <Icon>arrow_outward</Icon></a>}</div>}
            {securityTab === "sessions" && <div className="profile-stitch-security-content" role="tabpanel"><div className="profile-stitch-session-note"><Icon>devices</Icon><p>For your security, session management is handled by your sign-in provider. Use account settings there to review active sessions.</p></div>{isSignedIn ? <button className="profile-stitch-security-link" type="button" onClick={() => openUserProfile()}><Icon>devices</Icon> Manage sessions & access <Icon>arrow_outward</Icon></button> : <a className="profile-stitch-security-link" href="/sign-in"><Icon>login</Icon> Sign in to manage access <Icon>arrow_outward</Icon></a>}</div>}
            <div className="profile-stitch-security-foot"><Icon>verified_user</Icon> Never share your password or one-time codes.</div>{isSignedIn && <button className="profile-stitch-logout" type="button" onClick={() => void signOut({ redirectUrl: "/" })}><span aria-hidden="true">↪</span> Sign out of Apna Ghar</button>}
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


export default function ProfilePage() {
  // CI and local previews may build without Clerk environment variables. Do not
  // render Clerk hooks outside ClerkProvider in that configuration.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="interior-page profile-redesign">
        <SiteHeader active="account" />
        <div className="profile-redesign-shell">
          <section className="profile-stitch-security">
            <span className="profile-stitch-overline">ACCOUNT SETTINGS</span>
            <h1>Profile setup is unavailable</h1>
            <p>Account sign-in is not configured in this environment. You can still browse properties; profile features will be available when authentication is configured.</p>
            <a className="profile-stitch-security-link" href="/search">Explore properties <Icon>arrow_outward</Icon></a>
          </section>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return <ProfileClientWithClerk />;
}
