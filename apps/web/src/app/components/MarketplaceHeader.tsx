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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const value = searchValue ?? query;
  const setValue = onSearchChange ?? setQuery;

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setUserMenuOpen(false);
        setMobileSearchOpen(false);
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
      <header className={`agh-header ${mobileSearchOpen ? "mobile-search-active" : ""}`}>
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
            <a className={active === "search" ? "active" : ""} href="/search">
              Browse properties
            </a>
            <a className={active === "buy" ? "active" : ""} href="/search?transaction=buy">
              Buy
            </a>
            <a className={active === "rent" ? "active" : ""} href="/search?transaction=rent">
              Rent
            </a>
            <a className={active === "commercial" ? "active" : ""} href="/search?type=commercial">
              Commercial
            </a>
            <a className={active === "plots" || active === "plot" ? "active" : ""} href="/search?type=plot">
              Plots
            </a>
            <a className={active === "messages" ? "active" : ""} href="/messages">
              Messages
            </a>
          </nav>

          {/* Desktop & Mobile Header Actions */}
          <div className="agh-header-actions">
            {/* Mobile Search Trigger Icon (shadcn outline button) */}
            <button
              type="button"
              className="agh-mobile-search-toggle"
              onClick={() => {
                setMobileSearchOpen(true);
                setMenuOpen(false);
                setTimeout(() => {
                  mobileSearchInputRef.current?.focus();
                }, 100);
              }}
              aria-label="Search properties"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

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
            onClick={() => {
              setMenuOpen((v) => {
                const next = !v;
                if (next) setMobileSearchOpen(false);
                return next;
              });
            }}
            aria-expanded={menuOpen}
            aria-controls="agh-mobile-drawer"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>

        {/* Mobile Full In-Navbar Search Bar (Replaces Navbar on Mobile when Open) */}
        {mobileSearchOpen && (
          <div className="agh-mobile-search-bar" role="search" aria-label="Search properties">
            <form
              action="/search"
              method="GET"
              className="agh-mobile-search-form"
              onSubmit={() => setMobileSearchOpen(false)}
            >
              {/* Back to normal navbar button (Lucide ArrowLeft) */}
              <button
                type="button"
                className="agh-mobile-search-back"
                onClick={() => setMobileSearchOpen(false)}
                aria-label="Close search and return to navbar"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </button>

              {/* shadcn Input Box */}
              <div className="agh-mobile-search-input-box">
                <svg
                  className="agh-mobile-search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={mobileSearchInputRef}
                  name="location"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Search city, locality, project..."
                  aria-label="Search properties"
                  autoComplete="off"
                />
                {value ? (
                  <button
                    type="button"
                    className="agh-mobile-search-clear"
                    onClick={() => {
                      setValue("");
                      mobileSearchInputRef.current?.focus();
                    }}
                    aria-label="Clear search text"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                ) : null}
              </div>

              {/* shadcn Primary Submit Button */}
              <button type="submit" className="agh-mobile-search-btn">
                Search
              </button>
            </form>
          </div>
        )}

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

              <a className={active === "home" ? "active" : ""} href="/" onClick={() => setMenuOpen(false)}>Home</a>
              <a className={active === "search" ? "active" : ""} href="/search" onClick={() => setMenuOpen(false)}>Browse all properties</a>
              <a className={active === "buy" ? "active" : ""} href="/search?transaction=buy" onClick={() => setMenuOpen(false)}>Buy a property</a>
              <a className={active === "rent" ? "active" : ""} href="/search?transaction=rent" onClick={() => setMenuOpen(false)}>Rent a property</a>
              <a className={active === "commercial" ? "active" : ""} href="/search?type=commercial" onClick={() => setMenuOpen(false)}>Commercial spaces</a>
              <a className={active === "plots" || active === "plot" ? "active" : ""} href="/search?type=plot" onClick={() => setMenuOpen(false)}>Plots &amp; land</a>

              {/* Mobile Drawer Auth Actions */}
              {!isLoaded ? (
                <div className="agh-drawer-skeleton" aria-hidden="true" />
              ) : isSignedIn ? (
                <>
                  <div className="agh-drawer-divider" />
                  <a href="/saved" onClick={() => setMenuOpen(false)}>Saved homes</a>
                  <a href="/my-listings" onClick={() => setMenuOpen(false)}>My listings</a>
                  <a href="/messages" onClick={() => setMenuOpen(false)}>Messages</a>
                  <a href="/profile" onClick={() => setMenuOpen(false)}>My profile</a>
                  <a className="agh-drawer-sell" href="/list-property" onClick={() => setMenuOpen(false)}>
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
                  <a href={signInHref} className="agh-drawer-signin" onClick={() => setMenuOpen(false)}>
                    Sign in
                  </a>
                  <a href={signUpHref} className="agh-drawer-signup" onClick={() => setMenuOpen(false)}>
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
