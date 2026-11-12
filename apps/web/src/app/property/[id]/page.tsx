import type { Metadata } from "next";
import PropertyDetailLive from "../../components/PropertyDetailLive";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id?: string }> | { id?: string };
};

const KNOWN_VERIFIED_METADATA: Record<
  string,
  { title: string; city: string; state: string; price: string; description: string; image: string }
> = {
  "werwtw-mvuzhfat": {
    title: "plot for sale",
    city: "Amritsar",
    state: "Punjab",
    price: "₹1.52 Cr",
    description: "Verified residential plot for sale in Amritsar, Punjab. Direct owner listing with zero brokerage on Apna Ghar.",
    image: "https://images.pexels.com/photos/36676879/pexels-photo-36676879.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  "6ae495c723896cb331116519": {
    title: "plot for sale",
    city: "Amritsar",
    state: "Punjab",
    price: "₹1.52 Cr",
    description: "Verified residential plot for sale in Amritsar, Punjab. Direct owner listing with zero brokerage on Apna Ghar.",
    image: "https://images.pexels.com/photos/36676879/pexels-photo-36676879.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(props.params);
  const id = typeof resolved?.id === "string" ? resolved.id.trim() : "";
  if (!id || id.toLowerCase() === "undefined" || id.toLowerCase() === "null") {
    return { title: "Property Details | Apna Ghar" };
  }

  let property: {
    title?: string;
    description?: string;
    slug?: string;
    priceAmount?: number;
    listingType?: string;
    location?: { city?: string; state?: string; locality?: string };
    imageUrls?: string[];
  } | null = null;

  try {
    const apiBase = (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://apna-ghar-api-j4fo.onrender.com/api/v1"
    ).replace(/\/$/, "");
    const res = await fetch(`${apiBase}/properties/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      property = await res.json();
    }
  } catch {
    // Gracefully fallback below if API is unreachable during SSR
  }

  const known = KNOWN_VERIFIED_METADATA[id.toLowerCase()];
  const title = property?.title || known?.title || "Property Details";
  const locality = property?.location?.locality ? `${property.location.locality}, ` : "";
  const city = property?.location?.city || known?.city || "";
  const state = property?.location?.state || known?.state || "";
  const locationStr = [locality + city, state].filter(Boolean).join(", ");
  const priceDisplay = property?.priceAmount
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(property.priceAmount)
    : known?.price || "";
  const tx = property?.listingType === "rent" ? "for Rent" : "for Sale";

  const fullTitle = `${title}${locationStr ? ` in ${locationStr}` : ""} ${tx} | Apna Ghar`;
  const description =
    property?.description && property.description.trim().length > 10
      ? `${priceDisplay ? `${priceDisplay} • ` : ""}${property.description.slice(0, 150)}… Direct owner on Apna Ghar.`
      : known?.description || `Explore ${title}${locationStr ? ` in ${locationStr}` : ""}. Direct owner listing with zero brokerage on Apna Ghar.`;

  const imageUrl = property?.imageUrls?.[0] || known?.image || "https://images.pexels.com/photos/36676879/pexels-photo-36676879.jpeg?auto=compress&cs=tinysrgb&w=1200";
  const canonicalUrl = `/property/${encodeURIComponent(property?.slug || id)}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: "Apna Ghar",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PropertyPage(props: PageProps) {
  const resolved = await Promise.resolve(props.params);
  const id =
    typeof resolved?.id === "string" && resolved.id.trim() !== ""
      ? resolved.id.trim()
      : undefined;
  return <PropertyDetailLive id={id} />;
}
