import { NextRequest, NextResponse } from "next/server";

const RENDER_API = (
  process.env.INTERNAL_API_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const subPath = (params.path || []).join("/");
  const url = new URL(request.url);
  const upstreamUrl = `${RENDER_API}/${subPath}${url.search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  let body: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      body = null;
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const upstreamRes = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    const data = await upstreamRes.text();
    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Apna Ghar API upstream is currently unreachable or suspended on Render.",
        error: error instanceof Error ? error.message : "Service Unavailable",
      },
      { status: 503, headers: corsHeaders }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
