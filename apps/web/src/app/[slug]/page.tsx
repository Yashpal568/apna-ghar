import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertySearchResults from "../components/PropertySearchResults";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  INDEXABLE_ROBOTS,
  getCanonicalUrl,
  generateBreadcrumbSchema,
} from "../utils/seo";

export const dynamic = "force-dynamic";

type DynamicPageProps = {
  params: Promise<{ slug?: string }> | { slug?: string };
};

const INFO_PAGES: Record<
  string,
  {
    title: string;
    eyebrow: string;
    intro: string;
    canonicalPath: string;
    sections: { heading: string; body: string }[];
  }
> = {
  about: {
    title: "A more thoughtful way to find home.",
    eyebrow: "ABOUT APNA GHAR",
    intro:
      "Apna Ghar is India's direct real-estate marketplace connecting homeowners and buyers without middleman commissions.",
    canonicalPath: "/about",
    sections: [
      {
        heading: "Built around better decisions",
        body: "We want buyers, renters and property owners to understand the details that matter before they take the next step. Transparent pricing, clear specifications and uncompromised privacy.",
      },
      {
        heading: "Zero Brokerage Guarantee",
        body: "Traditional real estate transactions burden consumers with high broker fees. Apna Ghar eliminates unnecessary broker commissions, saving buyers and tenants significant amounts on every property deal.",
      },
      {
        heading: "A note about this preview",
        body: "This deployment reflects active Milestone M2-M5 capabilities. All features connect to authentic backend contracts and MongoDB persistence.",
      },
    ],
  },
  safety: {
    title: "Take your time. Check the details.",
    eyebrow: "TRUST & SAFETY",
    intro: "Sensible precautions to make safe, transparent real estate decisions directly with verified owners.",
    canonicalPath: "/safety",
    sections: [
      {
        heading: "Before you pay",
        body: "Visit the property where possible, verify ownership and documents independently, and do not transfer deposits without a written agreement.",
      },
      {
        heading: "Keep your account safe",
        body: "Never share OTPs, passwords or sensitive banking credentials. Keep written records of important agreements and conversation history.",
      },
      {
        heading: "Reporting on Apna Ghar",
        body: "Report any inaccurate listing or suspicious profile immediately using the in-app messaging or safety support contacts.",
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines & Trust Framework",
    eyebrow: "GUIDELINES",
    intro: "Principles for respectful, honest, and direct property negotiations between owners and seekers.",
    canonicalPath: "/guidelines",
    sections: [
      {
        heading: "Honest Representation",
        body: "Listings must accurately reflect the property's physical condition, dimensions, and legal status.",
      },
      {
        heading: "Direct Communication",
        body: "Parties communicate directly with mutual respect and without third-party solicitation.",
      },
    ],
  },
  privacy: {
    title: "Your information deserves care.",
    eyebrow: "PRIVACY POLICY",
    intro: "We protect your identity, contact preferences, and private peer-to-peer negotiations.",
    canonicalPath: "/privacy",
    sections: [
      {
        heading: "Account-Based Privacy",
        body: "Your email address and personal identity remain secure behind Clerk authentication. Contact numbers are displayed only when you explicitly choose to share them.",
      },
      {
        heading: "Direct Owner Conversations",
        body: "Negotiations and offers in Apna Ghar are strictly private between participants. No unauthorized third party can inspect your conversation history.",
      },
      {
        heading: "Data Minimization",
        body: "We only collect data necessary to provide authentic property discovery and direct owner communication.",
      },
    ],
  },
  terms: {
    title: "Clear, transparent platform terms.",
    eyebrow: "TERMS OF USE",
    intro: "Apna Ghar connects property owners and buyers/tenants directly with 0% brokerage.",
    canonicalPath: "/terms",
    sections: [
      {
        heading: "Direct Owner Platform",
        body: "Listings on Apna Ghar are published directly by property owners or authorized representatives. Users agree to provide truthful, lawful, and accurate property details.",
      },
      {
        heading: "Zero Middleman Brokerage",
        body: "Apna Ghar does not charge commissions or broker fees on standard transactions. Both parties negotiate directly and finalize terms independently.",
      },
      {
        heading: "Verification & Due Diligence",
        body: "While Apna Ghar provides authenticated accounts and honest specifications, buyers and tenants are advised to conduct independent physical visits and title document verification.",
      },
    ],
  },
  contact: {
    title: "We're here to help you find your way home.",
    eyebrow: "CONTACT & SUPPORT",
    intro: "Questions, feedback, or need help with a listing? Connect with our direct support team.",
    canonicalPath: "/contact",
    sections: [
      {
        heading: "Direct Messaging",
        body: "Signed-in users can reach our support team or converse with property owners anytime via the in-app Messages tab.",
      },
      {
        heading: "Email & Support Desk",
        body: "Reach our community and technical support desk directly. We respond within 24 hours on all business days.",
      },
      {
        heading: "Report Listing Violations",
        body: "If you encounter misleading photos, incorrect pricing or suspicious conduct, flag the property or message our trust and safety desk.",
      },
    ],
  },
};

const CITY_LANDINGS: Record<
  string,
  {
    name: string;
    title: string;
    eyebrow: string;
    intro: string;
    canonicalPath: string;
    hubs: string[];
  }
> = {
  mumbai: {
    name: "Mumbai",
    title: "Properties for Sale & Rent in Mumbai | Direct Owner Flats & Homes",
    eyebrow: "MUMBAI REAL ESTATE",
    intro: "Explore verified direct owner properties across Mumbai Metropolitan without agent commissions. Compare ready-to-move flats in Andheri, Bandra, Powai, Thane and Navi Mumbai.",
    canonicalPath: "/mumbai",
    hubs: ["Andheri", "Bandra West", "Powai", "Thane West", "Navi Mumbai"],
  },
  bengaluru: {
    name: "Bengaluru",
    title: "Properties for Sale & Rent in Bengaluru | Tech Corridor Homes",
    eyebrow: "BENGALURU REAL ESTATE",
    intro: "Browse modern apartments, gated villas and plots in Bengaluru directly from owners. Discover prime listings near Whitefield, Sarjapur Road, Electronic City, and HSR Layout.",
    canonicalPath: "/bengaluru",
    hubs: ["Whitefield", "Sarjapur Road", "HSR Layout", "Electronic City", "Indiranagar"],
  },
  delhi: {
    name: "Delhi",
    title: "Properties for Sale & Rent in Delhi NCR | Direct Owner Homes",
    eyebrow: "DELHI NCR REAL ESTATE",
    intro: "Find residential and commercial properties across Delhi NCR with zero middleman charges. Explore verified apartments and builder floors in South Delhi, Dwarka, Gurgaon, and Noida.",
    canonicalPath: "/delhi",
    hubs: ["Dwarka", "South Delhi", "Gurgaon Cyber City", "Noida Expressway", "Rohini"],
  },
  hyderabad: {
    name: "Hyderabad",
    title: "Properties for Sale & Rent in Hyderabad | Financial District Homes",
    eyebrow: "HYDERABAD REAL ESTATE",
    intro: "Explore direct owner flats and villas in Hyderabad's premier growth hubs. Connect with verified owners across Gachibowli, Hitec City, Kondapur, and Banjara Hills.",
    canonicalPath: "/hyderabad",
    hubs: ["Gachibowli", "Hitec City", "Kondapur", "Banjara Hills", "Madhapur"],
  },
  pune: {
    name: "Pune",
    title: "Properties for Sale & Rent in Pune | IT Corridor Homes & Flats",
    eyebrow: "PUNE REAL ESTATE",
    intro: "Compare verified apartments, ready-to-move homes and plots in Pune directly from owners. Explore listings in Hinjawadi, Baner, Wakad, Viman Nagar, and Kharadi.",
    canonicalPath: "/pune",
    hubs: ["Hinjawadi", "Baner", "Wakad", "Viman Nagar", "Kharadi"],
  },
  amritsar: {
    name: "Amritsar",
    title: "Properties for Sale & Rent in Amritsar | Residential Plots & Villas",
    eyebrow: "AMRITSAR REAL ESTATE",
    intro: "Verified residential and commercial plots, villas, and independent houses in Amritsar, Punjab. 100% direct seller deals with zero brokerage.",
    canonicalPath: "/amritsar",
    hubs: ["Model Town", "Ranjit Avenue", "Mall Road", "Circular Road", "GT Road"],
  },
};

const CATEGORY_LANDINGS: Record<
  string,
  {
    key: string;
    title: string;
    eyebrow: string;
    intro: string;
    canonicalPath: string;
  }
> = {
  apartments: {
    key: "apartment",
    title: "Flats & Apartments for Sale across India | Zero Brokerage",
    eyebrow: "FLATS & APARTMENTS",
    intro: "Find modern builder floors, multistory apartments, and luxury high-rises directly from owners. Complete transparency with zero broker commissions.",
    canonicalPath: "/apartments",
  },
  apartment: {
    key: "apartment",
    title: "Flats & Apartments for Sale across India | Zero Brokerage",
    eyebrow: "FLATS & APARTMENTS",
    intro: "Find modern builder floors, multistory apartments, and luxury high-rises directly from owners. Complete transparency with zero broker commissions.",
    canonicalPath: "/apartments",
  },
  houses: {
    key: "house",
    title: "Villas & Independent Houses for Sale | Direct Owner Homes",
    eyebrow: "VILLAS & HOUSES",
    intro: "Discover spacious independent houses, duplexes, and gated villas across India. Negotiate directly with property owners.",
    canonicalPath: "/houses",
  },
  house: {
    key: "house",
    title: "Villas & Independent Houses for Sale | Direct Owner Homes",
    eyebrow: "VILLAS & HOUSES",
    intro: "Discover spacious independent houses, duplexes, and gated villas across India. Negotiate directly with property owners.",
    canonicalPath: "/houses",
  },
  plots: {
    key: "plot",
    title: "Plots & Land for Sale across India | Verified Clear Title Plots",
    eyebrow: "PLOTS & LAND",
    intro: "Search verified residential, agricultural, and commercial plots with direct owner contact and clear title verification.",
    canonicalPath: "/plots",
  },
  plot: {
    key: "plot",
    title: "Plots & Land for Sale across India | Verified Clear Title Plots",
    eyebrow: "PLOTS & LAND",
    intro: "Search verified residential, agricultural, and commercial plots with direct owner contact and clear title verification.",
    canonicalPath: "/plots",
  },
  villas: {
    key: "villa",
    title: "Luxury Villas for Sale across India | Gated Communities",
    eyebrow: "LUXURY VILLAS",
    intro: "Browse standalone and gated community luxury villas with private gardens, parking, and premium amenities.",
    canonicalPath: "/villas",
  },
  villa: {
    key: "villa",
    title: "Luxury Villas for Sale across India | Gated Communities",
    eyebrow: "LUXURY VILLAS",
    intro: "Browse standalone and gated community luxury villas with private gardens, parking, and premium amenities.",
    canonicalPath: "/villas",
  },
  commercial: {
    key: "commercial",
    title: "Commercial Properties for Sale & Lease | Direct Owner Spaces",
    eyebrow: "COMMERCIAL REAL ESTATE",
    intro: "Offices, retail spaces, shops, and warehouses for sale or lease directly from property owners across India.",
    canonicalPath: "/commercial",
  },
  pg: {
    key: "pg",
    title: "PG & Co-Living Spaces for Rent | Verified Shared Homes",
    eyebrow: "PG & CO-LIVING",
    intro: "Furnished paying guest rooms and shared coliving accommodations across major Indian education and tech corridors.",
    canonicalPath: "/pg",
  },
};

const TRANSACTION_LANDINGS: Record<
  string,
  {
    transaction: "buy" | "rent";
    title: string;
    eyebrow: string;
    intro: string;
    canonicalPath: string;
  }
> = {
  buy: {
    transaction: "buy",
    title: "Properties for Sale across India | Direct Owner Real Estate",
    eyebrow: "BUY A HOME",
    intro: "Explore verified homes, apartments, plots, and commercial properties available for purchase across India with 0% brokerage.",
    canonicalPath: "/buy",
  },
  rent: {
    transaction: "rent",
    title: "Properties for Rent across India | Rental Homes & Flats",
    eyebrow: "RENT A HOME",
    intro: "Browse verified rental flats, independent houses, and commercial spaces. Connect directly with landlords without broker commissions.",
    canonicalPath: "/rent",
  },
};

export async function generateMetadata(props: DynamicPageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(props.params);
  const slug = (resolved?.slug || "").toLowerCase().trim();

  if (INFO_PAGES[slug]) {
    const page = INFO_PAGES[slug];
    const canonical = getCanonicalUrl(page.canonicalPath);
    return {
      title: `${page.eyebrow} | ${SITE_NAME}`,
      description: page.intro,
      robots: INDEXABLE_ROBOTS,
      alternates: { canonical },
      openGraph: {
        title: `${page.eyebrow} | ${SITE_NAME}`,
        description: page.intro,
        url: canonical,
        siteName: SITE_NAME,
        locale: "en_IN",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${page.eyebrow} | ${SITE_NAME}`,
        description: page.intro,
      },
    };
  }

  if (CITY_LANDINGS[slug]) {
    const city = CITY_LANDINGS[slug];
    const canonical = getCanonicalUrl(city.canonicalPath);
    return {
      title: `${city.title} | ${SITE_NAME}`,
      description: city.intro,
      robots: INDEXABLE_ROBOTS,
      alternates: { canonical },
      openGraph: {
        title: `${city.title} | ${SITE_NAME}`,
        description: city.intro,
        url: canonical,
        siteName: SITE_NAME,
        locale: "en_IN",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${city.title} | ${SITE_NAME}`,
        description: city.intro,
      },
    };
  }

  if (CATEGORY_LANDINGS[slug]) {
    const category = CATEGORY_LANDINGS[slug];
    const canonical = getCanonicalUrl(category.canonicalPath);
    return {
      title: `${category.title} | ${SITE_NAME}`,
      description: category.intro,
      robots: INDEXABLE_ROBOTS,
      alternates: { canonical },
      openGraph: {
        title: `${category.title} | ${SITE_NAME}`,
        description: category.intro,
        url: canonical,
        siteName: SITE_NAME,
        locale: "en_IN",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${category.title} | ${SITE_NAME}`,
        description: category.intro,
      },
    };
  }

  if (TRANSACTION_LANDINGS[slug]) {
    const tx = TRANSACTION_LANDINGS[slug];
    const canonical = getCanonicalUrl(tx.canonicalPath);
    return {
      title: `${tx.title} | ${SITE_NAME}`,
      description: tx.intro,
      robots: INDEXABLE_ROBOTS,
      alternates: { canonical },
      openGraph: {
        title: `${tx.title} | ${SITE_NAME}`,
        description: tx.intro,
        url: canonical,
        siteName: SITE_NAME,
        locale: "en_IN",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${tx.title} | ${SITE_NAME}`,
        description: tx.intro,
      },
    };
  }

  return {
    title: "Page Not Found | Apna Ghar",
    robots: { index: false, follow: false },
  };
}

export default async function DynamicPage(props: DynamicPageProps) {
  const resolved = await Promise.resolve(props.params);
  const slug = (resolved?.slug || "").toLowerCase().trim();

  // 1. Static Informational Pages
  if (INFO_PAGES[slug]) {
    const page = INFO_PAGES[slug];
    const breadcrumbs = [
      { name: "Home", path: "/" },
      { name: page.eyebrow, path: page.canonicalPath },
    ];
    return (
      <div className="info-page-wrapper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)),
          }}
        />
        <SiteHeader active="home" />
        <main className="page-shell interior-page">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <span>{page.eyebrow}</span>
          </nav>
          <article className="info-page">
            <p className="eyebrow">{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p className="info-intro">{page.intro}</p>
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
            <div style={{ marginTop: "2rem" }}>
              <a className="button button-primary" href="/search">
                Explore Available Properties ↗
              </a>
            </div>
          </article>
          <SiteFooter />
        </main>
      </div>
    );
  }

  // 2. City Landing Pages
  if (CITY_LANDINGS[slug]) {
    const city = CITY_LANDINGS[slug];
    const breadcrumbs = [
      { name: "Home", path: "/" },
      { name: "Explore", path: "/search" },
      { name: city.name, path: city.canonicalPath },
    ];
    return (
      <div className="city-landing-wrapper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)),
          }}
        />
        <SiteHeader active="search" searchValue={city.name} />
        <main className="page-shell interior-page">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/search">Explore</a>
            <span>/</span>
            <span>{city.name}</span>
          </nav>
          <section className="search-page-heading">
            <p className="eyebrow">{city.eyebrow}</p>
            <h1>
              Verified Direct Owner Properties in <em>{city.name}</em>
            </h1>
            <p>{city.intro}</p>
            <div className="city-micro-hubs" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-on-surface-variant)" }}>Popular Hubs:</span>
              {city.hubs.map((hub) => (
                <a
                  key={hub}
                  href={`/search?location=${encodeURIComponent(hub)}`}
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    background: "var(--color-surface-container, #e5eeff)",
                    fontSize: "0.8125rem",
                    textDecoration: "none",
                    color: "var(--color-primary, #0045b7)",
                    fontWeight: 500,
                  }}
                >
                  {hub}
                </a>
              ))}
            </div>
          </section>
          <PropertySearchResults location={city.name} transaction="all" />
          <section className="seo-interlinking-section" style={{ padding: "3rem 1rem", borderTop: "1px solid var(--color-outline-variant, #e2e8f0)", marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Explore Properties in Other Top Indian Cities</h2>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {Object.entries(CITY_LANDINGS)
                .filter(([key]) => key !== slug)
                .map(([, c]) => (
                  <a key={c.canonicalPath} href={c.canonicalPath} style={{ color: "var(--color-primary, #0045b7)", textDecoration: "underline", fontSize: "0.9375rem" }}>
                    Properties in {c.name}
                  </a>
                ))}
            </div>
          </section>
          <SiteFooter />
        </main>
      </div>
    );
  }

  // 3. Category Landing Pages
  if (CATEGORY_LANDINGS[slug]) {
    const category = CATEGORY_LANDINGS[slug];
    const breadcrumbs = [
      { name: "Home", path: "/" },
      { name: "Explore", path: "/search" },
      { name: category.eyebrow, path: category.canonicalPath },
    ];
    return (
      <div className="category-landing-wrapper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)),
          }}
        />
        <SiteHeader active="search" />
        <main className="page-shell interior-page">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/search">Explore</a>
            <span>/</span>
            <span>{category.eyebrow}</span>
          </nav>
          <section className="search-page-heading">
            <p className="eyebrow">{category.eyebrow}</p>
            <h1>{category.title}</h1>
            <p>{category.intro}</p>
          </section>
          <PropertySearchResults category={category.key} transaction="all" />
          <section className="seo-interlinking-section" style={{ padding: "3rem 1rem", borderTop: "1px solid var(--color-outline-variant, #e2e8f0)", marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Browse Other Property Types</h2>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {["apartments", "houses", "plots", "villas", "commercial", "pg"]
                .filter((catKey) => catKey !== slug && CATEGORY_LANDINGS[catKey])
                .map((catKey) => (
                  <a key={catKey} href={`/${catKey}`} style={{ color: "var(--color-primary, #0045b7)", textDecoration: "underline", fontSize: "0.9375rem" }}>
                    {CATEGORY_LANDINGS[catKey].eyebrow}
                  </a>
                ))}
            </div>
          </section>
          <SiteFooter />
        </main>
      </div>
    );
  }

  // 4. Transaction Landing Pages (/buy, /rent)
  if (TRANSACTION_LANDINGS[slug]) {
    const tx = TRANSACTION_LANDINGS[slug];
    const breadcrumbs = [
      { name: "Home", path: "/" },
      { name: "Explore", path: "/search" },
      { name: tx.eyebrow, path: tx.canonicalPath },
    ];
    return (
      <div className="transaction-landing-wrapper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)),
          }}
        />
        <SiteHeader active={tx.transaction === "buy" ? "buy" : "rent"} />
        <main className="page-shell interior-page">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/search">Explore</a>
            <span>/</span>
            <span>{tx.eyebrow}</span>
          </nav>
          <section className="search-page-heading">
            <p className="eyebrow">{tx.eyebrow}</p>
            <h1>{tx.title}</h1>
            <p>{tx.intro}</p>
          </section>
          <PropertySearchResults transaction={tx.transaction} />
          <SiteFooter />
        </main>
      </div>
    );
  }

  // 5. Unknown Route: Trigger standard 404
  notFound();
}
