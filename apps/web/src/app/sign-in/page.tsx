import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import ThemePicker from "../components/ThemePicker";
import BrandLogo from "../components/BrandLogo";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="auth-page page-shell">
      <header className="site-header auth-header">
        <a className="brand" href="/" aria-label="Apna Ghar home"><BrandLogo /></a>
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
