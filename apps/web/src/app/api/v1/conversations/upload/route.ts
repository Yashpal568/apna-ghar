import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../utils/api";

const API_BASE = getResolvedApiBase();

const privateHeaders = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: privateHeaders });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ") || authorization.length <= 7) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return errorResponse("Choose a file to attach.", 400);
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimes.includes(file.type)) {
      return errorResponse("Only JPG, PNG, WebP images and PDF documents are allowed (up to 10MB).", 400);
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      return errorResponse("File must be between 1 byte and 10MB.", 400);
    }

    // Always delegate identity verification, magic-byte validation, rate limiting,
    // and storage to the authenticated NestJS API. Never upload to Cloudinary
    // directly from this proxy or return an unverified data-URL fallback.
    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file, file.name || "attachment");

    const upstreamRes = await fetch(`${API_BASE}/conversations/upload`, {
      method: "POST",
      headers: { Authorization: authorization, Accept: "application/json" },
      body: upstreamFormData,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const payload = await upstreamRes.json().catch(() => null);
    if (payload === null) {
      return errorResponse("Messaging service returned an invalid response.", 502);
    }
    return NextResponse.json(payload, { status: upstreamRes.status, headers: privateHeaders });
  } catch {
    return errorResponse("Messaging service is temporarily unavailable. Please try again.", 503);
  }
}
