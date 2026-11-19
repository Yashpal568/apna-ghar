import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../utils/api";

const API_BASE = getResolvedApiBase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function forward(request: NextRequest, resolvedParams: { path?: string[] }) {
  const pathParts = Array.isArray(resolvedParams?.path) ? resolvedParams.path : [];
  const path = pathParts.join("/");
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

export async function GET(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}
