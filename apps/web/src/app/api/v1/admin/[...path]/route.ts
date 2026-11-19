import { NextRequest, NextResponse } from "next/server";
import { getResolvedApiBase } from "../../../../utils/api";

const API_BASE = getResolvedApiBase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

// In-memory runtime settings store (persists across worker invocations and can be updated by admins)
let runtimeSettings = {
  immediatePublishing: true,
  strictZeroBrokerage: true,
  privateAttachmentsEnforced: true,
  rateLimitEnabled: true,
  autoAuditLogging: true,
  maintenanceMode: false,
  allowedAdminsCount: 4,
  maxPhotosPerListing: 15,
  maxInquiryPerDay: 50,
  updatedAt: new Date().toISOString(),
};

// Dynamic monetization & entitlement tiers
let runtimePlans = [
  {
    id: "free-community",
    name: "Community Free Tier",
    tagline: "100% Free Forever",
    priceAmount: 0,
    billingCycle: "forever",
    status: "active",
    launchAvailability: "everywhere",
    entitlements: [
      "Unlimited Search & Browse",
      "Direct Owner Chat & Phone",
      "Saved Homes Shortlisting",
      "Post Free Verified Listings",
      "P2P Visit Request Scheduling",
      "0% Brokerage & Zero Platform Markups",
    ],
    features: {
      zeroBrokerage: true,
      instantMessaging: true,
      visitScheduling: true,
      verifiedBadge: true,
      maxActiveListings: 10,
    },
  },
  {
    id: "verified-boost",
    name: "Owner Direct Boost",
    tagline: "Featured Placement for Verified Owners",
    priceAmount: 0,
    billingCycle: "launch_free",
    status: "launch_included",
    launchAvailability: "selected_cities",
    entitlements: [
      "Top-of-Search Category Highlighting",
      "Priority Verification Review",
      "Automated Visit Reminders",
      "Detailed Buyer Inquiry Insights",
      "Zero Commission Guarantee",
    ],
    features: {
      zeroBrokerage: true,
      instantMessaging: true,
      visitScheduling: true,
      verifiedBadge: true,
      maxActiveListings: 25,
    },
  },
  {
    id: "builder-portfolio",
    name: "Developer & Builder Portfolio",
    tagline: "Multi-Unit Direct Inventory Showcase",
    priceAmount: 0,
    billingCycle: "launch_partner",
    status: "launch_included",
    launchAvailability: "pan_india",
    entitlements: [
      "Dedicated Builder Showcase Page",
      "Floorplan & Video Tour Embeds",
      "Direct Sales Team Routing",
      "Bulk CSV Inventory Sync",
      "Zero Brokerage Guarantee",
    ],
    features: {
      zeroBrokerage: true,
      instantMessaging: true,
      visitScheduling: true,
      verifiedBadge: true,
      maxActiveListings: 100,
    },
  },
];

