import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../utils/api";

const API_BASE = getResolvedApiBase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const subpath = path.join("/");
  const authorization = request.headers.get("authorization") || "";
  const params = request.nextUrl.searchParams.toString();
  const endpoint = `${API_BASE}/conversations/${subpath}${params ? `?${params}` : ""}`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status, headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const subpath = path.join("/");
  const authorization = request.headers.get("authorization") || "";
  const body = await request.text();

  const response = await fetch(`${API_BASE}/conversations/${subpath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status, headers: corsHeaders });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const subpath = path.join("/");
  const authorization = request.headers.get("authorization") || "";
  const body = await request.text();

  const response = await fetch(`${API_BASE}/conversations/${subpath}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status, headers: corsHeaders });
}
