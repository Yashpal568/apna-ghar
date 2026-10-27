import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import ThemePicker from "../components/ThemePicker";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <main className="auth-page page-shell">
      <header className="site-header auth-header">
        <a className="brand" href="/" aria-label="Apna Ghar home">
          <span className="brand-placeholder">INSERT APPROVED APNA GHAR LOGO ASSET</span>
          <span className="brand-name">Apna <b>Ghar</b></span>
        </a>
        <ThemePicker compact />
      </header>
      <section className="auth-single">
        <div className="auth-card clerk-auth-card">
          <p className="eyebrow">MAKE YOURSELF AT HOME</p>
          <h1>Create your Apna Ghar account</h1>
          <p className="auth-muted">Save homes, connect with owners and manage your listings.</p>
          <SignUp routing="hash" signInUrl="/sign-in" />
        </div>
      </section>
      <footer className="simple-footer auth-footer">
        <a href="/">← Back to Apna Ghar</a>
        <span>Secure account access</span>
      </footer>
    </main>
  );
}
