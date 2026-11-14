import type { Metadata } from "next";
import ProfileClient from "./profile-client";
import { NOINDEX_ROBOTS } from "../utils/seo";

export const metadata: Metadata = {
  title: "My Profile | Apna Ghar",
  description: "Manage your Apna Ghar personal profile, preferences, and contact information.",
  robots: NOINDEX_ROBOTS,
};

export default function ProfilePage() {
  return <ProfileClient />;
}
