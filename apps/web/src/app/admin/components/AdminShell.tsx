"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import ThemePicker from "../../components/ThemePicker";

export type AdminSection =
  | "overview"
  | "listings"
  | "users"
  | "reports"
  | "categories"
  | "audit-logs"
  | "plans"
  | "settings";

interface AdminShellProps {
  activeSection: AdminSection;
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  pendingReportsCount?: number;
}

export default function AdminShell({
  activeSection,
  children,
  breadcrumbs = [],
  title,
  description,
  actions,
  pendingReportsCount = 0,
}: AdminShellProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const displayName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Administrator";

  const userEmail = user?.primaryEmailAddress?.emailAddress || "admin@apnaghar.in";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "AD";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      window.location.href = "/";
    } finally {
      setSigningOut(false);
    }
  };

  const navItems = [
    {
      group: "WORKSPACE",
      items: [
        {
          id: "overview",
          label: "Overview",
          href: "/admin",
          badge: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          ),
        },
        {
          id: "listings",
          label: "Listings",
          href: "/admin/listings",
          badge: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
              <path d="M10 6h4" />
              <path d="M10 10h4" />
              <path d="M10 14h4" />
              <path d="M10 18h4" />
            </svg>
          ),
        },
        {
          id: "users",
          label: "Users & Accounts",
          href: "/admin/users",
          badge: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          id: "reports",
          label: "Safety Reports",
          href: "/admin/reports",
          badge: pendingReportsCount > 0 ? `${pendingReportsCount}` : null,
          badgeColor: "rose",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          ),
        },
        {
          id: "categories",
          label: "Categories",
          href: "/admin/categories",
          badge: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              <path d="M12 10v4" />
              <path d="M10 12h4" />
            </svg>
          ),
        },
        {
          id: "audit-logs",
          label: "Audit Logs",
          href: "/admin/audit-logs",
          badge: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "CONFIGURATION",
      items: [
        {
          id: "plans",
          label: "Plans & Entitlements",
          href: "/admin/plans",
          badge: "0% Fee",
          badgeColor: "emerald",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          ),
        },
        {
          id: "settings",
          label: "System Settings",
          href: "/admin/settings",
          badge: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="21" y2="21" />
              <line x1="4" x2="20" y1="14" y2="14" />
              <line x1="4" x2="20" y1="7" y2="7" />
              <circle cx="9" cy="21" r="2" />
              <circle cx="15" cy="14" r="2" />
              <circle cx="11" cy="7" r="2" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className="shadcn-admin-layout">
      {/* 1. TOP NAVBAR */}
      <header className="shadcn-admin-navbar">
        <div className="shadcn-admin-navbar-left">
          {/* Mobile hamburger button */}
          <button
            type="button"
            className="shadcn-admin-menu-toggle"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle admin sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>

          {/* Brand */}
          <Link href="/admin" className="shadcn-admin-brand">
            <span className="shadcn-admin-brand-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <div className="shadcn-admin-brand-copy">
              <strong>Apna Ghar</strong>
              <span>ADMIN CONSOLE</span>
            </div>
          </Link>

          {/* Breadcrumb trail */}
          <div className="shadcn-admin-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/admin" className="shadcn-admin-crumb">Console</Link>
            <span className="shadcn-admin-crumb-sep">/</span>
            {breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, i) => (
                <span key={i} className="shadcn-admin-crumb-item">
                  {crumb.href ? (
                    <Link href={crumb.href} className="shadcn-admin-crumb">{crumb.label}</Link>
                  ) : (
                    <span className="shadcn-admin-crumb is-active">{crumb.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span className="shadcn-admin-crumb-sep">/</span>}
                </span>
              ))
            ) : (
              <span className="shadcn-admin-crumb is-active">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace("-", " ")}
              </span>
            )}
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="shadcn-admin-navbar-right">
          {/* Live Infrastructure Badge */}
          <div className="shadcn-admin-health-badge" title="Production MongoDB Atlas & Render API Connected">
            <span className="shadcn-admin-pulse-dot" />
            <span>MongoDB Atlas Online</span>
          </div>

          {/* View Marketplace Button */}
          <Link href="/" target="_blank" className="shadcn-admin-nav-btn is-secondary" title="Open marketplace in new tab">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
            <span>View Marketplace</span>
          </Link>

          {/* Theme switcher */}
          <div className="shadcn-admin-theme-wrap">
            <ThemePicker compact />
          </div>

          {/* Admin User Profile Pill & Dropdown */}
          <div className="shadcn-admin-user-pill-wrap">
            <button
              type="button"
              className="shadcn-admin-user-pill"
              onClick={() => setUserDropdownOpen((v) => !v)}
              aria-label="Admin account menu"
              aria-expanded={userDropdownOpen}
            >
              <div className="shadcn-admin-user-avatar">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={displayName} />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="shadcn-admin-user-online" />
              </div>
              <div className="shadcn-admin-user-meta">
                <strong className="shadcn-admin-user-name">{displayName}</strong>
                <span className="shadcn-admin-role-badge">Super Admin</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shadcn-admin-chevron">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="shadcn-admin-dropdown-backdrop"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="shadcn-admin-dropdown-menu" role="menu">
                  <div className="shadcn-admin-dropdown-header">
                    <strong>{displayName}</strong>
                    <small>{userEmail}</small>
                    <span className="shadcn-admin-role-pill">Verified Administrator</span>
                  </div>
                  <div className="shadcn-admin-dropdown-divider" />
                  <Link href="/profile" className="shadcn-admin-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>My Profile</span>
                  </Link>
                  <Link href="/admin/settings" className="shadcn-admin-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>System Settings</span>
                  </Link>
                  <div className="shadcn-admin-dropdown-divider" />
                  <button
                    type="button"
                    className="shadcn-admin-dropdown-signout"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN WORKSPACE */}
      <div className="shadcn-admin-body">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="shadcn-admin-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* SIDEBAR */}
        <aside className={`shadcn-admin-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
          <div className="shadcn-admin-sidebar-scroll">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="shadcn-admin-nav-group">
                <span className="shadcn-admin-group-label">{group.group}</span>
                <nav className="shadcn-admin-group-list">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`shadcn-admin-nav-link ${isActive ? "is-active" : ""}`}
                      >
                        <span className="shadcn-admin-nav-icon">{item.icon}</span>
                        <span className="shadcn-admin-nav-text">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`shadcn-admin-nav-badge is-${item.badgeColor || "default"}`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <span className="shadcn-admin-active-indicator" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Sidebar Footer Infrastructure Health Card */}
          <div className="shadcn-admin-sidebar-footer">
            <div className="shadcn-admin-system-card">
              <div className="shadcn-admin-system-row">
                <span className="shadcn-admin-system-dot is-green" />
                <span className="shadcn-admin-system-title">MongoDB Atlas</span>
                <span className="shadcn-admin-system-val">Connected</span>
              </div>
              <div className="shadcn-admin-system-row">
                <span className="shadcn-admin-system-dot is-blue" />
                <span className="shadcn-admin-system-title">Render API</span>
                <span className="shadcn-admin-system-val">200 OK</span>
              </div>
              <div className="shadcn-admin-system-row">
                <span className="shadcn-admin-system-dot is-emerald" />
                <span className="shadcn-admin-system-title">Clerk Identity</span>
                <span className="shadcn-admin-system-val">Enforced</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="shadcn-admin-main">
          {/* Page Top Heading Bar */}
          {(title || actions) && (
            <div className="shadcn-admin-page-head">
              <div className="shadcn-admin-page-title-wrap">
                <span className="shadcn-admin-page-eyebrow">
                  {activeSection.toUpperCase().replace("-", " ")}
                </span>
                {title && <h1 className="shadcn-admin-page-title">{title}</h1>}
                {description && <p className="shadcn-admin-page-desc">{description}</p>}
              </div>
              {actions && <div className="shadcn-admin-page-actions">{actions}</div>}
            </div>
          )}

          {/* Workspace Page Content */}
          <div className="shadcn-admin-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
