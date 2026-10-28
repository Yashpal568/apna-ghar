"use client";

import { useUser } from "@clerk/nextjs";

export default function AccountSettingsClient() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <section className="auth-card account-settings-panel" aria-label="Loading account settings"><div className="skeleton skeleton-heading"/><div className="skeleton skeleton-copy"/></section>;
  }

  return (
    <section className="auth-card account-settings-panel">
      <p className="eyebrow">ACCOUNT SECURITY</p>
      <h2>Sign-in and security</h2>
      {isSignedIn ? (
        <>
          <p className="auth-muted">Your login credentials and verified email are securely managed by Clerk.</p>
          <a className="button button-secondary" href="https://accounts.clerk.com/">Manage sign-in settings</a>
        </>
      ) : (
        <>
          <p className="auth-muted">Sign in to manage your email, password, connected accounts and account security.</p>
          <a className="button button-primary" href="/sign-in?redirect_url=%2Fprofile">Sign in to manage account</a>
        </>
      )}
    </section>
  );
}
