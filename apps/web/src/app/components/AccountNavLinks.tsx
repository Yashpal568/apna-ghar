"use client";

import { useAuth, useClerk } from "@clerk/nextjs";

export default function AccountNavLinks({ mobile = false }: { mobile?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  if (!isLoaded) return null;

  if (isSignedIn) {
    const logout = <button className={mobile ? "ag-mobile-logout" : "ag-signout-link"} type="button" onClick={() => void signOut({ redirectUrl: "/" })}>
      <span aria-hidden="true">↪</span> Sign out
    </button>;
    return mobile
      ? <><a href="/profile">My account</a><a href="/my-listings">My properties</a>{logout}</>
      : <><a className="ag-account-link" href="/profile">My account</a><a className="ag-account-link" href="/my-listings">My properties</a>{logout}</>;
  }
  return mobile
    ? <><a href="/sign-in">Sign in</a><a href="/sign-up">Create account</a></>
    : <><a className="ag-signin-link" href="/sign-in">Sign in</a><a className="ag-signup-link" href="/sign-up">Sign up</a></>;
}
