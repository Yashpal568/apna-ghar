"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import ShadcnMobileProfile, { ShadcnUserProfile } from "./ShadcnMobileProfile";

interface NavItem {
  id: string;
  href: string;
  label: string;
  paths: string[];
  exact?: boolean;
  isCenter?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    href: "/",
    label: "Home",
    paths: ["/"],
    exact: true,
  },
  {
    id: "search",
    href: "/search",
    label: "Search",
    paths: ["/search"],
  },
  {
    id: "post",
    href: "/list-property",
    label: "Post",
    paths: ["/list-property"],
    isCenter: true,
  },
  {
    id: "chat",
    href: "/messages",
    label: "Chat",
    paths: ["/messages"],
  },
  {
    id: "profile",
    href: "/profile",
    label: "Profile",
    paths: ["/profile", "/security", "/my-listings", "/saved"],
  },
];

function AuthenticatedMobileNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname() || "/";
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const { signOut } = useClerk();

  const isLoaded = authLoaded && userLoaded;
  const userSummary: ShadcnUserProfile | null = user
    ? {
        id: user.id,
        fullName: user.fullName || user.firstName || user.username || "",
        primaryEmail: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl || "",
      }
    : null;

  // Close sheet on route navigation or Escape
  useEffect(() => {
    setProfileSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isItemActive = (item: NavItem): boolean => {
    if (item.id === "profile") {
      return profileSheetOpen || item.paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
    }
    if (item.exact) {
      return pathname === item.href;
    }
    return item.paths.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(path + "/") ||
        pathname.startsWith(path + "?")
    );
  };

  return (
    <>
      <nav className="ag-bottom-nav" aria-label="Mobile navigation" role="navigation">
        <div className="ag-bottom-nav-pill">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);

            if (item.isCenter) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`ag-bottom-nav-item ag-bottom-nav-center ${active ? "is-active" : ""}`}
                  aria-label="Post Property"
                  aria-current={active ? "page" : undefined}
                >
                  <span className="ag-bottom-nav-post-circle" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ag-bottom-nav-post-svg"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="ag-bottom-nav-label">{item.label}</span>
                </Link>
              );
            }

            if (item.id === "profile") {
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`ag-bottom-nav-item ${active ? "is-active" : ""}`}
                  aria-label="Open profile options"
                  aria-expanded={profileSheetOpen}
                  onClick={() => setProfileSheetOpen((v) => !v)}
                >
                  <span className="ag-bottom-nav-icon-container">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ag-bottom-nav-svg"
                      aria-hidden="true"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="ag-bottom-nav-active-pill" aria-hidden="true" />
                  </span>
                  <span className="ag-bottom-nav-label">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`ag-bottom-nav-item ${active ? "is-active" : ""}`}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <span className="ag-bottom-nav-icon-container">
                  {item.id === "home" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ag-bottom-nav-svg"
                      aria-hidden="true"
                    >
                      <path d="M3 10.5 12 3l9 7.5v9a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-9Z" />
                    </svg>
                  )}

                  {item.id === "search" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ag-bottom-nav-svg"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  )}

                  {item.id === "chat" && (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ag-bottom-nav-svg"
                        aria-hidden="true"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {unreadCount > 0 && (
                        <span
                          className="ag-bottom-nav-badge"
                          aria-label={`${unreadCount} unread messages`}
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </>
                  )}

                  <span className="ag-bottom-nav-active-pill" aria-hidden="true" />
                </span>
                <span className="ag-bottom-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* SHADCN STUDIO MOBILE PROFILE BOTTOM SHEET */}
      {profileSheetOpen && (
        <div className="shadcn-profile-sheet-wrapper">
          <button
            type="button"
            className="shadcn-profile-sheet-backdrop"
            onClick={() => setProfileSheetOpen(false)}
            aria-label="Close profile drawer"
          />
          <div
            className="shadcn-profile-sheet-container"
            role="dialog"
            aria-modal="true"
            aria-label="Account and Profile Navigation"
          >
            {/* Sheet Handle */}
            <div className="shadcn-profile-sheet-handle" aria-hidden="true" />

            {/* Sheet Header */}
            <div className="shadcn-profile-sheet-head">
              <div className="shadcn-profile-sheet-title-row">
                <span className="shadcn-profile-sheet-eyebrow">APNA GHAR</span>
                <h3 className="shadcn-profile-sheet-title">Profile &amp; Settings</h3>
              </div>
              <button
                type="button"
                className="shadcn-profile-sheet-close-btn"
                onClick={() => setProfileSheetOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {/* Sheet Content Body */}
            <div className="shadcn-profile-sheet-body">
              <ShadcnMobileProfile
                isLoaded={isLoaded}
                isSignedIn={Boolean(isSignedIn)}
                user={userSummary}
                onClose={() => setProfileSheetOpen(false)}
                signOut={signOut}
                variant="sheet"
                signInHref="/sign-in"
                signUpHref="/sign-up"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GuestMobileNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname() || "/";
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  useEffect(() => {
    setProfileSheetOpen(false);
  }, [pathname]);

  const isItemActive = (item: NavItem): boolean => {
    if (item.id === "profile") return profileSheetOpen;
    if (item.exact) return pathname === item.href;
    return item.paths.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(path + "/") ||
        pathname.startsWith(path + "?")
    );
  };

  return (
    <>
      <nav className="ag-bottom-nav" aria-label="Mobile navigation" role="navigation">
        <div className="ag-bottom-nav-pill">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);

            if (item.isCenter) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`ag-bottom-nav-item ag-bottom-nav-center ${active ? "is-active" : ""}`}
                  aria-label="Post Property"
                  aria-current={active ? "page" : undefined}
                >
                  <span className="ag-bottom-nav-post-circle" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ag-bottom-nav-post-svg"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="ag-bottom-nav-label">{item.label}</span>
                </Link>
              );
            }

            if (item.id === "profile") {
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`ag-bottom-nav-item ${active ? "is-active" : ""}`}
                  aria-label="Open profile options"
                  aria-expanded={profileSheetOpen}
                  onClick={() => setProfileSheetOpen((v) => !v)}
                >
                  <span className="ag-bottom-nav-icon-container">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ag-bottom-nav-svg"
                      aria-hidden="true"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="ag-bottom-nav-active-pill" aria-hidden="true" />
                  </span>
                  <span className="ag-bottom-nav-label">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`ag-bottom-nav-item ${active ? "is-active" : ""}`}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <span className="ag-bottom-nav-icon-container">
                  {item.id === "home" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ag-bottom-nav-svg" aria-hidden="true">
                      <path d="M3 10.5 12 3l9 7.5v9a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-9Z" />
                    </svg>
                  )}
                  {item.id === "search" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ag-bottom-nav-svg" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  )}
                  {item.id === "chat" && (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ag-bottom-nav-svg" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="ag-bottom-nav-badge" aria-label={`${unreadCount} unread messages`}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                  <span className="ag-bottom-nav-active-pill" aria-hidden="true" />
                </span>
                <span className="ag-bottom-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {profileSheetOpen && (
        <div className="shadcn-profile-sheet-wrapper">
          <button
            type="button"
            className="shadcn-profile-sheet-backdrop"
            onClick={() => setProfileSheetOpen(false)}
            aria-label="Close profile drawer"
          />
          <div
            className="shadcn-profile-sheet-container"
            role="dialog"
            aria-modal="true"
            aria-label="Account and Profile Navigation"
          >
            <div className="shadcn-profile-sheet-handle" aria-hidden="true" />
            <div className="shadcn-profile-sheet-head">
              <div className="shadcn-profile-sheet-title-row">
                <span className="shadcn-profile-sheet-eyebrow">APNA GHAR</span>
                <h3 className="shadcn-profile-sheet-title">Profile &amp; Settings</h3>
              </div>
              <button
                type="button"
                className="shadcn-profile-sheet-close-btn"
                onClick={() => setProfileSheetOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className="shadcn-profile-sheet-body">
              <ShadcnMobileProfile
                isLoaded={true}
                isSignedIn={false}
                user={null}
                onClose={() => setProfileSheetOpen(false)}
                variant="sheet"
                signInHref="/sign-in"
                signUpHref="/sign-up"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MobileBottomNav() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const readUnread = () => {
      try {
        const stored =
          window.localStorage.getItem("apna_unread_count") ||
          window.localStorage.getItem("unread_messages_count");
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > 0) {
            setUnreadCount(parsed);
            return;
          }
        }
        setUnreadCount(0);
      } catch {
        setUnreadCount(0);
      }
    };

    readUnread();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "apna_unread_count" || e.key === "unread_messages_count") {
        readUnread();
      }
    };
    const handleCustom = (e: Event) => {
      const custom = e as CustomEvent<{ count: number }>;
      if (typeof custom.detail?.count === "number") {
        setUnreadCount(Math.max(0, custom.detail.count));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("apna:unread-count", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("apna:unread-count", handleCustom);
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <GuestMobileNav unreadCount={unreadCount} />;
  }

  return <AuthenticatedMobileNav unreadCount={unreadCount} />;
}
