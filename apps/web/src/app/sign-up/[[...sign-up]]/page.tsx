import { SignUp } from "@clerk/nextjs";
import BrandLogo from "../../components/BrandLogo";

export const metadata = { title: "Create account | Apna Ghar" };

export default function SignUpPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return <main className="auth-experience">
    <header className="auth-experience-header"><a href="/" aria-label="Apna Ghar home"><BrandLogo /></a><p>Already have an account? <a href="/sign-in">Sign in <span aria-hidden="true">↗</span></a></p></header>
    <div className="auth-experience-grid auth-signup-grid">
      <section className="auth-story-panel auth-story-signup"><div className="auth-story-image" role="img" aria-label="Elegant modern home with garden views" /><div className="auth-story-overlay" /><div className="auth-story-content"><span className="auth-story-kicker"><span /> A BETTER WAY TO FIND HOME</span><h1>Your next<br/>chapter begins <em>here.</em></h1><p>Build your shortlist, keep track of the homes you love, and manage your property journey in one thoughtful place.</p><div className="auth-benefit-list"><div><span>01</span><p><strong>Save your favourites</strong><small>Keep every promising home close.</small></p></div><div><span>02</span><p><strong>Connect directly</strong><small>Start a conversation with owners.</small></p></div><div><span>03</span><p><strong>Stay in control</strong><small>Manage your listings in one place.</small></p></div></div></div><div className="auth-story-caption"><span>YOUR SPACE. YOUR PACE.</span><span>Made for real life.</span></div></section>
      <section className="auth-form-panel"><div className="auth-form-intro"><span className="auth-form-eyebrow">GET STARTED</span><h2>Make yourself at home.</h2><p>Create your free account and make your next move feel simpler.</p></div>{configured ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/profile" /> : <div className="auth-config-notice"><h3>Account setup required</h3><p>Add the Clerk publishable and secret keys to the web app environment to enable secure account creation.</p></div>}<p className="auth-switch">Already registered? <a href="/sign-in">Sign in instead</a></p><div className="auth-form-legal">Your information stays yours. Read our <a href="/privacy">Privacy Policy</a>.</div></section>
    </div><footer className="auth-experience-footer"><span>© 2026 Apna Ghar</span><span>A place for every new beginning.</span><nav><a href="/">Home</a><a href="/search">Explore homes</a><a href="/help">Help & support</a></nav></footer>
  </main>;
}