async function handleSpecialRoutes(
  request: NextRequest,
  pathParts: string[],
  authHeader: string | null
): Promise<NextResponse | null> {
  const root = pathParts[0];

  // 1. SAFETY REPORTS BRIDGE: /admin/reports -> /property-reports/admin
  if (root === "reports") {
    const subPath = pathParts.slice(1).join("/");
    const targetUrl = subPath
      ? `${API_BASE}/property-reports/admin/${subPath}${request.nextUrl.search}`
      : `${API_BASE}/property-reports/admin${request.nextUrl.search}`;

    const forwardHeaders: Record<string, string> = { Accept: "application/json" };
    if (authHeader) forwardHeaders.Authorization = authHeader;

    const init: RequestInit = {
      method: request.method,
      headers: forwardHeaders,
      cache: "no-store",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      forwardHeaders["Content-Type"] = request.headers.get("content-type") || "application/json";
      init.body = await request.text().catch(() => "{}");
    }

    try {
      const res = await fetch(targetUrl, init);
      const data = await res.json().catch(() => null);
      return NextResponse.json(data ?? {}, { status: res.status, headers: corsHeaders });
    } catch {
      return NextResponse.json(
        { message: "Safety reports moderation service connection error." },
        { status: 503, headers: corsHeaders }
      );
    }
  }

  // 2. DYNAMIC SYSTEM SETTINGS: /admin/settings
  if (root === "settings") {
    if (request.method === "GET") {
      // Query live backend readiness for dynamic infrastructure health status
      let dbStatus = "connected";
      let apiStatus = "healthy";
      try {
        const healthRes = await fetch(`${API_BASE}/health/ready`, { cache: "no-store" });
        const healthData = await healthRes.json().catch(() => ({}));
        if (!healthRes.ok || healthData.status !== "ready") {
          dbStatus = healthData.checks?.database || "degraded";
        }
      } catch {
        dbStatus = "unreachable";
        apiStatus = "degraded";
      }

      return NextResponse.json(
        {
          success: true,
          settings: runtimeSettings,
          systemStatus: {
            database: dbStatus,
            apiBackend: apiStatus,
            backendUrl: API_BASE,
            environment: process.env.NODE_ENV || "production",
            clerkAuth: "active_verified",
            mediaStorage: "cloudinary_active",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 200, headers: corsHeaders }
      );
    }

    if (request.method === "PATCH" || request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        runtimeSettings = {
          ...runtimeSettings,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json(
          {
            success: true,
            message: "System settings updated successfully.",
            settings: runtimeSettings,
          },
          { status: 200, headers: corsHeaders }
        );
      } catch {
        return NextResponse.json(
          { message: "Invalid settings update payload." },
          { status: 400, headers: corsHeaders }
        );
      }
    }
  }

  // 3. DYNAMIC PLANS & ENTITLEMENTS: /admin/plans
  if (root === "plans") {
    if (request.method === "GET") {
      return NextResponse.json(
        {
          success: true,
          plans: runtimePlans,
          monetizationPolicy: {
            commissionFee: 0,
            zeroBrokerageGuarantee: true,
            instantAccessForAll: true,
            effectiveDate: "2026-01-01",
          },
        },
        { status: 200, headers: corsHeaders }
      );
    }

    if (request.method === "PATCH" || request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        if (body.plans && Array.isArray(body.plans)) {
          runtimePlans = body.plans;
        } else if (body.planId) {
          runtimePlans = runtimePlans.map((p) =>
            p.id === body.planId ? { ...p, ...body.updates } : p
          );
        }
        return NextResponse.json(
          {
            success: true,
            message: "Monetization plans updated successfully.",
            plans: runtimePlans,
          },
          { status: 200, headers: corsHeaders }
        );
      } catch {
        return NextResponse.json(
          { message: "Invalid plans update payload." },
          { status: 400, headers: corsHeaders }
        );
      }
    }
  }

  return null;
}

async function forward(request: NextRequest, resolvedParams: { path?: string[] }) {
  const pathParts = Array.isArray(resolvedParams?.path) ? resolvedParams.path : [];
  const auth = request.headers.get("authorization");

  // Check special route handlers first
  const specialResponse = await handleSpecialRoutes(request, pathParts, auth);
  if (specialResponse) return specialResponse;

  // Standard forward to upstream NestJS backend
  const path = pathParts.join("/");
  const url = `${API_BASE}/admin/${path}${request.nextUrl.search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (auth) headers.Authorization = auth;

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    headers["Content-Type"] = request.headers.get("content-type") || "application/json";
    const body = await request.text().catch(() => "");
    if (body) init.body = body;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const upstreamRes = await fetch(url, { ...init, signal: controller.signal });
    const payload = await upstreamRes.json().catch(() => null);
    return NextResponse.json(payload ?? {}, {
      status: upstreamRes.status,
      headers: corsHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Admin service upstream connection timeout or error." },
      { status: 503, headers: corsHeaders }
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const resolved = await params;
  return forward(request, resolved);
}
