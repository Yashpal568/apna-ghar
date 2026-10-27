"use client";

import dynamic from "next/dynamic";

const AccountSettingsClient = dynamic(() => import("./AccountSettingsClient"), {
  ssr: false,
  loading: () => <section className="auth-card account-settings-panel" aria-label="Loading account settings"><div className="skeleton skeleton-heading"/><div className="skeleton skeleton-copy"/></section>,
});

export default function AccountSettingsPanel() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <section className="auth-card account-settings-panel"><h2>Account security</h2><p className="auth-muted">Account settings become available when Clerk authentication is configured.</p></section>;
  }
  return <AccountSettingsClient />;
}
