export const configuredApiBase = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

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
    try {
      const res = await fetch(sameOriginUrl, init);
      if (res.ok) return res;
      if (upstreamUrl !== sameOriginUrl) {
        return await fetch(upstreamUrl, init);
      }
      return res;
    } catch {
      return await fetch(upstreamUrl, init);
    }
  }

  return fetch(upstreamUrl, init);
}
