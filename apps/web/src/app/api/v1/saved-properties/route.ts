import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../utils/api";

const API_BASE = getResolvedApiBase();

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
  const authorization = request.headers.get("authorization") || "";
  const response = await fetch(`${API_BASE}/saved-properties`, {
    headers: {
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status, headers });
}
