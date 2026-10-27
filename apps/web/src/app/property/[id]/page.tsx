import type { Metadata } from "next";
import PropertyDetailLive from "../../components/PropertyDetailLive";

export const metadata: Metadata = { title: "Property details", description: "Explore property details on Apna Ghar." };

export default function PropertyPage({ params }: { params: { id: string } }) {
  return <PropertyDetailLive id={params.id} />;
}
