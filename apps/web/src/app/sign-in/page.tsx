import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import ThemePicker from "../components/ThemePicker";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="auth-page page-shell">
      <header className="site-header auth-header">
        <a className="brand" href="/" aria-label="Apna Ghar home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48" role="img"><rect x="1" y="1" width="46" height="46" rx="12" fill="#e8f6f1"/><path d="M8 23 24 10l16 13" fill="none" stroke="#087f70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 21v16h22V21M21 37V26h7v11" fill="none" stroke="#087f70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="brand-name">Apna <b>Ghar</b></span></a>
        <ThemePicker compact />
      </header>
      <section className="auth-layout">
        <div className="auth-story">
          <p className="eyebrow">YOUR SPACE, YOUR WAY</p>
          <h1>Home starts<br />with a <em>hello.</em></h1>
          <p>Sign in to save places you love, plan visits and keep your property search in one place.</p>
        </div>
        <div className="auth-card clerk-auth-card">
          {clerkConfigured ? (
            <SignIn routing="hash" signUpUrl="/sign-up" />
          ) : (
            <p role="status">Sign-in is not configured yet. Add the Clerk publishable key to the web app environment to enable authentication.</p>
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
