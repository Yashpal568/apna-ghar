import type { Metadata } from "next";
import MessagesCenter from "../components/MessagesCenter";
import { NOINDEX_ROBOTS } from "../utils/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Messages | Apna Ghar",
  description: "Private buyer and seller conversations on Apna Ghar.",
  robots: NOINDEX_ROBOTS,
};

export default function MessagesPage() {
  return <MessagesCenter />;
}
