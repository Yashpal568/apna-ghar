import type { MetadataRoute } from 'next';
import { SITE_URL } from './utils/seo';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1.0, changeFrequency: 'daily' },
  { path: '/search', priority: 0.9, changeFrequency: 'daily' },
  { path: '/buy', priority: 0.9, changeFrequency: 'daily' },
  { path: '/rent', priority: 0.9, changeFrequency: 'daily' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/services', priority: 0.7, changeFrequency: 'monthly' },
  // City landing pages
  { path: '/mumbai', priority: 0.8, changeFrequency: 'daily' },
  { path: '/delhi', priority: 0.8, changeFrequency: 'daily' },
  { path: '/bengaluru', priority: 0.8, changeFrequency: 'daily' },
  { path: '/hyderabad', priority: 0.8, changeFrequency: 'daily' },
  { path: '/pune', priority: 0.8, changeFrequency: 'daily' },
  { path: '/amritsar', priority: 0.8, changeFrequency: 'daily' },
  // Category landing pages
  { path: '/apartments', priority: 0.8, changeFrequency: 'daily' },
  { path: '/houses', priority: 0.8, changeFrequency: 'daily' },
  { path: '/plots', priority: 0.8, changeFrequency: 'daily' },
  { path: '/villas', priority: 0.8, changeFrequency: 'daily' },
  { path: '/commercial', priority: 0.8, changeFrequency: 'daily' },
  { path: '/pg', priority: 0.8, changeFrequency: 'daily' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Fetch dynamic published properties
  try {
    const apiBase = (
      process.env.NEXT_PUBLIC_API_BASE_URL || 'https://apna-ghar-api-j4fo.onrender.com/api/v1'
    ).replace(/\/$/, '');

    const res = await fetch(`${apiBase}/properties?limit=500`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const properties: any[] = Array.isArray(data) ? data : data?.data || data?.items || [];

      for (const p of properties) {
        // Exclude unpublished, inactive, or deleted properties
        if (p && (!p.status || p.status === 'active') && !p.deletedAt) {
          const identifier = encodeURIComponent(p.slug || p._id);
          const lastMod = p.updatedAt ? new Date(p.updatedAt) : p.publishedAt ? new Date(p.publishedAt) : now;
          entries.push({
            url: `${SITE_URL}/property/${identifier}`,
            lastModified: lastMod,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // If API is unreachable during build, fallback to static routes gracefully
  }

  return entries;
}
