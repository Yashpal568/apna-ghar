"use client";
import { useAuth, useClerk } from "@clerk/nextjs";
import MarketplaceHeader from "./MarketplaceHeader";
export default function SiteHeader({active="home"}:{active?:string}) {
 const {isSignedIn}=useAuth(); const {signOut}=useClerk();
 return <MarketplaceHeader active={active} isSignedIn={Boolean(isSignedIn)} signOut={signOut}/>;
}
