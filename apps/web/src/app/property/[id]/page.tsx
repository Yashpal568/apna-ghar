import PropertyDetailLive from "../../components/PropertyDetailLive";

export default function PropertyPage({ params }: { params: { id: string } }) {
  return <PropertyDetailLive id={params.id} />;
}
