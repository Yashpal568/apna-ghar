"use client";

import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", paths: ["/"], icon: "M3 10.8 12 3l9 7.8M5.5 9.5V21h13V9.5M9 21v-7h6v7" },
  { href: "/search", label: "Explore", paths: ["/search"], icon: "M20 20l-4.5-4.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" },
  { href: "/list-property", label: "Post", paths: ["/list-property"], icon: "M12 5v14M5 12h14", isPost: true },
  { href: "/my-listings", label: "My listings", paths: ["/my-listings", "/list-property"], icon: "M3 10 12 3l9 7M5 9v12h14V9M9 21v-6h6v6" },
  { href: "/profile", label: "Profile", paths: ["/profile", "/security"], icon: "M20 21a8 8 0 0 0-16 0M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="ag-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const active = item.paths.some((path) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/"));
        return (
          <a key={item.href} href={item.href} className={`${active ? "is-active" : ""}${item.isPost ? " ag-bottom-nav-post" : ""}`} aria-current={active ? "page" : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
