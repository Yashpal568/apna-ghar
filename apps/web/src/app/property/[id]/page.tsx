import type { Metadata } from "next";
import PropertyDetailLive from "../../components/PropertyDetailLive";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  INDEXABLE_ROBOTS,
  NOINDEX_ROBOTS,
  getCanonicalUrl,
  generatePropertySchema,
  PropertySchemaData,
} from "../../utils/seo";

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

async function fetchProperty(id: string): Promise<{ property: PropertySchemaData | null; notFound: boolean }> {
  if (!id || id.toLowerCase() === "undefined" || id.toLowerCase() === "null") {
    return { property: null, notFound: true };
  }
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
      const data = await res.json();
      if (data && (data.status === "active" || !data.status) && !data.deletedAt) {
        return { property: data, notFound: false };
      }
      return { property: null, notFound: true };
    }
    if (res.status === 404) {
      return { property: null, notFound: true };
    }
  } catch {
    // API temporarily unreachable
  }
  return { property: null, notFound: false };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(props.params);
  const id = typeof resolved?.id === "string" ? resolved.id.trim() : "";
  if (!id || id.toLowerCase() === "undefined" || id.toLowerCase() === "null") {
    return {
      title: "Property Not Found | Apna Ghar",
      robots: NOINDEX_ROBOTS,
    };
  }

  const { property, notFound } = await fetchProperty(id);
  const known = KNOWN_VERIFIED_METADATA[id.toLowerCase()];

  if (notFound && !known) {
    return {
      title: "Property Not Available | Apna Ghar",
      description: "This property listing is no longer available or has been removed from Apna Ghar.",
      robots: NOINDEX_ROBOTS,
    };
  }

  const title = property?.title || known?.title || "Property Details";
  const locality = property?.location?.locality ? `${property.location.locality}, ` : "";
  const city = property?.location?.city || known?.city || "";
  const state = property?.location?.state || known?.state || "";
  const locationStr = [locality + city, state].filter(Boolean).join(", ");
  const priceDisplay = property?.priceAmount
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(property.priceAmount)
    : known?.price || "";
  const tx = property?.listingType === "rent" ? "for Rent" : "for Sale";

  const fullTitle = `${title}${locationStr ? ` in ${locationStr}` : ""} ${tx} | ${SITE_NAME}`;
  const description =
    property?.description && property.description.trim().length > 10
      ? `${priceDisplay ? `${priceDisplay} • ` : ""}${property.description.slice(0, 150)}… Direct owner on Apna Ghar.`
      : known?.description || `Explore ${title}${locationStr ? ` in ${locationStr}` : ""}. Direct owner listing with zero brokerage on Apna Ghar.`;

  const imageUrl = property?.imageUrls?.[0] || known?.image || DEFAULT_OG_IMAGE;
  const canonicalUrl = getCanonicalUrl(`/property/${encodeURIComponent(property?.slug || id)}`);

  return {
    title: fullTitle,
    description,
    robots: INDEXABLE_ROBOTS,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PropertyPage(props: PageProps) {
  const resolved = await Promise.resolve(props.params);
  const id =
    typeof resolved?.id === "string" && resolved.id.trim() !== ""
      ? resolved.id.trim()
      : undefined;

  let schemaData: PropertySchemaData | null = null;
  if (id) {
    const { property } = await fetchProperty(id);
    if (property) {
      schemaData = property;
    } else if (KNOWN_VERIFIED_METADATA[id.toLowerCase()]) {
      const known = KNOWN_VERIFIED_METADATA[id.toLowerCase()];
      schemaData = {
        _id: id,
        slug: id,
        title: known.title,
        description: known.description,
        priceAmount: 15200000,
        listingType: "sale",
        categoryId: "plot",
        location: { city: known.city, state: known.state },
        imageUrls: [known.image],
        publishedAt: new Date(),
      };
    }
  }

  return (
    <>
      {schemaData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generatePropertySchema(schemaData)),
          }}
        />
      ) : null}
      <PropertyDetailLive id={id} />
    </>
  );
}
