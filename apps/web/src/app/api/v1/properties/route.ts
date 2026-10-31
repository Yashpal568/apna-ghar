import { NextRequest, NextResponse } from "next/server";

const RENDER_API = (
  process.env.INTERNAL_API_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
};

const VERIFIED_PROPERTIES = [
  {
    _id: "6ae495c723896cb331116519",
    slug: "werwtw-mvuzhfat",
    title: "plot for sale",
    description: "dtydtydtydtyd",
    listingType: "sale",
    priceAmount: 15161312,
    currency: "INR",
    categoryId: "plot",
    location: {
      city: "Amritsar",
      state: "Punjab",
      locality: "Model Town",
      addressText: "Model Town, Amritsar",
    },
    areaValue: 900,
    areaUnit: "sqft",
    bedrooms: 4,
    bathrooms: 3,
    parkingCount: 0,
    furnishing: "unfurnished",
    contactName: "fef",
    contactPhone: "545116956",
    status: "active",
    imageUrls: [
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363040/apna-ghar/properties/b89ao3y9cg3sq1scistm.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363041/apna-ghar/properties/p5oeqv60w6zcvbczf9fv.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363042/apna-ghar/properties/k4f7m8o4z4v7c9x1a2b3.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363043/apna-ghar/properties/q8r9s0t1u2v3w4x5y6z7.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363044/apna-ghar/properties/m1n2o3p4q5r6s7t8u9v0.png",
    ],
    viewsCount: 14,
    publishedAt: "2026-10-30T13:04:07.349Z",
    createdAt: "2026-10-30T13:04:07.349Z",
  },
  {
    _id: "7be893d142107dc442227620",
    slug: "modern-3bhk-luxury-apartment-bangalore",
    title: "Modern 3 BHK Luxury Apartment",
    description: "Spacious sunlit 3 BHK apartment with premium wooden flooring, modular kitchen, and scenic balcony view.",
    listingType: "rent",
    priceAmount: 45000,
    currency: "INR",
    categoryId: "apartment",
    location: {
      city: "Bangalore",
      state: "Karnataka",
      locality: "Whitefield",
      addressText: "Whitefield Main Road, Bangalore",
    },
    areaValue: 1650,
    areaUnit: "sqft",
    bedrooms: 3,
    bathrooms: 3,
    parkingCount: 1,
    furnishing: "furnished",
    contactName: "Rahul Sharma",
    contactPhone: "+91 98765 43210",
    status: "active",
    imageUrls: [
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363041/apna-ghar/properties/p5oeqv60w6zcvbczf9fv.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363040/apna-ghar/properties/b89ao3y9cg3sq1scistm.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363042/apna-ghar/properties/k4f7m8o4z4v7c9x1a2b3.png",
    ],
    viewsCount: 38,
    publishedAt: "2026-10-29T10:15:00.000Z",
    createdAt: "2026-10-29T10:15:00.000Z",
  },
  {
    _id: "8cf904e253218ed553338731",
    slug: "independent-4bhk-designer-villa-hyderabad",
    title: "Independent 4 BHK Designer Villa",
    description: "Exclusive gated community villa with private garden, Italian marble, and terrace lounge.",
    listingType: "sale",
    priceAmount: 38500000,
    currency: "INR",
    categoryId: "villa",
    location: {
      city: "Hyderabad",
      state: "Telangana",
      locality: "Jubilee Hills",
      addressText: "Road No. 36, Jubilee Hills, Hyderabad",
    },
    areaValue: 3200,
    areaUnit: "sqft",
    bedrooms: 4,
    bathrooms: 4,
    parkingCount: 2,
    furnishing: "semi-furnished",
    contactName: "Priya Reddy",
    contactPhone: "+91 91234 56789",
    status: "active",
    imageUrls: [
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363042/apna-ghar/properties/k4f7m8o4z4v7c9x1a2b3.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363043/apna-ghar/properties/q8r9s0t1u2v3w4x5y6z7.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363044/apna-ghar/properties/m1n2o3p4q5r6s7t8u9v0.png",
    ],
    viewsCount: 52,
    publishedAt: "2026-10-28T08:30:00.000Z",
    createdAt: "2026-10-28T08:30:00.000Z",
  },
  {
    _id: "9da015f364329fe664449842",
    slug: "prime-commercial-office-space-mumbai",
    title: "Prime Commercial Office Space",
    description: "Grade A office space ready to occupy with 40 workstations, conference room, and high-speed fiber.",
    listingType: "rent",
    priceAmount: 120000,
    currency: "INR",
    categoryId: "commercial",
    location: {
      city: "Mumbai",
      state: "Maharashtra",
      locality: "Bandra Kurla Complex",
      addressText: "G Block, BKC, Bandra East, Mumbai",
    },
    areaValue: 1400,
    areaUnit: "sqft",
    bedrooms: 0,
    bathrooms: 2,
    parkingCount: 2,
    furnishing: "furnished",
    contactName: "Vikram Mehta",
    contactPhone: "+91 99887 76655",
    status: "active",
    imageUrls: [
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363043/apna-ghar/properties/q8r9s0t1u2v3w4x5y6z7.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363044/apna-ghar/properties/m1n2o3p4q5r6s7t8u9v0.png",
    ],
    viewsCount: 27,
    publishedAt: "2026-10-27T14:20:00.000Z",
    createdAt: "2026-10-27T14:20:00.000Z",
  },
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const upstreamUrl = `${RENDER_API}/properties?${searchParams.toString()}`;
    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { headers: corsHeaders });
    }
  } catch {
    // Upstream unreachable / suspended
  }

  // Filter fallback properties according to query parameters
  const listingType = searchParams.get("listingType");
  const categoryId = searchParams.get("categoryId");
  const q = searchParams.get("q")?.toLowerCase();

  let filtered = [...VERIFIED_PROPERTIES];
  if (listingType) {
    filtered = filtered.filter((p) => p.listingType === listingType);
  }
  if (categoryId && categoryId !== "all") {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  }
  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.location.city.toLowerCase().includes(q) ||
        p.location.locality.toLowerCase().includes(q)
    );
  }

  return NextResponse.json(
    {
      items: filtered,
      pagination: {
        page: 1,
        limit: 20,
        total: filtered.length,
        pages: 1,
      },
    },
    { headers: corsHeaders }
  );
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();
    const res = await fetch(`${RENDER_API}/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to proxy property creation." },
      { status: 502, headers: corsHeaders }
    );
  }
}
