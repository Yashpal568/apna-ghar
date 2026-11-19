export function getResolvedApiBase(): string {
  const candidates = [
    process.env.INTERNAL_API_URL,
    process.env.API_UPSTREAM_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "string" && !candidate.includes("j4fo.onrender.com")) {
      return candidate.replace(/\/$/, "");
    }
  }
  return "https://apna-ghar-api-w0dk.onrender.com/api/v1";
}

export const configuredApiBase = getResolvedApiBase();

export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    // In browser, use same-origin /api/v1 route handlers to prevent cross-origin CORS errors
    return `/api/v1${cleanPath}`;
  }
  return `${configuredApiBase}${cleanPath}`;
}

export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const sameOriginUrl = `/api/v1${cleanPath}`;
  const upstreamUrl = `${configuredApiBase}${cleanPath}`;

  if (typeof window !== "undefined") {
    // 1. In browser, try same-origin proxy first for fast response and zero CORS/IPv6 issues
    try {
      const res = await fetch(sameOriginUrl, init);
      if (res.ok || res.status === 401 || res.status === 403 || res.status === 400 || res.status === 422) {
        return res;
      }
    } catch {
      // Fall through to try direct upstream
    }

    // 2. Direct upstream fallback if same-origin proxy is unreachable
    if (upstreamUrl !== sameOriginUrl && configuredApiBase.startsWith("http")) {
      try {
        return await fetch(upstreamUrl, init);
      } catch (err) {
        throw err;
      }
    }
  }

  return fetch(upstreamUrl, init);
}
