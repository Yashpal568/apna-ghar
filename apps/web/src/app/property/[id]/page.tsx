import type { Metadata } from "next";
import PropertyDetailLive from "../../components/PropertyDetailLive";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id?: string }> | { id?: string };
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(props.params);
  const id = typeof resolved?.id === "string" ? resolved.id.trim() : "";
  if (!id || id.toLowerCase() === "undefined" || id.toLowerCase() === "null") {
    return { title: "Property Details | Apna Ghar" };
  }
  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
    const res = await fetch(`${apiBase}/properties/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const title = typeof data?.title === "string" ? data.title : "Property";
      const city = data?.location?.city ? ` in ${data.location.city}` : "";
      return {
        title: `${title}${city} | Apna Ghar`,
        description: typeof data?.description === "string" && data.description.trim()
          ? data.description.slice(0, 160)
          : `View details for ${title} on Apna Ghar.`,
      };
    }
  } catch {
    // Gracefully fallback if API is unreachable during metadata generation
  }
  return { title: "Property Details | Apna Ghar" };
}

export default async function PropertyPage(props: PageProps) {
  const resolved = await Promise.resolve(props.params);
  const id = typeof resolved?.id === "string" && resolved.id.trim() !== ""
    ? resolved.id.trim()
    : undefined;
  return <PropertyDetailLive id={id} />;
}
