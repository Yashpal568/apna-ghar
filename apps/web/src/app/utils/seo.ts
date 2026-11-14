import type { Metadata } from 'next';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://apna-ghar-web.yash38688.workers.dev'
).replace(/\/$/, '');

export const SITE_NAME = 'Apna Ghar';

export const DEFAULT_TITLE = 'Apna Ghar | Direct Owner Property Marketplace';

export const DEFAULT_DESCRIPTION =
  'Explore verified houses, apartments, plots, and commercial properties across India with 0% brokerage. Connect directly with owners on Apna Ghar.';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/icon.svg`;

export const NOINDEX_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
};

export const INDEXABLE_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
};

export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generates Root WebSite and Organization JSON-LD Schema
 */
export function generateRootSchemas() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description: 'Direct owner real estate marketplace across India with zero brokerage.',
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?location={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/**
 * Generates BreadcrumbList JSON-LD Schema
 */
export function generateBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export type PropertySchemaData = {
  _id: string;
  slug?: string;
  title: string;
  description?: string;
  priceAmount: number;
  currency?: string;
  listingType: 'sale' | 'rent';
  categoryId?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaValue?: number;
  areaUnit?: string;
  location?: {
    state?: string;
    city?: string;
    locality?: string;
    addressText?: string;
  };
  imageUrls?: string[];
  publishedAt?: string | Date;
};

/**
 * Generates RealEstateListing JSON-LD Schema for published property pages
 */
export function generatePropertySchema(property: PropertySchemaData) {
  const propertyUrl = getCanonicalUrl(`/property/${encodeURIComponent(property.slug || property._id)}`);
  const imageList = property.imageUrls && property.imageUrls.length > 0
    ? property.imageUrls
    : [DEFAULT_OG_IMAGE];

  let accommodationType = 'Accommodation';
  if (property.categoryId === 'apartment') accommodationType = 'Apartment';
  else if (property.categoryId === 'house' || property.categoryId === 'villa') accommodationType = 'SingleFamilyResidence';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Explore Properties', path: '/search' },
        { name: property.title, path: `/property/${property.slug || property._id}` },
      ]),
      {
        '@type': 'RealEstateListing',
        '@id': `${propertyUrl}#listing`,
        name: property.title,
        description: property.description || property.title,
        url: propertyUrl,
        datePosted: property.publishedAt ? new Date(property.publishedAt).toISOString() : new Date().toISOString(),
        image: imageList,
        offers: {
          '@type': 'Offer',
          price: property.priceAmount,
          priceCurrency: property.currency || 'INR',
          availability: 'https://schema.org/InStock',
          businessFunction:
            property.listingType === 'rent'
              ? 'http://purl.org/goodrelations/v1#LeaseOut'
              : 'http://purl.org/goodrelations/v1#Sell',
        },
        about: {
          '@type': accommodationType,
          name: property.title,
          description: property.description || property.title,
          numberOfRooms: property.bedrooms || undefined,
          numberOfBathroomsTotal: property.bathrooms || undefined,
          floorSize: property.areaValue
            ? {
                '@type': 'QuantitativeValue',
                value: property.areaValue,
                unitCode: property.areaUnit === 'sqft' ? 'FTK' : property.areaUnit === 'sqm' ? 'MTK' : 'ACR',
              }
            : undefined,
          address: {
            '@type': 'PostalAddress',
            addressLocality: property.location?.city || '',
            addressRegion: property.location?.state || '',
            streetAddress: property.location?.addressText || property.location?.locality || undefined,
            addressCountry: 'IN',
          },
        },
      },
    ],
  };
}
