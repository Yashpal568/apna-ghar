"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import MarketplaceHeader from "./MarketplaceHeader";

type Props = {
  active?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

function AuthenticatedHeader({
  active,
  searchValue,
  onSearchChange,
  pathname,
}: Props & { pathname: string }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const { signOut } = useClerk();

  const isLoaded = authLoaded && userLoaded;

  return (
    <MarketplaceHeader
      active={active}
      isLoaded={isLoaded}
      isSignedIn={Boolean(isSignedIn)}
      user={
        user
          ? {
              id: user.id,
              fullName: user.fullName || user.firstName || user.username || "",
              primaryEmail: user.primaryEmailAddress?.emailAddress || "",
              imageUrl: user.imageUrl || "",
            }
          : null
      }
      signOut={signOut}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      pathname={pathname}
    />
  );
}

export default function SiteHeader({ active = "home", searchValue, onSearchChange }: Props) {
  const pathname = usePathname();
  const [urlActive, setUrlActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const computeActiveFromUrl = () => {
      const path = window.location.pathname;
      if (path === "/commercial") {
        setUrlActive("commercial");
      } else if (path === "/plots" || path === "/plot") {
        setUrlActive("plots");
      } else if (path === "/buy") {
        setUrlActive("buy");
      } else if (path === "/rent") {
        setUrlActive("rent");
      } else if (path.startsWith("/search")) {
        const sp = new URLSearchParams(window.location.search);
        const t = (sp.get("type") || sp.get("categoryId") || "").trim().toLowerCase();
        const tx = (sp.get("transaction") || "").trim().toLowerCase();
        if (t === "commercial") {
          setUrlActive("commercial");
        } else if (t === "plot" || t === "plots") {
          setUrlActive("plots");
        } else if (tx === "buy") {
          setUrlActive("buy");
        } else if (tx === "rent") {
          setUrlActive("rent");
        } else {
          setUrlActive("search");
        }
      } else {
        setUrlActive(null);
      }
    };

    computeActiveFromUrl();
    window.addEventListener("popstate", computeActiveFromUrl);
    return () => window.removeEventListener("popstate", computeActiveFromUrl);
  }, [pathname]);

  const current =
    active !== "home"
      ? active
      : pathname === "/"
        ? "home"
        : pathname.startsWith("/messages")
          ? "messages"
          : pathname.startsWith("/saved")
            ? "saved"
            : pathname.startsWith("/search")
              ? "search"
              : pathname.startsWith("/list-property") ||
                  pathname.startsWith("/my-listings") ||
                  pathname.startsWith("/profile")
                ? "account"
                : "home";

  const effectiveActive = urlActive ?? current;

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <MarketplaceHeader
        active={effectiveActive}
        isLoaded={true}
        isSignedIn={false}
        user={null}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        pathname={pathname}
      />
    );
  }

  return (
    <AuthenticatedHeader
      active={effectiveActive}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      pathname={pathname}
    />
  );
}
