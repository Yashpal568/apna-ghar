import { SignIn } from "@clerk/nextjs";
import BrandLogo from "../../components/BrandLogo";
import SiteFooter from "../../components/SiteFooter";

export const metadata = { title: "Sign in | Apna Ghar" };

export default function SignInPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return <main className="auth-experience">
    <header className="auth-experience-header"><a href="/" aria-label="Apna Ghar home"><BrandLogo /></a><p>New to Apna Ghar? <a href="/sign-up">Create an account <span aria-hidden="true">↗</span></a></p></header>
    <div className="auth-experience-grid">
      <section className="auth-story-panel auth-story-signin"><div className="auth-story-image" role="img" aria-label="Warm, sunlit contemporary home interior" /><div className="auth-story-overlay" /><div className="auth-story-content"><span className="auth-story-kicker"><span /> YOUR NEXT CHAPTER STARTS HERE</span><h1>Come home<br/>to what feels <em>right.</em></h1><p>Save the places you love, keep your property journey organised, and connect with owners with confidence.</p><div className="auth-trust-row"><span>✓ Thoughtful spaces</span><span>✓ People, not middlemen</span></div></div><div className="auth-story-caption"><span>01 / FIND YOUR PLACE</span><span>Made for the way you live.</span></div></section>
      <section className="auth-form-panel"><div className="auth-form-intro"><span className="auth-form-eyebrow">WELCOME BACK</span><h2>Good to see you again.</h2><p>Sign in to pick up where your home search left off.</p></div>{configured ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/profile" /> : <div className="auth-config-notice"><h3>Sign-in setup required</h3><p>Add the Clerk publishable and secret keys to the web app environment to enable secure authentication.</p></div>}<p className="auth-switch">New here? <a href="/sign-up">Create your free account</a></p><div className="auth-form-legal">By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</div></section>
    </div><footer className="auth-experience-footer"><span>© 2026 Apna Ghar</span><span>A place for every new beginning.</span><nav><a href="/">Home</a><a href="/search">Explore homes</a><a href="/help">Help & support</a></nav></footer>
  </main>;
}
