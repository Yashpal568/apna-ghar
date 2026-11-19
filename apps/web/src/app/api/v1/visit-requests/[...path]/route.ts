import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../utils/api";

const API_BASE = getResolvedApiBase();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const subpath = path.join("/");
  const authorization = request.headers.get("authorization") || "";
  const response = await fetch(`${API_BASE}/visit-requests/${subpath}`, {
    headers: {
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status, headers });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const subpath = path.join("/");
  const authorization = request.headers.get("authorization") || "";
  const body = await request.text();
  const response = await fetch(`${API_BASE}/visit-requests/${subpath}`, {
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
  return NextResponse.json(data, { status: response.status, headers });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const subpath = path.join("/");
  const authorization = request.headers.get("authorization") || "";
  const body = await request.text();
  const response = await fetch(`${API_BASE}/visit-requests/${subpath}`, {
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
  return NextResponse.json(data, { status: response.status, headers });
}
