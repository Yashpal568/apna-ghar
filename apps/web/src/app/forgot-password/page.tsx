import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import { NOINDEX_ROBOTS } from "../utils/seo";

export const metadata: Metadata = {
  title: "Reset password | Apna Ghar",
  robots: NOINDEX_ROBOTS,
};

export default function ForgotPasswordPage() {
  return (
    <main className="auth-experience auth-recovery-experience">
      <SiteHeader active="account" />
      <div className="auth-recovery-container">
        <div className="auth-card auth-recovery-card">
          <span className="auth-form-eyebrow">ACCOUNT RECOVERY</span>
          <h2>Let’s get you back in.</h2>
          <p className="auth-muted">
            Enter the email address linked to your account. If recovery is available, we’ll send the next steps.
          </p>
          <form className="auth-form">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            <button className="button button-primary button-full" type="button" disabled>
              Send recovery link
            </button>
            <p className="auth-notice">
              Password recovery is a design preview. Email delivery and secure reset tokens are not connected yet.
            </p>
          </form>
          <p className="auth-switch">
            <a href="/sign-in">← Return to sign in</a>
          </p>
        </div>
      </div>
      <footer className="auth-experience-footer">
        <span>© 2026 Apna Ghar</span>
        <span>Account recovery preview</span>
        <nav>
          <a href="/">Home</a>
          <a href="/search">Explore homes</a>
          <a href="/help">Help & support</a>
        </nav>
      </footer>
    </main>
  );
}