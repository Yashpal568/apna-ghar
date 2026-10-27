import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Create account | Apna Ghar" };

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="auth-route-shell"><section className="auth-route-card"><a className="auth-route-brand" href="/">Apna Ghar</a><h1>Create your account</h1><p>Authentication is not configured for this environment yet. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to the web app environment, then restart the dev server.</p><a className="button button-primary button-full" href="/">Back to home</a></section></main>;
  }

  return <main className="auth-route-shell"><div className="auth-route-heading"><a className="auth-route-brand" href="/">Apna Ghar</a><p>Create an account to save homes and manage property listings.</p></div><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/profile" /></main>;
}
