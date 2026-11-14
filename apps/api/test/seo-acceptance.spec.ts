import * as fs from 'fs';
import * as path from 'path';
import {
  SITE_URL,
  SITE_NAME,
  NOINDEX_ROBOTS,
  INDEXABLE_ROBOTS,
  getCanonicalUrl,
  generateRootSchemas,
  generateBreadcrumbSchema,
  generatePropertySchema,
  PropertySchemaData,
} from '../../web/src/app/utils/seo';

describe('M5 SEO Acceptance Suite', () => {
  const webAppDir = path.resolve(__dirname, '../../web/src/app');

  describe('1. Technical SEO Configuration & Helpers', () => {
    it('should define a valid production SITE_URL without trailing slash', () => {
      expect(SITE_URL).toMatch(/^https?:\/\/[a-zA-Z0-9.-]+/);
      expect(SITE_URL.endsWith('/')).toBe(false);
    });

    it('should generate canonical URLs correctly', () => {
      expect(getCanonicalUrl('/')).toBe(`${SITE_URL}/`);
      expect(getCanonicalUrl('/search')).toBe(`${SITE_URL}/search`);
      expect(getCanonicalUrl('mumbai')).toBe(`${SITE_URL}/mumbai`);
    });

    it('should have standard indexable robots directives', () => {
      const robots = INDEXABLE_ROBOTS as any;
      expect(robots?.index).toBe(true);
      expect(robots?.follow).toBe(true);
      expect(robots?.googleBot).toBeDefined();
    });

    it('should have strict noindex robots directives for private pages', () => {
      const robots = NOINDEX_ROBOTS as any;
      expect(robots?.index).toBe(false);
      expect(robots?.follow).toBe(false);
      expect(robots?.googleBot?.index).toBe(false);
      expect(robots?.googleBot?.follow).toBe(false);
    });
  });

  describe('2. Structured Data (JSON-LD) Validation', () => {
    it('should generate valid Schema.org Organization and WebSite graph in root schema', () => {
      const schemas: any = generateRootSchemas();
      expect(schemas['@context']).toBe('https://schema.org');
      expect(Array.isArray(schemas['@graph'])).toBe(true);

      const org = schemas['@graph'].find((item: any) => item['@type'] === 'Organization');
      expect(org).toBeDefined();
      expect(org.name).toBe(SITE_NAME);
      expect(org.url).toBe(SITE_URL);
      expect(org.logo).toContain('icon.svg');

      const website = schemas['@graph'].find((item: any) => item['@type'] === 'WebSite');
      expect(website).toBeDefined();
      expect(website.name).toBe(SITE_NAME);
      expect(website.potentialAction['@type']).toBe('SearchAction');
      expect(website.potentialAction.target.urlTemplate).toContain('/search?location={search_term_string}');
    });

    it('should generate valid Schema.org BreadcrumbList', () => {
      const breadcrumbs: any = generateBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Mumbai', path: '/mumbai' },
      ]);
      expect(breadcrumbs['@context']).toBe('https://schema.org');
      expect(breadcrumbs['@type']).toBe('BreadcrumbList');
      expect(breadcrumbs.itemListElement).toHaveLength(2);
      expect(breadcrumbs.itemListElement[0].position).toBe(1);
      expect(breadcrumbs.itemListElement[0].item).toBe(`${SITE_URL}/`);
      expect(breadcrumbs.itemListElement[1].position).toBe(2);
      expect(breadcrumbs.itemListElement[1].item).toBe(`${SITE_URL}/mumbai`);
    });

    it('should generate Schema.org RealEstateListing without fabricated ratings or prices', () => {
      const property: PropertySchemaData = {
        _id: 'prop-12345',
        slug: 'luxury-4bhk-villa-model-town',
        title: 'Luxury 4 BHK Villa',
        description: 'Direct owner villa with private garden.',
        priceAmount: 15200000,
        currency: 'INR',
        listingType: 'sale',
        categoryId: 'villa',
        bedrooms: 4,
        bathrooms: 4,
        areaValue: 2400,
        areaUnit: 'sqft',
        location: {
          city: 'Amritsar',
          state: 'Punjab',
          locality: 'Model Town',
          addressText: 'Plot 42, Model Town',
        },
        imageUrls: ['https://example.com/photo1.jpg'],
        publishedAt: new Date('2026-01-01').toISOString(),
      };

      const jsonLd: any = generatePropertySchema(property);
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(Array.isArray(jsonLd['@graph'])).toBe(true);

      const listing = jsonLd['@graph'].find((item: any) => item['@type'] === 'RealEstateListing');
      expect(listing).toBeDefined();
      expect(listing.name).toBe(property.title);
      expect(listing.offers['@type']).toBe('Offer');
      expect(listing.offers.price).toBe(15200000);
      expect(listing.offers.priceCurrency).toBe('INR');
      expect(listing.offers.businessFunction).toBe('http://purl.org/goodrelations/v1#Sell');
      expect(listing.about['@type']).toBe('SingleFamilyResidence');
      expect(listing.about.address.addressLocality).toBe('Amritsar');
      expect(listing.about.floorSize.value).toBe(2400);
      expect(listing.about.floorSize.unitCode).toBe('FTK');

      // Verify no fabricated ratings or reviews
      expect(listing.aggregateRating).toBeUndefined();
      expect(listing.review).toBeUndefined();
    });
  });

  describe('3. Dynamic Property SEO & Inactive/Deleted Protection', () => {
    it('should verify property route handles deleted/inactive listings with noindex', () => {
      const propertyPagePath = path.join(webAppDir, 'property/[id]/page.tsx');
      expect(fs.existsSync(propertyPagePath)).toBe(true);
      const content = fs.readFileSync(propertyPagePath, 'utf8');

      // Verify noindex is returned for deleted/inactive listings
      expect(content).toContain('NOINDEX_ROBOTS');
      expect(content).toContain('deletedAt');
      expect(content).toContain('Property Not Available');
      expect(content).toContain('generatePropertySchema');
    });
  });

  describe('4. Private Route Noindex Enforcements', () => {
    const privateLayoutsAndPages = [
      'admin/layout.tsx',
      'saved/layout.tsx',
      'my-listings/layout.tsx',
      'list-property/layout.tsx',
      'appearance/layout.tsx',
      'messages/page.tsx',
      'profile/page.tsx',
      'forgot-password/page.tsx',
      'sign-in/[[...sign-in]]/page.tsx',
      'sign-up/[[...sign-up]]/page.tsx',
    ];

    it.each(privateLayoutsAndPages)('should enforce NOINDEX_ROBOTS on %s', (relPath) => {
      const fullPath = path.join(webAppDir, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');
      expect(content).toContain('NOINDEX_ROBOTS');
      expect(content).toMatch(/robots:\s*NOINDEX_ROBOTS/);
    });
  });

  describe('5. Robots.txt and Sitemap.xml Implementation', () => {
    it('should define robots.ts with correct Disallow rules and Sitemap directive', () => {
      const robotsPath = path.join(webAppDir, 'robots.ts');
      expect(fs.existsSync(robotsPath)).toBe(true);
      const content = fs.readFileSync(robotsPath, 'utf8');

      expect(content).toContain("sitemap: `${SITE_URL}/sitemap.xml`");
      expect(content).toContain("'/admin'");
      expect(content).toContain("'/messages'");
      expect(content).toContain("'/profile'");
      expect(content).toContain("'/my-listings'");
      expect(content).toContain("'/saved'");
      expect(content).toContain("'/list-property'");
      expect(content).toContain("'/sign-in'");
      expect(content).toContain("'/sign-up'");
      expect(content).toContain("'/forgot-password'");
    });

    it('should define sitemap.ts with indexable static routes and dynamic property fetching', () => {
      const sitemapPath = path.join(webAppDir, 'sitemap.ts');
      expect(fs.existsSync(sitemapPath)).toBe(true);
      const content = fs.readFileSync(sitemapPath, 'utf8');

      // Core routes
      expect(content).toContain("path: ''");
      expect(content).toContain("path: '/search'");
      expect(content).toContain("path: '/buy'");
      expect(content).toContain("path: '/rent'");

      // City routes
      expect(content).toContain("path: '/mumbai'");
      expect(content).toContain("path: '/delhi'");
      expect(content).toContain("path: '/bengaluru'");
      expect(content).toContain("path: '/hyderabad'");
      expect(content).toContain("path: '/pune'");
      expect(content).toContain("path: '/amritsar'");

      // Category routes
      expect(content).toContain("path: '/apartments'");
      expect(content).toContain("path: '/houses'");
      expect(content).toContain("path: '/plots'");
      expect(content).toContain("path: '/villas'");
      expect(content).toContain("path: '/commercial'");
      expect(content).toContain("path: '/pg'");

      // Dynamic property filtering
      expect(content).toContain('deletedAt');
      expect(content).toContain('status');
      expect(content).toContain('/properties?limit=500');
    });
  });

  describe('6. City and Category Landing Pages', () => {
    it('should define comprehensive city, category, and transactional landing pages in [slug]/page.tsx', () => {
      const slugPagePath = path.join(webAppDir, '[slug]/page.tsx');
      expect(fs.existsSync(slugPagePath)).toBe(true);
      const content = fs.readFileSync(slugPagePath, 'utf8');

      expect(content).toContain('CITY_LANDINGS');
      expect(content).toContain('CATEGORY_LANDINGS');
      expect(content).toContain('TRANSACTION_LANDINGS');
      expect(content).toContain('generateBreadcrumbSchema');
      expect(content).toContain('getCanonicalUrl');
    });
  });

  describe('7. Internal Linking & Navigation', () => {
    it('should verify header and footer link to canonical routes rather than raw query params', () => {
      const headerPath = path.join(webAppDir, 'components/MarketplaceHeader.tsx');
      const footerPath = path.join(webAppDir, 'components/SiteFooter.tsx');

      const headerContent = fs.readFileSync(headerPath, 'utf8');
      expect(headerContent).toContain('href="/buy"');
      expect(headerContent).toContain('href="/rent"');
      expect(headerContent).toContain('href="/commercial"');
      expect(headerContent).toContain('href="/plots"');

      const footerContent = fs.readFileSync(footerPath, 'utf8');
      expect(footerContent).toContain('"/buy"');
      expect(footerContent).toContain('"/rent"');
      expect(footerContent).toContain('"/commercial"');
      expect(footerContent).toContain('"/plots"');
      expect(footerContent).toContain('"/mumbai"');
      expect(footerContent).toContain('"/delhi"');
    });
  });
});
