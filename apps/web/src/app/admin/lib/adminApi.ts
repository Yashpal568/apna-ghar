"use client";

export type AdminOverviewData = {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    totalProperties: number;
    activeListings: number;
    hiddenListings: number;
    removedListings: number;
    pendingReports: number;
    resolvedReports: number;
  };
  recentUsers: Array<{
    clerkUserId: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    accountStatus?: string;
    createdAt?: string;
  }>;
  recentProperties: Array<{
    _id: string;
    title: string;
    slug: string;
    priceAmount: number;
    listingType: string;
    status: string;
    location?: { city?: string; locality?: string };
    createdAt?: string;
  }>;
  recentAuditLogs: Array<{
    _id: string;
    adminUserId: string;
    action: string;
    targetType: string;
    targetId: string;
    reason?: string;
    createdAt?: string;
  }>;
};

export type AdminPropertyRecord = {
  _id: string;
  title: string;
  slug: string;
  ownerId: string;
  priceAmount: number;
  listingType: "sale" | "rent";
  categoryId: string;
  status: "active" | "hidden_by_owner" | "removed_by_admin" | "deleted";
  location?: { state?: string; city?: string; locality?: string };
  imageUrls?: string[];
  videoUrls?: string[];
  viewsCount?: number;
  publishedAt?: string;
  createdAt?: string;
};

export type AdminUserRecord = {
  clerkUserId: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  about?: string;
  role?: string;
  accountStatus?: string;
  createdAt?: string;
  lastActiveAt?: string;
};

export type AdminReportRecord = {
  _id: string;
  propertyId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolutionNotes?: string;
  createdAt?: string;
};

export type AdminCategoryRecord = {
  key: string;
  label: string;
  icon: string;
  active: boolean;
  sortOrder: number;
};

export type AdminAuditRecord = {
  _id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

export type AdminSystemSettings = {
  immediatePublishing: boolean;
  strictZeroBrokerage: boolean;
  privateAttachmentsEnforced: boolean;
  rateLimitEnabled: boolean;
  autoAuditLogging: boolean;
  maintenanceMode: boolean;
  allowedAdminsCount: number;
  maxPhotosPerListing: number;
  maxInquiryPerDay: number;
  updatedAt: string;
};

export type AdminSystemStatus = {
  database: string;
  apiBackend: string;
  backendUrl: string;
  environment: string;
  clerkAuth: string;
  mediaStorage: string;
  timestamp: string;
};

export type AdminPlanRecord = {
  id: string;
  name: string;
  tagline: string;
  priceAmount: number;
  billingCycle: string;
  status: string;
  launchAvailability: string;
  entitlements: string[];
  features: {
    zeroBrokerage: boolean;
    instantMessaging: boolean;
    visitScheduling: boolean;
    verifiedBadge: boolean;
    maxActiveListings: number;
  };
};

const BASE = "/api/v1/admin";

export async function fetchAdminApi<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      typeof body.message === "string"
        ? body.message
        : `Admin API request failed with HTTP ${res.status}.`;
    throw new Error(errorMsg);
  }

  return body as T;
}
