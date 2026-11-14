import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

const API_BASE = (
  process.env.INTERNAL_API_URL ||
  process.env.API_UPSTREAM_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "Choose a file to attach." },
        { status: 400, headers: corsHeaders }
      );
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, WebP images and PDF documents are allowed (up to 10MB)." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File exceeds 10MB limit." },
        { status: 400, headers: corsHeaders }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const filename = file.name || (file.type === "application/pdf" ? "document.pdf" : "attachment.jpg");

    // Attempt 1: Direct server-signed Cloudinary upload if configured
    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "apna-ghar/messages";
        const resourceType = file.type.startsWith("image/") ? "image" : "raw";
        const signature = createHash("sha1")
          .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
          .digest("hex");

        const cFormData = new FormData();
        const buffer = await file.arrayBuffer();
        cFormData.append("file", new Blob([buffer], { type: file.type }), filename);
        cFormData.append("api_key", apiKey);
        cFormData.append("timestamp", String(timestamp));
        cFormData.append("folder", folder);
        cFormData.append("signature", signature);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
          { method: "POST", body: cFormData }
        );
        const result = (await cloudinaryResponse.json().catch(() => null)) as {
          secure_url?: string;
          public_id?: string;
        } | null;

        if (cloudinaryResponse.ok && result?.secure_url) {
          return NextResponse.json(
            {
              url: result.secure_url,
              filename,
              contentType: file.type,
              sizeBytes: file.size,
              publicId: result.public_id,
            },
            { status: 200, headers: corsHeaders }
          );
        }
      } catch (e) {
        console.warn("Cloudinary direct upload failed, attempting upstream API fallback", e);
      }
    }

    // Attempt 2: Forward to upstream API backend
    try {
      const upstreamFormData = new FormData();
      const buffer = await file.arrayBuffer();
      upstreamFormData.append("file", new Blob([buffer], { type: file.type }), filename);

      const upstreamRes = await fetch(`${API_BASE}/conversations/upload`, {
        method: "POST",
        headers: {
          Authorization: authorization,
        },
        body: upstreamFormData,
      });

      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        return NextResponse.json(data, { status: 200, headers: corsHeaders });
      }
    } catch (e) {
      console.warn("Upstream upload failed, generating data URL fallback", e);
    }

    // Attempt 3: Resilient fallback to base64 Data URL
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json(
      {
        url: dataUrl,
        filename,
        contentType: file.type,
        sizeBytes: file.size,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to process attachment." },
      { status: 500, headers: corsHeaders }
    );
  }
}
