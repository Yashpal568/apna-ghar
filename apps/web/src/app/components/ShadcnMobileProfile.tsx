"use client";

import { useState } from "react";
import ThemePicker from "./ThemePicker";

export type ShadcnUserProfile = {
  id?: string;
  fullName?: string;
  primaryEmail?: string;
  imageUrl?: string;
};

export type ShadcnMobileProfileProps = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ShadcnUserProfile | null;
  onClose?: () => void;
  signOut?: (options: { redirectUrl: string }) => Promise<void>;
  variant?: "sheet" | "embedded";
  signInHref?: string;
  signUpHref?: string;
};

export default function ShadcnMobileProfile({
  isLoaded,
  isSignedIn,
  user,
  onClose,
  signOut,
  variant = "embedded",
  signInHref = "/sign-in",
  signUpHref = "/sign-up",
}: ShadcnMobileProfileProps) {
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    user?.fullName?.trim() ||
    user?.primaryEmail?.split("@")[0] ||
    "User";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "U";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (signOut) {
        await signOut({ redirectUrl: "/" });
      } else if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } finally {
      setSigningOut(false);
      onClose?.();
    }
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <div className={`shadcn-mobile-profile-root is-${variant}`}>
      {/* 1. SKELETON LOADING STATE */}
      {!isLoaded ? (
        <div className="shadcn-profile-skeleton" aria-hidden="true">
          <div className="shadcn-skeleton-avatar" />
          <div className="shadcn-skeleton-lines">
            <div className="shadcn-skeleton-line is-title" />
            <div className="shadcn-skeleton-line is-sub" />
          </div>
        </div>
      ) : isSignedIn ? (
        /* 2. AUTHENTICATED USER STATE */
        <div className="shadcn-profile-auth-wrap">
          {/* User Identity Card */}
          <div className="shadcn-profile-identity-card">
            <div className="shadcn-profile-avatar-outer">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="shadcn-profile-avatar-img"
                />
              ) : (
                <span className="shadcn-profile-avatar-initials">{initials}</span>
              )}
              <span className="shadcn-profile-online-badge" aria-label="Online status" />
            </div>

            <div className="shadcn-profile-identity-info">
              <div className="shadcn-profile-name-row">
                <span className="shadcn-profile-display-name">{displayName}</span>
                <span className="shadcn-profile-role-pill">Verified</span>
              </div>
              {user?.primaryEmail && (
                <span className="shadcn-profile-user-email" title={user.primaryEmail}>
                  {user.primaryEmail}
                </span>
              )}
            </div>
          </div>

          {/* Section Header: Account & Activity */}
          <div className="shadcn-profile-section-heading">
            <span>Account &amp; Management</span>
          </div>

          {/* Grouped Interactive Item Cards */}
          <div className="shadcn-profile-card-group" role="menu" aria-label="Account navigation">
            {/* Item 1: My Profile */}
            <a
              href="/profile"
              className="shadcn-profile-menu-card"
              role="menuitem"
              onClick={handleLinkClick}
            >
              <div className="shadcn-profile-menu-card-left">
                <span className="shadcn-profile-icon-box is-blue" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div className="shadcn-profile-card-text">
                  <span className="shadcn-profile-card-title">My Profile</span>
                  <span className="shadcn-profile-card-sub">Personal details &amp; preferences</span>
                </div>
              </div>
              <span className="shadcn-profile-chevron" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </a>

            {/* Item 2: My Properties */}
            <a
              href="/my-listings"
              className="shadcn-profile-menu-card"
              role="menuitem"
              onClick={handleLinkClick}
            >
              <div className="shadcn-profile-menu-card-left">
                <span className="shadcn-profile-icon-box is-emerald" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                    <path d="M10 6h4" />
                    <path d="M10 10h4" />
                    <path d="M10 14h4" />
                    <path d="M10 18h4" />
                  </svg>
                </span>
                <div className="shadcn-profile-card-text">
                  <span className="shadcn-profile-card-title">My Properties</span>
                  <span className="shadcn-profile-card-sub">Manage listings &amp; visibility</span>
                </div>
              </div>
              <span className="shadcn-profile-chevron" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </a>

            {/* Item 3: Saved Homes */}
            <a
              href="/saved"
              className="shadcn-profile-menu-card"
              role="menuitem"
              onClick={handleLinkClick}
            >
              <div className="shadcn-profile-menu-card-left">
                <span className="shadcn-profile-icon-box is-rose" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </span>
                <div className="shadcn-profile-card-text">
                  <span className="shadcn-profile-card-title">Saved Homes</span>
                  <span className="shadcn-profile-card-sub">Bookmarked listings &amp; alerts</span>
                </div>
              </div>
              <span className="shadcn-profile-chevron" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </a>

            {/* Item 4: Messages */}
            <a
              href="/messages"
              className="shadcn-profile-menu-card"
              role="menuitem"
              onClick={handleLinkClick}
            >
              <div className="shadcn-profile-menu-card-left">
                <span className="shadcn-profile-icon-box is-violet" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <div className="shadcn-profile-card-text">
                  <span className="shadcn-profile-card-title">Messages</span>
                  <span className="shadcn-profile-card-sub">Direct owner chats &amp; inquiries</span>
                </div>
              </div>
              <span className="shadcn-profile-chevron" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </a>
          </div>

          {/* Section Header: Preferences */}
          <div className="shadcn-profile-section-heading">
            <span>Preferences</span>
          </div>

          {/* Theme / Appearance Card */}
          <div className="shadcn-profile-theme-card">
            <div className="shadcn-profile-theme-left">
              <span className="shadcn-profile-icon-box is-amber" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </span>
              <div className="shadcn-profile-card-text">
                <span className="shadcn-profile-card-title">Theme</span>
                <span className="shadcn-profile-card-sub">Light, dark, or system</span>
              </div>
            </div>
            <div className="shadcn-profile-theme-picker">
              <ThemePicker compact />
            </div>
          </div>

          {/* Post Property Primary Button */}
          <a
            href="/list-property"
            className="shadcn-profile-post-btn"
            onClick={handleLinkClick}
          >
            <span className="shadcn-profile-post-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="shadcn-profile-post-label">Post a property</span>
            <span className="shadcn-profile-zero-pill">0% Fee</span>
          </a>

          {/* Sign Out Destructive Button */}
          <button
            type="button"
            className="shadcn-profile-signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <svg
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      ) : (
        /* 3. GUEST / LOGGED-OUT STATE */
        <div className="shadcn-profile-guest-card">
          <div className="shadcn-profile-guest-icon-wrap" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="shadcn-profile-guest-info">
            <strong className="shadcn-profile-guest-title">Account Access</strong>
            <p className="shadcn-profile-guest-desc">
              Sign in to manage saved homes, message verified owners directly, and list properties with 0% brokerage.
            </p>
          </div>
          <div className="shadcn-profile-guest-actions">
            <a href={signInHref} className="shadcn-profile-btn-primary" onClick={handleLinkClick}>
              Sign In
            </a>
            <a href={signUpHref} className="shadcn-profile-btn-secondary" onClick={handleLinkClick}>
              Create Free Account
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
