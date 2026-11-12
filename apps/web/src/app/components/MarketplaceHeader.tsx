"use client";

import { useEffect, useRef, useState } from "react";
import BrandLogo from "./BrandLogo";
import ThemePicker from "./ThemePicker";

export type HeaderUser = {
  id: string;
  fullName?: string;
  primaryEmail?: string;
  imageUrl?: string;
};

export type MarketplaceHeaderProps = {
  active?: string;
  isLoaded?: boolean;
  isSignedIn?: boolean;
  user?: HeaderUser | null;
  signOut?: (options: { redirectUrl: string }) => Promise<void>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pathname?: string;
};

export default function MarketplaceHeader({
  active = "home",
  isLoaded = true,
  isSignedIn = false,
  user = null,
  signOut,
  searchValue,
  onSearchChange,
  pathname = "",
}: MarketplaceHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [query, setQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  const value = searchValue ?? query;
  const setValue = onSearchChange ?? setQuery;

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close user dropdown on click outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Construct return redirect parameter for sign-in and sign-up
  const getRedirectParam = () => {
    if (!pathname || pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/forgot-password") {
      return "";
    }
    return `?redirect_url=${encodeURIComponent(pathname)}`;
  };
  const signInHref = `/sign-in${getRedirectParam()}`;
  const signUpHref = `/sign-up${getRedirectParam()}`;

  // Robust Sign-Out handler calling Clerk's actual signOut method
  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setUserMenuOpen(false);
    setMenuOpen(false);
    try {
      if (signOut) {
        await signOut({ redirectUrl: "/" });
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      window.location.href = "/";
    }
  };

  const displayName = user?.fullName || user?.primaryEmail?.split("@")[0] || "Account";
  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="agh-market-header-scope">
      <header className="agh-header">
        <div className="agh-header-main">
          {/* Brand Logo */}
          <a className="agh-brand" href="/" aria-label="Apna Ghar home">
            <BrandLogo />
          </a>

          {/* Top Search Input */}
          <form className="agh-top-search" action="/search" method="GET">
            <span aria-hidden="true">⌕</span>
            <input
              name="location"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search city, locality, project or landmark…"
              aria-label="Search properties"
            />
            <button type="submit" aria-label="Search">
              ⌕
            </button>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="agh-desktop-nav" aria-label="Main navigation">
            <a className={active === "search" || active === "home" ? "active" : ""} href="/search">
              Browse properties
            </a>
            <a className={active === "buy" ? "active" : ""} href="/search?transaction=buy">
              Buy
            </a>
            <a className={active === "rent" ? "active" : ""} href="/search?transaction=rent">
              Rent
            </a>
            <a href="/search?type=commercial">Commercial</a>
            <a href="/search?type=plot">Plots</a>
            <a className={active === "messages" ? "active" : ""} href="/messages">
              Messages
            </a>
          </nav>

          {/* Desktop Header Actions */}
          <div className="agh-header-actions">
            <ThemePicker compact />

            {/* STATE C: Authentication Loading Placeholder */}
            {!isLoaded ? (
              <div
                className="agh-auth-skeleton"
                aria-hidden="true"
                title="Loading session…"
              />
            ) : !isSignedIn ? (
              /* STATE A: Logged-out Visitor */
              <div className="agh-auth-guest-actions">
                <a href={signInHref} className="agh-signin-btn">
                  Sign in
                </a>
                <a href={signUpHref} className="agh-signup-btn">
                  Sign up
                </a>
              </div>
            ) : (
              /* STATE B: Authenticated User */
              <div className="agh-auth-user-actions">
                <a className="agh-post-btn" href="/list-property">
                  <span aria-hidden="true">＋</span>
                  <span>Post property</span>
                </a>

                {/* User Profile & Account Dropdown */}
                <div className="agh-user-menu-container" ref={userMenuRef}>
                  <button
                    type="button"
                    className={`agh-user-trigger ${userMenuOpen ? "is-active" : ""}`}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-label="User account menu"
                  >
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="agh-user-avatar-img" />
                    ) : (
                      <span className="agh-user-avatar-initials">{initials}</span>
                    )}
                    <span className="agh-user-trigger-name">{displayName}</span>
                    <span className="agh-user-trigger-caret" aria-hidden="true">
                      {userMenuOpen ? "▴" : "▾"}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="agh-user-dropdown" role="menu" aria-label="Account options">
                      <div className="agh-user-dropdown-header">
                        <div className="agh-user-dropdown-name">{displayName}</div>
                        {user?.primaryEmail && (
                          <div className="agh-user-dropdown-email">{user.primaryEmail}</div>
                        )}
                      </div>
                      <div className="agh-user-dropdown-divider" />
                      <a
                        href="/profile"
                        className="agh-user-dropdown-item"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="agh-dropdown-icon" aria-hidden="true">👤</span>
                        <span>My Profile</span>
                      </a>
                      <a
                        href="/my-listings"
                        className="agh-user-dropdown-item"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="agh-dropdown-icon" aria-hidden="true">▤</span>
                        <span>My Properties</span>
                      </a>
                      <a
                        href="/saved"
                        className="agh-user-dropdown-item"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="agh-dropdown-icon" aria-hidden="true">♥</span>
                        <span>Saved Homes</span>
                      </a>
                      <a
                        href="/messages"
                        className="agh-user-dropdown-item"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="agh-dropdown-icon" aria-hidden="true">💬</span>
                        <span>Messages</span>
                      </a>
                      <div className="agh-user-dropdown-divider" />
                      <button
                        type="button"
                        className="agh-user-dropdown-item agh-user-dropdown-signout"
                        role="menuitem"
                        onClick={handleSignOut}
                        disabled={signingOut}
                      >
                        <span className="agh-dropdown-icon" aria-hidden="true">↪</span>
                        <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="agh-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="agh-mobile-drawer"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="agh-mobile-search">
          <form action="/search" method="GET">
            <span aria-hidden="true">⌕</span>
            <input
              name="location"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search city or locality…"
              aria-label="Search properties"
            />
            <button type="submit">Search</button>
          </form>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <>
            <button
              className="agh-drawer-backdrop"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation overlay"
            />
            <nav className="agh-mobile-drawer" id="agh-mobile-drawer" aria-label="Mobile navigation">
              <div className="agh-drawer-head">
                <strong>Explore Apna Ghar</strong>
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  ×
                </button>
              </div>

              {/* User Identity Card in Drawer when Logged In */}
              {isLoaded && isSignedIn && (
                <div className="agh-drawer-user-card">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="agh-user-avatar-img" />
                  ) : (
                    <span className="agh-user-avatar-initials">{initials}</span>
                  )}
                  <div className="agh-drawer-user-info">
                    <strong>{displayName}</strong>
                    {user?.primaryEmail && <small>{user.primaryEmail}</small>}
                  </div>
                </div>
              )}

              <div className="agh-drawer-theme">
                <span>Appearance</span>
                <ThemePicker />
              </div>

              <a href="/">Home</a>
              <a href="/search">Browse all properties</a>
              <a href="/search?transaction=buy">Buy a property</a>
              <a href="/search?transaction=rent">Rent a property</a>
              <a href="/search?type=commercial">Commercial spaces</a>
              <a href="/search?type=plot">Plots &amp; land</a>

              {/* Mobile Drawer Auth Actions */}
              {!isLoaded ? (
                <div className="agh-drawer-skeleton" aria-hidden="true" />
              ) : isSignedIn ? (
                <>
                  <div className="agh-drawer-divider" />
                  <a href="/saved">Saved homes</a>
                  <a href="/my-listings">My listings</a>
                  <a href="/messages">Messages</a>
                  <a href="/profile">My profile</a>
                  <a className="agh-drawer-sell" href="/list-property">
                    Post a property
                  </a>
                  <button
                    type="button"
                    className="agh-drawer-signout"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </>
              ) : (
                <>
                  <div className="agh-drawer-divider" />
                  <a href={signInHref} className="agh-drawer-signin">
                    Sign in
                  </a>
                  <a href={signUpHref} className="agh-drawer-signup">
                    Create free account
                  </a>
                </>
              )}
            </nav>
          </>
        )}
      </header>
    </div>
  );
}
