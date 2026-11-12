import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.INTERNAL_API_URL ||
  process.env.API_UPSTREAM_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { propertyId: rawPropertyId } = await params;
  const propertyId = rawPropertyId?.trim();
  if (!propertyId) {
    return NextResponse.json(
      { message: "Property ID is required." },
      { status: 400, headers: corsHeaders }
    );
  }

  const body = await request.json().catch(() => ({}));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const upstream = `${API_BASE}/conversations/property/${encodeURIComponent(propertyId)}`;
    const response = await fetch(upstream, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body || {}),
      cache: "no-store",
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (payload === null) {
      return NextResponse.json(
        { message: "Messaging service returned an invalid response." },
        { status: 502, headers: corsHeaders }
      );
    }
    return NextResponse.json(payload, { status: response.status, headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { message: "Messaging service is temporarily unavailable. Please try again." },
      { status: 503, headers: corsHeaders }
    );
  } finally {
    clearTimeout(timeout);
  }
}

