import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.INTERNAL_API_URL ||
  process.env.API_UPSTREAM_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: corsHeaders });
}

async function proxy(
  url: string,
  method: "GET" | "POST" | "PATCH",
  authorization: string,
  body?: unknown,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (payload === null) {
      return errorResponse("Messaging service returned an invalid response.", 502);
    }
    return NextResponse.json(payload, { status: response.status, headers: corsHeaders });
  } catch {
    return errorResponse("Messaging service is temporarily unavailable. Please try again.", 503);
  } finally {
    clearTimeout(timeout);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return errorResponse("Authentication required.", 401);
  }

  const params = request.nextUrl.searchParams;
  const conversationId = params.get("id");
  const action = params.get("action");
  let endpoint = `${API_BASE}/conversations`;

  if (conversationId && action === "messages") {
    endpoint += `/${encodeURIComponent(conversationId)}/messages`;
  } else if (conversationId && action === "offers") {
    endpoint += `/${encodeURIComponent(conversationId)}/offers`;
  } else if (conversationId || action) {
    return errorResponse("Invalid messaging request.", 400);
  }

  const query = new URLSearchParams();
  const before = params.get("before");
  const limit = params.get("limit");
  if (before) query.set("before", before);
  if (limit) query.set("limit", limit);
  const suffix = query.toString();
  if (suffix) endpoint += `?${suffix}`;

  return proxy(endpoint, "GET", authorization);
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return errorResponse("Authentication required.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse("A valid request body is required.", 400);
  }

  const { conversationId, propertyId, action, text, amount, message, offerId, attachment } = body as Record<string, unknown>;
  if (typeof propertyId === "string" && propertyId.trim()) {
    return proxy(`${API_BASE}/conversations/property/${encodeURIComponent(propertyId.trim())}`, "POST", authorization, { message });
  }
  if (typeof conversationId !== "string" || !conversationId.trim()) {
    return errorResponse("Conversation ID or Property ID is required.", 400);
  }

  const id = encodeURIComponent(conversationId);
  let endpoint = `${API_BASE}/conversations/${id}/messages`;
  let payload: Record<string, unknown> = { text, attachment };

  if (action === "offer") {
    endpoint = `${API_BASE}/conversations/${id}/offers`;
    payload = { amount, message };
  } else if (action === "counter") {
    if (typeof offerId !== "string" || !offerId) {
      return errorResponse("Offer ID is required for a counter-offer.", 400);
    }
    endpoint = `${API_BASE}/conversations/${id}/offers/${encodeURIComponent(offerId)}/counter`;
    payload = { amount, message };
  } else if (action !== undefined && action !== "message") {
    return errorResponse("Unsupported messaging action.", 400);
  }

  return proxy(endpoint, "POST", authorization, payload);
}

export async function PATCH(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return errorResponse("Authentication required.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse("A valid request body is required.", 400);
  }

  const { conversationId, action, offerId, response: offerAction } = body as Record<string, unknown>;
  if (typeof conversationId !== "string" || !conversationId.trim()) {
    return errorResponse("Conversation ID is required.", 400);
  }

  const id = encodeURIComponent(conversationId);
  let endpoint = `${API_BASE}/conversations/${id}/read`;
  let payload: Record<string, unknown> = {};

  if (action === "respond") {
    if (typeof offerId !== "string" || !offerId) {
      return errorResponse("Offer ID is required to respond to an offer.", 400);
    }
    endpoint = `${API_BASE}/conversations/${id}/offers/${encodeURIComponent(offerId)}/respond`;
    payload = { action: offerAction };
  } else if (action !== undefined && action !== "read") {
    return errorResponse("Unsupported messaging action.", 400);
  }

  return proxy(endpoint, "PATCH", authorization, payload);
}
