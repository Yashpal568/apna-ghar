"use client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import MarketplaceHeader from "./MarketplaceHeader";

type Props = { active?: string; searchValue?: string; onSearchChange?: (value: string) => void };

function AuthenticatedHeader({ active, searchValue, onSearchChange }: Props) {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  return <MarketplaceHeader active={active} isSignedIn={Boolean(isSignedIn)} signOut={signOut} searchValue={searchValue} onSearchChange={onSearchChange} />;
}

export default function SiteHeader({ active = "home", searchValue, onSearchChange }: Props) {
  const pathname = usePathname();
  const current = active !== "home"
    ? active
    : pathname === "/"
      ? "home"
      : pathname.startsWith("/messages")
        ? "messages"
        : pathname.startsWith("/saved")
          ? "saved"
          : pathname.startsWith("/search") || pathname.startsWith("/property/")
            ? "search"
            : pathname.startsWith("/list-property") || pathname.startsWith("/my-listings") || pathname.startsWith("/profile")
              ? "account"
              : "home";

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <MarketplaceHeader active={current} searchValue={searchValue} onSearchChange={onSearchChange} />;
  }
  return <AuthenticatedHeader active={current} searchValue={searchValue} onSearchChange={onSearchChange} />;
}
