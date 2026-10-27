import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import ThemePicker from "../components/ThemePicker";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="auth-page page-shell">
      <header className="site-header auth-header">
        <a className="brand" href="/" aria-label="Apna Ghar home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48" role="img"><rect x="1" y="1" width="46" height="46" rx="12" fill="#e8f6f1"/><path d="M8 23 24 10l16 13" fill="none" stroke="#087f70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 21v16h22V21M21 37V26h7v11" fill="none" stroke="#087f70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="brand-name">Apna <b>Ghar</b></span></a>
        <ThemePicker compact />
      </header>
      <section className="auth-single">
        <div className="auth-card clerk-auth-card">
          <p className="eyebrow">MAKE YOURSELF AT HOME</p>
          <h1>Create your Apna Ghar account</h1>
          <p className="auth-muted">Save homes, connect with owners and manage your listings.</p>
          {clerkConfigured ? (
            <SignUp routing="hash" signInUrl="/sign-in" />
          ) : (
            <p role="status">Account creation is not configured yet. Add the Clerk publishable key to the web app environment to enable authentication.</p>
          )}
        </div>
      </section>
      <footer className="simple-footer auth-footer">
        <a href="/">← Back to Apna Ghar</a>
        <span>Secure account access</span>
      </footer>
    </main>
  );
}
