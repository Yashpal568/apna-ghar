import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign in | Apna Ghar" };

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="auth-route-shell"><section className="auth-route-card"><a className="auth-route-brand" href="/">Apna Ghar</a><h1>Sign in to Apna Ghar</h1><p>Authentication is not configured for this environment yet. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to the web app environment, then restart the dev server.</p><a className="button button-primary button-full" href="/">Back to home</a></section></main>;
  }

  return <main className="auth-route-shell"><div className="auth-route-heading"><a className="auth-route-brand" href="/">Apna Ghar</a><p>Welcome back. Find your next place.</p></div><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/profile" /></main>;
}
