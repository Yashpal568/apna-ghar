import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import ThemePicker from "../components/ThemePicker";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="auth-page page-shell">
      <header className="site-header auth-header">
        <a className="brand" href="/" aria-label="Apna Ghar home">
          <span className="brand-placeholder">INSERT APPROVED APNA GHAR LOGO ASSET</span>
          <span className="brand-name">Apna <b>Ghar</b></span>
        </a>
        <ThemePicker compact />
      </header>
      <section className="auth-layout">
        <div className="auth-story">
          <p className="eyebrow">YOUR SPACE, YOUR WAY</p>
          <h1>Home starts<br />with a <em>hello.</em></h1>
          <p>Sign in to save places you love, plan visits and keep your property search in one place.</p>
        </div>
        <div className="auth-card clerk-auth-card">
          <SignIn routing="hash" signUpUrl="/sign-up" />
        </div>
      </section>
      <footer className="simple-footer auth-footer">
        <a href="/">← Back to Apna Ghar</a>
        <span>Secure account access</span>
      </footer>
    </main>
  );
}
