import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.INTERNAL_API_URL ||
  process.env.API_UPSTREAM_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function forward(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const url = `${API_BASE}/admin/${path}${request.nextUrl.search}`;
  const auth = request.headers.get("authorization");

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (auth) headers.Authorization = auth;

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    headers["Content-Type"] = request.headers.get("content-type") || "application/json";
    const body = await request.text().catch(() => "");
    if (body) init.body = body;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const upstreamRes = await fetch(url, { ...init, signal: controller.signal });
    const payload = await upstreamRes.json().catch(() => null);
    return NextResponse.json(payload ?? {}, {
      status: upstreamRes.status,
      headers: corsHeaders,
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Admin service upstream connection timeout or error." },
      { status: 503, headers: corsHeaders },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params);
}
