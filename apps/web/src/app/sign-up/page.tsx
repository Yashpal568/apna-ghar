import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import ThemePicker from "../components/ThemePicker";
import BrandLogo from "../components/BrandLogo";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="auth-page page-shell">
      <header className="site-header auth-header">
        <a className="brand" href="/" aria-label="Apna Ghar home"><BrandLogo /></a>
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
