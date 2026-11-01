"use client";

import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", paths: ["/"], icon: "M3 10.8 12 3l9 7.8M5.5 9.5V21h13V9.5M9 21v-7h6v7" },
  { href: "/search", label: "Search", paths: ["/search"], icon: "M20 20l-4.5-4.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" },
  { href: "/list-property", label: "Post", paths: ["/list-property"], icon: "M12 5v14M5 12h14" },
  { href: "/messages", label: "Chat", paths: ["/messages"], icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/profile", label: "Profile", paths: ["/profile", "/security"], icon: "M20 21a8 8 0 0 0-16 0M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="ag-bottom-nav" aria-label="Primary navigation">
      {items.map((item) => {
        const active = item.paths.some((path) =>
          path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/")
        );
        return (
          <a
            key={item.href}
            href={item.href}
            className={[`ag-bottom-nav-item`, active ? "is-active" : "", item.href === "/list-property" ? "ag-bottom-nav-post" : ""].filter(Boolean).join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <span className="ag-bottom-nav-icon">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            </span>
            <span className="ag-bottom-nav-label">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
