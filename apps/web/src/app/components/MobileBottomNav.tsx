"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

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

export default function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Check unread count if available (via localStorage or custom event)
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

  // Is this item active based on current route?
  const isItemActive = (item: NavItem): boolean => {
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

                {item.id === "profile" && (
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
                )}

                <span className="ag-bottom-nav-active-pill" aria-hidden="true" />
              </span>
              <span className="ag-bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
