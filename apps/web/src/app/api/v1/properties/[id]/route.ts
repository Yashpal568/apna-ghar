import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../utils/api";

const API_BASE = getResolvedApiBase();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(context.params);
  const id = resolvedParams?.id;
  if (!id || id.toLowerCase() === "undefined" || id.toLowerCase() === "null") {
    return NextResponse.json({ message: "Property not found" }, { status: 404, headers });
  }

  try {
    const endpoint = `${API_BASE}/properties/${encodeURIComponent(id)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const payload = await response.json().catch(() => null);
    if (payload === null) {
      return NextResponse.json(
        { message: "Property service returned an invalid response." },
        { status: 502, headers }
      );
    }

    return NextResponse.json(payload, { status: response.status, headers });
  } catch (err) {
    console.error("Property proxy forward error:", err);
    return NextResponse.json(
      { message: "Property service is temporarily unavailable." },
      { status: 503, headers }
    );
  }
}
