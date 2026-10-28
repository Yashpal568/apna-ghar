"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function AccountSettingsClient() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  if (!isLoaded) {
    return <section className="auth-card account-settings-panel" aria-label="Loading account settings"><div className="skeleton skeleton-heading"/><div className="skeleton skeleton-copy"/></section>;
  }

  const initials = (user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "AG")
    .split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("");

  return (
    <section className="auth-card account-settings-panel">
      <p className="eyebrow">ACCOUNT</p>
      <h2>Account & security</h2>
      {isSignedIn ? (
        <>
          <div className="profile-account-identity">
            {user?.imageUrl ? <img src={user.imageUrl} alt="" /> : <span>{initials}</span>}
            <div><strong>{user?.fullName || user?.username || "Apna Ghar member"}</strong><p>{user?.primaryEmailAddress?.emailAddress || "Email not added"}</p><small>Signed in securely</small></div>
          </div>
          <div className="profile-setting-links">
            <a href="/saved"><span>Saved homes</span><span aria-hidden="true">↗</span></a>
            <a href="/my-listings"><span>My listings</span><span aria-hidden="true">↗</span></a>
            <a href="/sign-in/factor-one"><span>Sign-in & security</span><span aria-hidden="true">↗</span></a>
          </div>
          <button className="profile-signout-button" type="button" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await signOut({ redirectUrl: "/" }); } finally { setSigningOut(false); } }}>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          <p className="profile-security-note">Your sign-in details are managed securely by Clerk.</p>
        </>
      ) : (
        <>
          <p className="auth-muted">Sign in to sync your profile and manage your account securely across devices.</p>
          <a className="button button-primary button-full" href="/sign-in?redirect_url=%2Fprofile">Sign in to your account</a>
          <a className="profile-create-account" href="/sign-up">Create an account</a>
        </>
      )}
    </section>
  );
}
