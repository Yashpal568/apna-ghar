"use client";

import { useAuth } from "@clerk/nextjs";

export default function AccountNavLinks({ mobile = false }: { mobile?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) {
    return mobile ? <><a href="/profile">My account</a><a href="/my-listings">My listings</a></> : <a className="ag-account-link" href="/profile">My account</a>;
  }
  return mobile ? <><a href="/sign-in">Sign in</a><a href="/sign-up">Create account</a></> : <><a className="ag-signin-link" href="/sign-in">Sign in</a><a className="ag-signup-link" href="/sign-up">Sign up</a></>;
}
