import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../utils/api";

const API_BASE = getResolvedApiBase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const forwardHeaders: Record<string, string> = { Accept: "application/json" };
  if (auth) forwardHeaders.Authorization = auth;

  try {
    const url = `${API_BASE}/property-reports/admin${request.nextUrl.search}`;
    const res = await fetch(url, {
      headers: forwardHeaders,
      cache: "no-store",
    });
    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status, headers: corsHeaders });
  } catch {
    return NextResponse.json({ message: "Admin reports service unavailable" }, { status: 503, headers: corsHeaders });
  }
}
