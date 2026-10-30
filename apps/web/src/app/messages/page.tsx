import type { Metadata } from "next";
import MessagesCenter from "../components/MessagesCenter";
export const metadata: Metadata = { title: "Messages | Apna Ghar", description: "Private buyer and seller conversations on Apna Ghar." };
export default function MessagesPage() { return <MessagesCenter />; }
