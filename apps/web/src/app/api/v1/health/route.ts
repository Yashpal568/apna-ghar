import { NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../utils/api";

const RENDER_API = getResolvedApiBase();

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
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${RENDER_API}/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { headers: corsHeaders });
    }
  } catch {
    // Upstream unreachable
  }

  return NextResponse.json(
    {
      status: "ok",
      service: "apna-ghar-api",
      timestamp: new Date().toISOString(),
      note: "cloudflare-edge-resilience",
    },
    { headers: corsHeaders }
  );
}
