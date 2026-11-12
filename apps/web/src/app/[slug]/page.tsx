import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertySearchResults from "../components/PropertySearchResults";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const INFO_PAGES: Record<
  string,
  {
    title: string;
    eyebrow: string;
    intro: string;
    sections: { heading: string; body: string }[];
  }
> = {
  about: {
    title: "A more thoughtful way to find home.",
    eyebrow: "ABOUT APNA GHAR",
    intro:
      "Apna Ghar is India's direct real-estate marketplace connecting homeowners and buyers without middleman commissions.",
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
        body: "This deployment reflects active Milestone M2 capabilities. All features connect to authentic backend contracts and MongoDB persistence.",
      },
    ],
  },
  safety: {
    title: "Take your time. Check the details.",
    eyebrow: "TRUST & SAFETY",
    intro: "A few sensible precautions can help you make safer property decisions.",
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
  privacy: {
    title: "Your information deserves care.",
    eyebrow: "PRIVACY PROTECTION",
    intro: "We protect your identity, contact preferences and private negotiations.",
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
    intro:
      "Apna Ghar connects property owners and buyers/tenants directly with 0% brokerage.",
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
    intro:
      "Questions, feedback, or need help with a listing? Connect with our direct support team.",
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
  { name: string; title: string; eyebrow: string; intro: string }
> = {
  mumbai: {
    name: "Mumbai",
    title: "Properties for Sale & Rent in Mumbai",
    eyebrow: "MUMBAI REAL ESTATE",
    intro: "Explore verified direct owner properties across Mumbai Metropolitan without agent commissions.",
  },
  bengaluru: {
    name: "Bengaluru",
    title: "Properties for Sale & Rent in Bengaluru",
    eyebrow: "BENGALURU TECH CORRIDORS",
    intro: "Browse modern apartments, independent houses and plots in Bengaluru directly from owners.",
  },
  delhi: {
    name: "Delhi",
    title: "Properties for Sale & Rent in Delhi NCR",
    eyebrow: "DELHI NCR REAL ESTATE",
    intro: "Find residential and commercial properties across Delhi NCR with zero middleman charges.",
  },
  hyderabad: {
    name: "Hyderabad",
    title: "Properties for Sale & Rent in Hyderabad",
    eyebrow: "HYDERABAD FINANCIAL DISTRICT",
    intro: "Explore direct owner flats and villas in Hyderabad's premier growth hubs.",
  },
  pune: {
    name: "Pune",
    title: "Properties for Sale & Rent in Pune",
    eyebrow: "PUNE PROPERTY MARKET",
    intro: "Compare verified apartments, ready-to-move homes and plots in Pune.",
  },
  amritsar: {
    name: "Amritsar",
    title: "Properties for Sale & Rent in Amritsar",
    eyebrow: "AMRITSAR REAL ESTATE",
    intro: "Verified residential and commercial plots and homes in Amritsar, Punjab.",
  },
};

const CATEGORY_LANDINGS: Record<
  string,
  { key: string; title: string; eyebrow: string; intro: string }
> = {
  apartments: {
    key: "apartment",
    title: "Flats & Apartments for Sale",
    eyebrow: "FLATS & APARTMENTS",
    intro: "Find modern builder floors, multistory apartments and luxury high-rises directly from owners.",
  },
  apartment: {
    key: "apartment",
    title: "Flats & Apartments for Sale",
    eyebrow: "FLATS & APARTMENTS",
    intro: "Find modern builder floors, multistory apartments and luxury high-rises directly from owners.",
  },
  houses: {
    key: "house",
    title: "Villas & Independent Houses for Sale",
    eyebrow: "VILLAS & HOUSES",
    intro: "Discover spacious independent homes, duplexes and villas across India.",
  },
  house: {
    key: "house",
    title: "Villas & Independent Houses for Sale",
    eyebrow: "VILLAS & HOUSES",
    intro: "Discover spacious independent homes, duplexes and villas across India.",
  },
  plots: {
    key: "plot",
    title: "Plots & Land for Sale",
    eyebrow: "PLOTS & LAND",
    intro: "Search verified residential, agricultural and commercial land with direct owner contact.",
  },
  plot: {
    key: "plot",
    title: "Plots & Land for Sale",
    eyebrow: "PLOTS & LAND",
    intro: "Search verified residential, agricultural and commercial land with direct owner contact.",
  },
  villas: {
    key: "villa",
    title: "Luxury Villas for Sale",
    eyebrow: "LUXURY VILLAS",
    intro: "Browse standalone and gated community luxury villas with private gardens and amenities.",
  },
  villa: {
    key: "villa",
    title: "Luxury Villas for Sale",
    eyebrow: "LUXURY VILLAS",
    intro: "Browse standalone and gated community luxury villas with private gardens and amenities.",
  },
  commercial: {
    key: "commercial",
    title: "Commercial Properties for Sale & Lease",
    eyebrow: "COMMERCIAL REAL ESTATE",
    intro: "Offices, retail spaces and shops for sale or lease directly from property owners.",
  },
  pg: {
    key: "pg",
    title: "PG & Co-Living Spaces for Rent",
    eyebrow: "PG & CO-LIVING",
    intro: "Furnished paying guest rooms and shared coliving homes across major Indian cities.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug?.toLowerCase();
  if (INFO_PAGES[slug]) {
    const page = INFO_PAGES[slug];
    return {
      title: `${page.eyebrow} | Apna Ghar`,
      description: page.intro,
    };
  }
  if (CITY_LANDINGS[slug]) {
    const city = CITY_LANDINGS[slug];
    return {
      title: `${city.title} | Apna Ghar`,
      description: city.intro,
    };
  }
  if (CATEGORY_LANDINGS[slug]) {
    const category = CATEGORY_LANDINGS[slug];
    return {
      title: `${category.title} | Apna Ghar`,
      description: category.intro,
    };
  }
  return {
    title: "Apna Ghar | Direct Owner Property Marketplace",
  };
}

export default function DynamicPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug?.toLowerCase();

  // 1. Static Informational Pages
  if (INFO_PAGES[slug]) {
    const page = INFO_PAGES[slug];
    return (
      <div className="info-page-wrapper">
        <SiteHeader active="home" />
        <main className="page-shell interior-page">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <span>{page.eyebrow}</span>
          </div>
          <div className="info-page">
            <p className="eyebrow">{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p className="info-intro">{page.intro}</p>
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
            <a className="button button-outline" href="/">
              ← Back to Apna Ghar
            </a>
          </div>
          <SiteFooter />
        </main>
      </div>
    );
  }

  // 2. Data-Driven City Landing Pages
  if (CITY_LANDINGS[slug]) {
    const city = CITY_LANDINGS[slug];
    return (
      <div className="city-landing-wrapper">
        <SiteHeader active="search" searchValue={city.name} />
        <main className="page-shell interior-page">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/search">Explore</a>
            <span>/</span>
            <span>{city.name}</span>
          </div>
          <section className="search-page-heading">
            <p className="eyebrow">{city.eyebrow}</p>
            <h1>
              Homes in <em>{city.name}</em>
            </h1>
            <p>{city.intro}</p>
          </section>
          <PropertySearchResults location={city.name} transaction="buy" />
          <SiteFooter />
        </main>
      </div>
    );
  }

  // 3. Data-Driven Category Landing Pages
  if (CATEGORY_LANDINGS[slug]) {
    const category = CATEGORY_LANDINGS[slug];
    return (
      <div className="category-landing-wrapper">
        <SiteHeader active="search" />
        <main className="page-shell interior-page">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/search">Explore</a>
            <span>/</span>
            <span>{category.eyebrow}</span>
          </div>
          <section className="search-page-heading">
            <p className="eyebrow">{category.eyebrow}</p>
            <h1>
              {category.title.split(" ")[0]} <em>{category.title.split(" ").slice(1).join(" ")}</em>
            </h1>
            <p>{category.intro}</p>
          </section>
          <PropertySearchResults category={category.key} transaction="buy" />
          <SiteFooter />
        </main>
      </div>
    );
  }

  // 4. Unknown Route: Trigger standard 404
  notFound();
}
