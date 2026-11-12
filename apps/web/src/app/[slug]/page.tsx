import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const pages: Record<
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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = pages[params.slug] ?? pages.about;
  return {
    title: `${page.eyebrow} | Apna Ghar`,
    description: page.intro,
  };
}

export default function PublicInfoPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = pages[params.slug] ?? pages.about;
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
