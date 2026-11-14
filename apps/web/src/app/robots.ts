import type { MetadataRoute } from 'next';
import { SITE_URL } from './utils/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/admin/',
          '/messages',
          '/messages/',
          '/profile',
          '/profile/',
          '/my-listings',
          '/my-listings/',
          '/saved',
          '/saved/',
          '/list-property',
          '/list-property/',
          '/appearance',
          '/appearance/',
          '/sign-in',
          '/sign-in/',
          '/sign-up',
          '/sign-up/',
          '/forgot-password',
          '/forgot-password/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
