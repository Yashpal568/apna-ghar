"use client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import MarketplaceHeader from "./MarketplaceHeader";
export default function SiteHeader({active="home",searchValue,onSearchChange}:{active?:string;searchValue?:string;onSearchChange?:(value:string)=>void}) {
 const {isSignedIn}=useAuth(); const {signOut}=useClerk(); const pathname=usePathname();
 const current = active !== "home" ? active : pathname === "/" ? "home" : pathname.startsWith("/messages") ? "messages" : pathname.startsWith("/saved") ? "saved" : pathname.startsWith("/search") || pathname.startsWith("/property/") ? "search" : pathname.startsWith("/list-property") || pathname.startsWith("/my-listings") || pathname.startsWith("/profile") ? "account" : "home";
 return <MarketplaceHeader active={current} isSignedIn={Boolean(isSignedIn)} signOut={signOut} searchValue={searchValue} onSearchChange={onSearchChange}/>;
}
