import type { Metadata } from "next";
import MarketplaceHome from "./components/MarketplaceHome";

export const metadata: Metadata = {
  title: "Apna Ghar | Direct Owner Property Marketplace",
  description: "Explore homes, apartments, plots and commercial properties across India. Search by locality, compare details and post your property on Apna Ghar.",
};

export default function HomePage() {
  return <MarketplaceHome />;
}
