import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../../../utils/api";

const API_BASE = getResolvedApiBase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const auth = request.headers.get("authorization");
  const forwardHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (auth) forwardHeaders.Authorization = auth;

  try {
    const body = await request.text().catch(() => "{}");
    const res = await fetch(`${API_BASE}/property-reports/admin/${encodeURIComponent(reportId)}/status`, {
      method: "POST",
      headers: forwardHeaders,
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: corsHeaders });
  } catch {
    return NextResponse.json({ message: "Admin reports moderation service unavailable" }, { status: 503, headers: corsHeaders });
  }
}
