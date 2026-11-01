import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.INTERNAL_API_URL ||
  process.env.API_UPSTREAM_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers });
}

async function forward(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
      cache: "no-store",
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (payload === null) return errorResponse("Property service returned an invalid response.", 502);
    return NextResponse.json(payload, { status: response.status, headers });
  } catch {
    return errorResponse("Property service is temporarily unavailable. Please try again.", 503);
  } finally {
    clearTimeout(timeout);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const identifier = params.get("id")?.trim();
  const endpoint = identifier
    ? `${API_BASE}/properties/${encodeURIComponent(identifier)}`
    : `${API_BASE}/properties?${params.toString()}`;
  return forward(endpoint);
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return errorResponse("Authentication required.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("A valid property payload is required.", 400);
  }

  return forward(`${API_BASE}/properties`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
