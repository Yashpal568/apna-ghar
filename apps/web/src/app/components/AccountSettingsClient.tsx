"use client";

import { UserProfile, useUser } from "@clerk/nextjs";

export default function AccountSettingsClient() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <section className="auth-card account-settings-panel" aria-label="Loading account settings"><div className="skeleton skeleton-heading"/><div className="skeleton skeleton-copy"/></section>;
  }
  if (!isSignedIn) {
    return <section className="auth-card account-settings-panel"><h2>Account settings</h2><p className="auth-muted">Sign in to manage your email, password, connected accounts and security settings.</p><a className="button button-primary" href="/sign-in?redirect_url=%2Fprofile">Sign in to manage account</a></section>;
  }
  return <section className="auth-card account-settings-panel"><div className="account-settings-heading"><div><p className="eyebrow">SECURE ACCOUNT</p><h2>Sign-in and security</h2><p className="auth-muted">Manage your verified email, password, connected accounts and account security.</p></div></div><div className="clerk-profile-theme"><UserProfile routing="hash" appearance={{variables:{colorPrimary:"var(--color-primary)",colorText:"var(--color-text)",colorTextSecondary:"var(--color-text-secondary)",colorBackground:"var(--color-surface)",colorInputBackground:"var(--color-input)",colorInputText:"var(--color-text)",colorNeutral:"var(--color-text)",colorDanger:"#DC2626",borderRadius:"12px"}}}/></div></section>;
}
