import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.INTERNAL_API_URL ||
  process.env.API_UPSTREAM_URL ||
  (process.env.NODE_ENV !== "production" ? "http://localhost:4000/api/v1" : "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const forwardHeaders: Record<string, string> = { Accept: "application/json" };
  if (auth) forwardHeaders.Authorization = auth;

  try {
    const res = await fetch(`${API_BASE}/property-reports${request.nextUrl.search}`, {
      headers: forwardHeaders,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers });
  } catch {
    return NextResponse.json({ message: "Reports service unavailable" }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const forwardHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (auth) forwardHeaders.Authorization = auth;

  try {
    const body = await request.text().catch(() => "{}");
    const res = await fetch(`${API_BASE}/property-reports`, {
      method: "POST",
      headers: forwardHeaders,
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers });
  } catch {
    return NextResponse.json({ message: "Reports service unavailable" }, { status: 503, headers });
  }
}
