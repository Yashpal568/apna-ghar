import { NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
  { key: "apartment", label: "Apartments & flats", icon: "⌂", sortOrder: 1 },
  { key: "house", label: "Villas & houses", icon: "⌂", sortOrder: 2 },
  { key: "villa", label: "Villas", icon: "⌂", sortOrder: 3 },
  { key: "plot", label: "Plots & land", icon: "⌁", sortOrder: 4 },
  { key: "commercial", label: "Shops & offices", icon: "▤", sortOrder: 5 },
  { key: "pg", label: "PG & coliving", icon: "▧", sortOrder: 6 },
];

const RENDER_API = (
  process.env.INTERNAL_API_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${RENDER_API}/categories`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data, { headers: corsHeaders });
      }
    }
  } catch {
    // Graceful fallback to default verified categories
  }

  return NextResponse.json(DEFAULT_CATEGORIES, { headers: corsHeaders });
}
