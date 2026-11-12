"use client";

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

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <MarketplaceHeader
        active={current}
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
      active={current}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      pathname={pathname}
    />
  );
}
