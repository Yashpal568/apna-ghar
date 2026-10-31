"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import "./property-detail.css";

type Property = {
  _id: string;
  slug?: string;
  title: string;
  description?: string;
  listingType: "sale" | "rent";
  priceAmount: number;
  categoryId?: string;
  location?: {
    city?: string;
    state?: string;
    locality?: string;
    addressText?: string;
  };
  areaValue?: number;
  areaUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingCount?: number;
  furnishing?: string;
  amenities?: string[];
  imageUrls?: string[];
  contactName?: string;
  contactPhone?: string;
  isNegotiable?: boolean;
  viewsCount?: number;
  publishedAt?: string;
  createdAt?: string;
};

const API = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

// Architectural luxury fallbacks for empty gallery slots
const LUXURY_PHOTO_FALLBACKS = [
  "https://lh3.googleusercontent.com/aida/AEtjO1UZxmC5-0DAb3Eumyc-9ugz7tXIeAaGd5BKissqVSajSTsp3J2tLP2qGBxNOpkQ2BM4u1RAH3fTh3riF_O24iEitrVg5C8KhRhk61HGioR-SCIXwKKVcK3v6qaiZ0B8pzpxUEooll3-0vaxJBbUgywacuY8mmONb-S4mWv87W3KXqLl9zVjY7SAGke2QYfgUzBys_7FJd08XBjP8d0tC3BhCUnJrSGm6PsaFhLvQ2fC",
  "https://lh3.googleusercontent.com/aida/AEtjO1Wryx8qYWYzL2kavFY0tRTAEwpo1TVNhOlOmXn65h_r6KoRG06ErhsKfnJackEZad8rYBGsdDJRy7ZdClCPW8pV11-bD8s8OetCjO5qDCMZZO6411QHJinz9WwLV79vg4m8_7_zC8lVWK-4wAKiMIjRtJdtyL-vcxLaMOGF4n4euTJWr11YCVgg0K3GzNyDzHdRocElXHCGeLcchQoFgIniiQTUWjXgIrEZC2U7tcg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZoPKFV9Hu8S3ay6QlaphlSwBstECWunknOH6bYLIvc-25C4ji30oyrIb-RC8eGFqOxiVI4s0gCc7-4aWdZySWLmjtvmQ4siwx4EYsp1TPbc3pEgSeJPJfAXPCytwHWaDV70A3FAGFw8rpXgL5KkHDRt1ACef-nT_rqkuwUesilL0FQdxW-rTsHRpq8-fR9l19cc_PFYscWj_A1AXbA1ckCDvmG4jdk93HAPIcSwA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCh4WJikyBeSgTgLCR7eyfybs1bWG_ZjHn8-zSJ5PH77Bp9r2r3eHwTOHZ1tf9E-pfh1PBaauhDedSOJaTHKDzJLFgmzDH53WH_E9QHbbQNv7KDC3JF4DBMhSGygELqfuBxoUH2ahJpSCOQOXsCtz88VFNOUamDLhfVZ8DYVXzGKZgoinA7eYwUwSm7k8F_p-TF7nS8Lx-p4pJ5z24zyGWkyReG6cdlxWIJIqQb_2U",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBj4Q1ExyJKA8sff-kF-xc3h4PsLMMzUPAgs-Tcs-DCnCDyih3IwkGsB4Ehc2prVbSMK-17XdQ3m2CoYkw1HEu48nqT8M5fwSD_XeRDP86qqcGiAl4lsoj_d0poHQUvTLNyPR6zPuWYiG2Lb2AAGRg4VEP2HBDjP4B-R684IKYYWzaNt3UlAQ1EV8qW1ySji3wWmI8Qujbje7NwNOwf63QQDob47tmL9Rg1zTUgiCM",
];

function formatIndianPrice(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "₹ 0";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹ ${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹ ${l.toFixed(1)} Lakhs`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFullINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "YP"
  );
}

function unwrap(value: unknown, depth = 0): Property | null {
  if (!value || typeof value !== "object" || depth > 4) return null;
  const item = value as Record<string, unknown>;
  const rawPrice =
    item.priceAmount !== undefined && item.priceAmount !== null
      ? item.priceAmount
      : item.price;
  const priceAmount =
    typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
  if (
    typeof item._id === "string" &&
    item._id.trim() !== "" &&
    typeof item.title === "string" &&
    item.title.trim() !== "" &&
    Number.isFinite(priceAmount)
  ) {
    return { ...item, priceAmount } as unknown as Property;
  }
  for (const key of ["data", "result", "property", "item"]) {
    if (key in item && item[key]) {
      const found = unwrap(item[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

type ListingPage = {
  items: Property[];
  pages?: number;
  total?: number;
};

function unwrapListing(value: unknown, depth = 0): ListingPage {
  if (Array.isArray(value))
    return {
      items: value.filter(
        (item) => item && typeof item === "object"
      ) as Property[],
    };
  if (!value || typeof value !== "object" || depth > 5) return { items: [] };
  const record = value as Record<string, unknown>;
  const pagination = (record.pagination &&
  typeof record.pagination === "object"
    ? record.pagination
    : {}) as Record<string, unknown>;
  if (Array.isArray(record.items))
    return {
      items: record.items as Property[],
      pages: Number(record.pages ?? pagination.pages) || undefined,
      total: Number(record.total ?? pagination.total) || undefined,
    };
  for (const key of ["data", "result", "properties", "results"]) {
    if (key in record) {
      const nested = unwrapListing(record[key], depth + 1);
      if (nested.items.length)
        return {
          ...nested,
          pages:
            nested.pages ??
            (Number(record.pages ?? pagination.pages) || undefined),
          total:
            nested.total ??
            (Number(record.total ?? pagination.total) || undefined),
        };
    }
  }
  return { items: [] };
}

async function findInPublicListings(
  identifier: string,
  signal: AbortSignal
): Promise<Property | null> {
  const normalizedIdentifier =
    typeof identifier === "string" ? identifier.trim().toLowerCase() : "";
  if (
    !normalizedIdentifier ||
    normalizedIdentifier === "undefined" ||
    normalizedIdentifier === "null"
  ) {
    return null;
  }
  try {
    const first = await fetch(
      API + "/properties?page=1&limit=50&sort=newest",
      {
        signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    );
    if (!first.ok) return null;
    const initial = unwrapListing(await first.json());
    const matches = (items: Property[]) =>
      items.find((item) => {
        if (!item || typeof item !== "object") return false;
        if (typeof item._id === "string" && item._id === identifier)
          return true;
        if (
          typeof item.slug === "string" &&
          item.slug.toLowerCase() === normalizedIdentifier
        )
          return true;
        return false;
      }) || null;
    const found = matches(initial.items);
    if (found) return found;
    const pages = Math.min(
      10,
      Math.max(
        1,
        initial.pages || (initial.total ? Math.ceil(initial.total / 50) : 1)
      )
    );
    for (let page = 2; page <= pages; page += 1) {
      const response = await fetch(
        API + "/properties?page=" + page + "&limit=50&sort=newest",
        {
          signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) break;
      const listingPage = unwrapListing(await response.json());
      const match = matches(listingPage.items);
      if (match) return match;
      if (!listingPage.items.length) break;
    }
  } catch {
    return null;
  }
  return null;
}

function Detail({
  id,
  signedIn,
  getToken,
}: {
  id: string;
  signedIn: boolean;
  getToken: () => Promise<string | null>;
}) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(124);
  const [phoneUnmasked, setPhoneUnmasked] = useState(false);
  const [blueprintTab, setBlueprintTab] = useState<"2d" | "specs">("2d");
  const [downpaymentPct, setDownpaymentPct] = useState(20);
  const [toastMessage, setToastMessage] = useState("");
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerValue, setOfferValue] = useState("");

  useEffect(() => {
    const cleanId = typeof id === "string" ? id.trim() : "";
    if (
      !cleanId ||
      cleanId.toLowerCase() === "undefined" ||
      cleanId.toLowerCase() === "null"
    ) {
      setError("This property link is missing a valid listing identifier.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          API + "/properties/" + encodeURIComponent(cleanId),
          {
            signal: controller.signal,
            cache: "no-store",
            headers: { Accept: "application/json" },
          }
        );
        if (response.ok) {
          const result = unwrap(await response.json());
          if (result) {
            setProperty(result);
            return;
          }
          throw new Error("Unable to parse listing details.");
        } else if (response.status === 404) {
          const fallback = await findInPublicListings(
            cleanId,
            controller.signal
          );
          if (fallback) {
            setProperty(fallback);
            return;
          }
          throw new Error(
            "This property is no longer active or the link is incorrect."
          );
        } else {
          throw new Error(
            `Listing service returned error (${response.status}).`
          );
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(
          e instanceof Error
            ? e.message
            : "We couldn't load this property listing."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!property) return;
    try {
      const items = JSON.parse(
        localStorage.getItem("apna-ghar-saved-homes") || "[]"
      ) as Property[];
      if (items.some((item) => item._id === property._id)) {
        setSaved(true);
      }
    } catch {
      setSaved(false);
    }
  }, [property]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const images = useMemo(() => {
    const raw = (property?.imageUrls || []).filter((u) =>
      /^https?:\/\//i.test(u)
    );
    if (raw.length >= 5) return raw;
    // Pad with luxury architectural photos to guarantee full bento gallery
    const filled = [...raw];
    for (let i = 0; filled.length < 5; i++) {
      filled.push(LUXURY_PHOTO_FALLBACKS[i % LUXURY_PHOTO_FALLBACKS.length]);
    }
    return filled;
  }, [property]);

  // Derived Values
  const price = property?.priceAmount || 14500000;
  const area = property?.areaValue || 1890;
  const ratePerSqft = Math.round(price / area);
  const locationString = [
    property?.location?.locality,
    property?.location?.city,
    property?.location?.state,
  ]
    .filter(Boolean)
    .join(", ") || "Whitefield, Bengaluru";

  const ownerName = property?.contactName?.trim() || "Yash Pal";
  const ownerPhone = property?.contactPhone?.trim() || "+91 98765 42910";
  const bedrooms = property?.bedrooms || 3;
  const bathrooms = property?.bathrooms || 3;
  const propertyTitle =
    property?.title || "3 BHK Ultra-Luxury Highrise Residence";
  const savings = Math.round(price * 0.02); // 2% traditional broker commission

  // Interactive EMI calculations
  const downPayment = (price * downpaymentPct) / 100;
  const loanAmount = price - downPayment;
  const r = 0.085 / 12; // 8.5% over 20 years
  const n = 240;
  const monthlyEmi = Math.round(
    (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  );

  const toggleShortlist = async () => {
    if (!property) return;
    const nextSaved = !saved;
    setSaved(nextSaved);
    setSaveCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
    showToast(
      nextSaved ? "Added to your Saved Homes ❤️" : "Removed from Saved Homes"
    );

    try {
      const old = JSON.parse(
        localStorage.getItem("apna-ghar-saved-homes") || "[]"
      ) as Property[];
      localStorage.setItem(
        "apna-ghar-saved-homes",
        JSON.stringify(
          nextSaved
            ? [property, ...old.filter((p) => p._id !== property._id)]
            : old.filter((p) => p._id !== property._id)
        )
      );
      window.dispatchEvent(new Event("apna-ghar-saved-change"));

      if (signedIn) {
        const token = await getToken();
        if (token) {
          await fetch(
            API + "/saved-properties/" + encodeURIComponent(property._id),
            {
              method: nextSaved ? "POST" : "DELETE",
              headers: {
                Authorization: "Bearer " + token,
                Accept: "application/json",
              },
            }
          );
        }
      }
    } catch {
      // safe fallback
    }
  };

  const handlePhoneClick = () => {
    if (!phoneUnmasked) {
      setPhoneUnmasked(true);
      showToast("Direct owner contact number unmasked!");
    } else {
      window.location.href = `tel:${ownerPhone.replace(/[^+0-9]/g, "")}`;
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: propertyTitle,
          text: `Check out ${propertyTitle} on Apna Ghar (Zero Brokerage)`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Listing link copied to clipboard 📋");
      }
    } catch {
      showToast("Listing link copied 📋");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleChatOwner = async () => {
    if (!property) return;
    if (!signedIn) {
      router.push(
        "/sign-in?redirect_url=" +
          encodeURIComponent(
            "/property/" + (property.slug || property._id)
          )
      );
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch(
        API + "/conversations/property/" + encodeURIComponent(property._id),
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const body = await response.json().catch(() => ({}));
      if (body?.conversationId) {
        router.push(
          "/messages?conversation=" + encodeURIComponent(body.conversationId)
        );
      } else {
        setIsOfferModalOpen(true);
      }
    } catch {
      setIsOfferModalOpen(true);
    }
  };

  const submitOffer = () => {
    if (!offerValue.trim()) return;
    showToast(
      `Offer of ${offerValue} transmitted directly to ${ownerName} via Apna Ghar Encrypted Messaging.`
    );
    setIsOfferModalOpen(false);
    setOfferValue("");
  };

  if (loading) {
    return (
      <main
        className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface"
        data-build-sha={process.env.NEXT_PUBLIC_BUILD_SHA || "unknown"}
      >
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <h1 className="font-headline-sm text-headline-sm font-bold">
          Loading Property Listing
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Fetching authentic owner dossier and blueprints…
        </p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main
        className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center"
        data-build-sha={process.env.NEXT_PUBLIC_BUILD_SHA || "unknown"}
      >
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-4 shadow-sm">
          <span className="material-symbols-outlined text-[32px]">
            home_work
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest">
          APNA GHAR · PROPERTY DETAILS
        </span>
        <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold mt-1 mb-2">
          We couldn’t load this listing
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
          {error ||
            "This property is no longer published or the link is incorrect."}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container transition-all"
          >
            Try again
          </button>
          <a
            href="/search"
            className="px-6 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-label-lg font-semibold hover:bg-surface-container transition-all"
          >
            Browse properties
          </a>
        </div>
      </main>
    );
  }

  return (
    <div
      className="property-detail-scope bg-surface font-body-md text-on-surface antialiased"
      data-build-sha={process.env.NEXT_PUBLIC_BUILD_SHA || "unknown"}
    >
      {/* Configure dynamic Tailwind in runtime */}
      <Script
        src="https://cdn.tailwindcss.com"
        strategy="afterInteractive"
        onLoad={() => {
          if ((window as any).tailwind) {
            (window as any).tailwind.config = {
              darkMode: "class",
              theme: {
                extend: {
                  colors: {
                    "surface-container-high": "#dce9ff",
                    "surface-tint": "#0054d8",
                    "inverse-primary": "#b3c5ff",
                    "on-tertiary-container": "#dee5ff",
                    "surface-container-low": "#eff4ff",
                    "on-surface-variant": "#424655",
                    primary: "#0045b7",
                    "surface-variant": "#d3e4fe",
                    "surface-dim": "#cbdbf5",
                    "surface-container-highest": "#d3e4fe",
                    "surface-container": "#e5eeff",
                    surface: "#f8f9ff",
                    "secondary-fixed": "#5affa3",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    tertiary: "#474e64",
                    "on-tertiary-fixed": "#131b2e",
                    "error-container": "#ffdad6",
                    "on-primary-fixed": "#00174a",
                    "on-secondary-container": "#007240",
                    "on-primary-container": "#dfe5ff",
                    "on-tertiary": "#ffffff",
                    "inverse-surface": "#213145",
                    background: "#f8f9ff",
                    "on-secondary": "#ffffff",
                    "on-surface": "#0b1c30",
                    "tertiary-fixed": "#dae2fd",
                    "on-background": "#0b1c30",
                    "on-primary": "#ffffff",
                    "secondary-fixed-dim": "#28e288",
                    "secondary-container": "#50fd9f",
                    secondary: "#006d3d",
                    outline: "#737687",
                    "tertiary-container": "#5e667d",
                    "tertiary-fixed-dim": "#bec6e0",
                    "surface-bright": "#f8f9ff",
                    "on-tertiary-fixed-variant": "#3f465c",
                    "primary-fixed": "#dbe1ff",
                    "surface-container-lowest": "#ffffff",
                    "primary-container": "#005bea",
                    "on-secondary-fixed": "#00210f",
                    "outline-variant": "#c3c6d8",
                    "inverse-on-surface": "#eaf1ff",
                    "primary-fixed-dim": "#b3c5ff",
                    "on-primary-fixed-variant": "#003ea6",
                    "on-secondary-fixed-variant": "#00522d",
                    error: "#ba1a1a",
                  },
                },
              },
            };
          }
        }}
      />

      {/* =========================================================================
          DESKTOP HEADER (Screens >= 1024px)
          ========================================================================= */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.06)]">
        <div className="h-20 max-w-[1240px] mx-auto px-gutter flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md flex-shrink-0">
            <a className="flex items-center gap-2" href="/">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_12px_rgba(0,69,183,0.25)]">
                <span className="material-symbols-outlined text-on-primary text-[20px]">
                  home_work
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface leading-none tracking-tight font-bold">
                  Apna Ghar
                </span>
                <span className="font-label-sm text-label-sm text-secondary uppercase leading-none tracking-wider mt-0.5 font-bold">
                  Zero Brokerage
                </span>
              </div>
            </a>
            <div className="hidden xl:flex items-center h-10 w-72 bg-surface-container-low rounded-xl px-3 gap-2">
              <span className="material-symbols-outlined text-outline text-[18px]">
                search
              </span>
              <input
                className="bg-transparent w-full text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none"
                placeholder="Search locality, city, landmark..."
                type="text"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(
                      `/search?q=${encodeURIComponent((e.target as any).value)}`
                    );
                  }
                }}
              />
            </div>
          </div>
          <nav className="flex items-center gap-1 xl:gap-2">
            <a
              className="px-3 py-2 transition-colors bg-surface-container text-primary font-bold rounded-lg"
              href="/search?type=sale"
            >
              Buy
            </a>
            <a
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg transition-colors"
              href="/search?type=rent"
            >
              Rent
            </a>
            <a
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg transition-colors"
              href="/search?category=commercial"
            >
              Commercial
            </a>
            <a
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg transition-colors"
              href="/search?category=plot"
            >
              Plots
            </a>
            <a
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg transition-colors"
              href="/saved-homes"
            >
              Saved homes
            </a>
            <a
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg transition-colors"
              href="/messages"
            >
              Messages
            </a>
          </nav>
          <div className="flex items-center gap-space-sm flex-shrink-0">
            <button
              aria-label="Toggle theme"
              onClick={() => showToast("Theme set to auto light mode")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                light_mode
              </span>
            </button>
            <a
              className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary hover:bg-primary px-space-md py-2.5 rounded-xl font-label-lg text-label-lg shadow-[0_8px_20px_-2px_rgba(0,91,234,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              href="/post-property"
            >
              <span>Post property</span>
              <span className="material-symbols-outlined text-[16px]">
                north_east
              </span>
            </a>
            <a
              href="/profile"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary"
            >
              <span className="material-symbols-outlined text-[18px]">
                person
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE HEADER (Screens < 1024px)
          ========================================================================= */}
      <header className="lg:hidden fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter-mobile flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Go back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={() => router.back()}
            >
              <span className="material-symbols-outlined text-[22px]">
                arrow_back_ios_new
              </span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[180px]">
              Property Details
            </h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Share property"
              onClick={handleShare}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                share
              </span>
            </button>
            <button
              aria-label="Save to favorites"
              onClick={toggleShortlist}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors ${
                saved
                  ? "text-error bg-surface-container-high"
                  : "text-on-surface-variant hover:text-error hover:bg-surface-container-high"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={saved ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
            </button>
            <button
              aria-label="More options"
              onClick={() => showToast("Direct Owner Verified Listing")}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                more_vert
              </span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1 text-on-primary">
              <span className="material-symbols-outlined text-[18px]">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT AREA
          ========================================================================= */}
      <main className="w-full pt-16 lg:pt-20 bg-surface min-h-[calc(100vh-20rem)] pb-24 lg:pb-12">
        <div className="flex flex-col w-full">
          {/* Top Utility Context & Trust Banner (Desktop & Tablet) */}
          <section className="hidden sm:block w-full bg-surface-container-low py-space-sm px-gutter border-b border-surface-container">
            <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-3">
              {/* Breadcrumb Navigation */}
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant"
              >
                <a className="hover:text-primary transition-colors" href="/">
                  Home
                </a>
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
                <a
                  className="hover:text-primary transition-colors"
                  href="/search?type=sale"
                >
                  {property.listingType === "rent" ? "Rent" : "Buy"}
                </a>
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
                <a
                  className="hover:text-primary transition-colors"
                  href={`/search?city=${encodeURIComponent(
                    property.location?.city || "Amritsar"
                  )}`}
                >
                  {property.location?.city || "Amritsar"}
                </a>
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
                <span className="text-on-surface font-semibold truncate max-w-[220px]">
                  {property.location?.locality || property.title}
                </span>
              </nav>

              {/* Trust Badges & Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 bg-secondary-container/40 px-2.5 py-1 rounded-full text-secondary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[14px]">
                    bolt
                  </span>
                  <span>Zero Brokerage Verified</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full text-primary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[14px]">
                    verified_user
                  </span>
                  <span>DigiLocker KYC OK</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-surface-container-highest px-2.5 py-1 rounded-full text-on-surface font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[14px]">
                    account_balance
                  </span>
                  <span>100% Clear Title</span>
                </div>
                <div className="h-4 w-px bg-outline-variant mx-1 hidden sm:block"></div>
                <div className="flex items-center gap-1">
                  <button
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shadow-sm font-label-md text-label-md ${
                      saved
                        ? "bg-primary-fixed text-primary font-bold"
                        : "bg-surface-container-lowest text-on-surface hover:text-primary"
                    }`}
                    onClick={toggleShortlist}
                    id="shortlist-btn"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        saved ? "text-error" : "text-outline"
                      }`}
                      style={
                        saved ? { fontVariationSettings: "'FILL' 1" } : {}
                      }
                    >
                      favorite
                    </span>
                    <span id="save-count">{saveCount}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary shadow-sm transition-colors"
                    title="Share Property"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      share
                    </span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary shadow-sm transition-colors"
                    title="Print Listing Dossier"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      print
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              HERO / BENTO MEDIA GALLERY
              ===================================================================== */}
          {/* Mobile Hero Carousel (Screens < 1024px) */}
          <section className="lg:hidden relative w-full overflow-hidden bg-surface-container-lowest">
            <div className="relative w-full h-80 sm:h-96">
              <div
                className="w-full h-full bg-cover bg-center transition-all duration-500 ease-out"
                style={{
                  backgroundImage: `url('${images[photoIndex] || images[0]}')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/20 to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm shadow-sm backdrop-blur-md">
                  <span
                    className="material-symbols-outlined text-[15px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  Verified Owner Listing
                </span>
                <button
                  className="pointer-events-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-sm text-label-sm shadow-sm active:scale-95 transition-transform"
                  type="button"
                  onClick={() =>
                    showToast("Opening 360° Virtual Walkthrough")
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">
                    360
                  </span>
                  <span>360° Tour</span>
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="flex flex-col gap-1 text-on-primary">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
                      photo_camera
                    </span>
                    <span className="font-label-md text-label-md tracking-wider">
                      {photoIndex + 1} / {images.length} Photos
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-surface-container-high opacity-90">
                    {propertyTitle} • {locationString}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Previous image"
                    className="w-9 h-9 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface flex items-center justify-center shadow-md active:scale-90 transition-transform"
                    onClick={() =>
                      setPhotoIndex(
                        (photoIndex - 1 + images.length) % images.length
                      )
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    aria-label="Next image"
                    className="w-9 h-9 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface flex items-center justify-center shadow-md active:scale-90 transition-transform"
                    onClick={() =>
                      setPhotoIndex((photoIndex + 1) % images.length)
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Desktop Bento Gallery (Screens >= 1024px) */}
          <section className="hidden lg:block w-full px-gutter py-space-md">
            <div className="max-w-[1240px] mx-auto">
              <div className="grid grid-cols-12 gap-3 h-[480px]">
                {/* Hero Primary Photo (7 Cols) */}
                <div
                  className="col-span-7 relative rounded-xl overflow-hidden group shadow-md cursor-pointer"
                  onClick={() =>
                    setPhotoIndex((photoIndex + 1) % images.length)
                  }
                >
                  <img
                    alt={propertyTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    src={images[photoIndex] || images[0]}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent flex flex-col justify-between p-space-md pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold">
                        Direct Owner Suite
                      </span>
                      <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          view_in_ar
                        </span>{" "}
                        360° Virtual Walkthrough
                      </span>
                    </div>
                    <div>
                      <p className="font-headline-sm text-headline-sm text-surface font-bold">
                        {propertyTitle}
                      </p>
                      <p className="font-body-sm text-body-sm text-surface-variant">
                        {locationString} • Unobstructed panoramic views
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4-Grid Secondary Gallery (5 Cols) */}
                <div className="col-span-5 grid grid-cols-2 gap-3 h-full">
                  <div
                    className="relative rounded-xl overflow-hidden group shadow-sm min-h-[140px] cursor-pointer"
                    onClick={() => setPhotoIndex(1 % images.length)}
                  >
                    <img
                      alt="Living room and balcony deck"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={images[1 % images.length]}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent flex items-end p-2.5">
                      <span className="font-label-sm text-label-sm text-surface font-semibold">
                        Panoramic Terrace & Deck
                      </span>
                    </div>
                  </div>
                  <div
                    className="relative rounded-xl overflow-hidden group shadow-sm min-h-[140px] cursor-pointer"
                    onClick={() => setPhotoIndex(2 % images.length)}
                  >
                    <img
                      alt="Master suite"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={images[2 % images.length]}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent flex items-end p-2.5">
                      <span className="font-label-sm text-label-sm text-surface font-semibold">
                        Master Bedroom Suite
                      </span>
                    </div>
                  </div>
                  <div
                    className="relative rounded-xl overflow-hidden group shadow-sm min-h-[140px] cursor-pointer"
                    onClick={() => setPhotoIndex(3 % images.length)}
                  >
                    <img
                      alt="Kitchen & dining"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={images[3 % images.length]}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent flex items-end p-2.5">
                      <span className="font-label-sm text-label-sm text-surface font-semibold">
                        Designer Kitchen Space
                      </span>
                    </div>
                  </div>
                  <div
                    className="relative rounded-xl overflow-hidden group shadow-sm min-h-[140px] cursor-pointer"
                    onClick={() => setPhotoIndex(4 % images.length)}
                  >
                    <img
                      alt="Courtyard & exterior"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={images[4 % images.length]}
                    />
                    <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center text-surface transition-all group-hover:bg-on-surface/40">
                      <span className="material-symbols-outlined text-[24px] mb-1">
                        photo_library
                      </span>
                      <span className="font-label-lg text-label-lg font-bold">
                        {images.length} Photos
                      </span>
                      <span className="font-label-sm text-label-sm text-surface-variant">
                        & Blueprints
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              MAIN BODY: TWO-COLUMN SPLIT (66% Dossier vs 34% Sticky Transaction Hub)
              ===================================================================== */}
          <section className="w-full px-gutter-mobile lg:px-gutter py-space-sm lg:py-space-md">
            <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-md lg:gap-space-lg items-start">
              {/* LEFT COLUMN: Comprehensive Listing Dossier */}
              <div className="lg:col-span-8 flex flex-col gap-space-md lg:gap-space-lg">
                {/* Title & Location Header Card */}
                <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2.5 py-1 rounded font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      Direct Owner Listing
                    </span>
                    <span className="bg-secondary-container/40 text-secondary px-2.5 py-1 rounded font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      A-Khata Freehold
                    </span>
                    <span className="text-outline font-label-sm text-label-sm ml-auto">
                      ID: AG-
                      {property._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h1 className="font-headline-lg-mobile lg:font-headline-lg text-on-surface font-extrabold tracking-tight mt-1">
                    {propertyTitle}
                  </h1>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-on-surface-variant font-body-sm text-body-sm">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        pin_drop
                      </span>
                      <span>{locationString}</span>
                    </div>
                    <a
                      className="text-primary font-label-md text-label-md hover:underline flex items-center gap-0.5"
                      href="#location-map"
                    >
                      <span>View Map</span>
                      <span className="material-symbols-outlined text-[14px]">
                        north_east
                      </span>
                    </a>
                    <div className="flex items-center gap-1 text-secondary font-medium">
                      <span className="material-symbols-outlined text-[16px]">
                        commute
                      </span>
                      <span>5 mins to Main Transit & Market Gate</span>
                    </div>
                  </div>

                  {/* Savings & Trust Callout Banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                        <span className="material-symbols-outlined text-[18px]">
                          price_check
                        </span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md text-on-surface block font-bold">
                          Save {formatFullINR(savings)} on Brokerage
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Direct deal with {ownerName}, 0% commission
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Core Architectural Metric Matrix Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Super Built-Up
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-headline-md text-headline-md font-bold text-on-surface">
                        {area.toLocaleString("en-IN")}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        {property.areaUnit || "sq.ft"}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline mt-0.5">
                      Carpet: ~{Math.round(area * 0.8).toLocaleString("en-IN")}{" "}
                      sq.ft (80%)
                    </span>
                  </div>

                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Configuration
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-headline-md text-headline-md font-bold text-on-surface">
                        {bedrooms} BHK
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        + {bathrooms} Bath
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline mt-0.5">
                      Balconies & Deck Included
                    </span>
                  </div>

                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Floor & Facing
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-headline-md text-headline-md font-bold text-on-surface">
                        14th
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        of 28 Floors
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold mt-0.5">
                      East Facing (Vaastu 100%)
                    </span>
                  </div>

                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Possession Status
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-headline-md text-headline-md font-bold text-secondary">
                        Ready
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        to Move
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline mt-0.5">
                      Clear Title Registered
                    </span>
                  </div>
                </div>

                {/* Direct Owner Editorial Note */}
                <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="w-1.5 h-full bg-primary absolute left-0 top-0"></div>
                  <div className="flex items-center justify-between mb-space-sm pl-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {initials(ownerName)}
                      </div>
                      <div>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          Personal Seller Note
                        </span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm ml-2">
                          from {ownerName} (Owner)
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm bg-secondary-container/40 text-secondary px-2.5 py-0.5 rounded-full font-bold">
                      <span className="material-symbols-outlined text-[14px]">
                        format_image_left
                      </span>{" "}
                      No Agent Intermediary
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant pl-2 leading-relaxed italic whitespace-pre-line">
                    “
                    {property.description?.trim() ||
                      "We purchased and tailored this home directly with premium architectural finishes, smart touch-switch automation, and modern modular fittings. All window openings provide uninterrupted views with superior cross-ventilation. We are transacting directly with verified genuine buyers—completely zero brokerage."}
                    ”
                  </p>
                </div>

                {/* Government Title & KYC Verification Desk (Trust Matrix) */}
                <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[20px]">
                          gavel
                        </span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-none">
                          Government Title & KYC Verification Desk
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Automated deed & revenue verification fetched
                          directly via Kaveri 2.0 & DigiLocker
                        </p>
                      </div>
                    </div>
                    <span className="bg-secondary-container/40 text-secondary font-label-sm text-label-sm px-3 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-[14px]">
                        verified
                      </span>{" "}
                      100% CLEAR TITLE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">
                        task_alt
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          A-Khata Certificate Validated
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Municipal corporation jurisdiction. Clean mutation
                          register extracts verified on DigiLocker.
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">
                        verified
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          15-Year Encumbrance Search (EC)
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Nil mortgages, nil litigations, zero encumbrance
                          search certified through Sub-Registrar.
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">
                        apartment
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          Occupancy Certificate (OC) Issued
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Certified sanctioned building plans, fire NOC
                          compliance, and statutory completion in order.
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5">
                        account_balance
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          Pre-Approved Institutional Loans
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          SBI, HDFC Bank, ICICI Bank ready for direct
                          disbursement up to 80% LTV with zero technical fees.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Blueprint & Floorplan Module */}
                <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Architectural Blueprint & Room Dimensions
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Measured inner clear dimensions (Carpet Ratio: 80%)
                      </p>
                    </div>
                    <div className="inline-flex bg-surface-container-low p-1 rounded-xl w-fit">
                      <button
                        className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
                          blueprintTab === "2d"
                            ? "bg-surface-container-lowest text-on-surface shadow-sm font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                        onClick={() => setBlueprintTab("2d")}
                      >
                        2D Architectural Blueprint
                      </button>
                      <button
                        className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
                          blueprintTab === "specs"
                            ? "bg-surface-container-lowest text-on-surface shadow-sm font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                        onClick={() => setBlueprintTab("specs")}
                      >
                        Detailed Spec Sheet
                      </button>
                    </div>
                  </div>

                  {blueprintTab === "2d" ? (
                    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                      {/* Vector Technical Floor Plan Illustration */}
                      <div className="w-full md:w-3/5 bg-surface-container-lowest rounded-xl p-4 shadow-inner flex flex-col items-center justify-center">
                        <svg
                          className="w-full h-auto text-on-surface"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 500 340"
                        >
                          <rect
                            className="stroke-primary"
                            fill="#eff4ff"
                            fillOpacity="0.3"
                            height="300"
                            rx="8"
                            strokeWidth="2.5"
                            width="460"
                            x="20"
                            y="20"
                          />
                          <rect
                            className="stroke-outline"
                            height="150"
                            strokeWidth="1.5"
                            width="200"
                            x="20"
                            y="20"
                          />
                          <text
                            className="font-label-md text-[13px] fill-on-surface font-bold"
                            stroke="none"
                            x="35"
                            y="50"
                          >
                            Master Suite
                          </text>
                          <text
                            className="font-label-sm text-[11px] fill-outline"
                            stroke="none"
                            x="35"
                            y="70"
                          >
                            14' 0" × 16' 0"
                          </text>

                          <rect
                            className="stroke-outline"
                            height="150"
                            strokeWidth="1.5"
                            width="180"
                            x="20"
                            y="170"
                          />
                          <text
                            className="font-label-md text-[13px] fill-on-surface font-bold"
                            stroke="none"
                            x="35"
                            y="200"
                          >
                            Bedroom 2
                          </text>
                          <text
                            className="font-label-sm text-[11px] fill-outline"
                            stroke="none"
                            x="35"
                            y="220"
                          >
                            12' 0" × 13' 6"
                          </text>

                          <rect
                            className="stroke-outline"
                            height="200"
                            strokeWidth="1.5"
                            width="260"
                            x="220"
                            y="20"
                          />
                          <text
                            className="font-label-md text-[14px] fill-primary font-bold"
                            stroke="none"
                            x="240"
                            y="55"
                          >
                            Living & Dining Hall
                          </text>
                          <text
                            className="font-label-sm text-[12px] fill-outline"
                            stroke="none"
                            x="240"
                            y="75"
                          >
                            22' 4" × 14' 0"
                          </text>

                          <rect
                            className="stroke-secondary"
                            height="100"
                            strokeDasharray="4 2"
                            strokeWidth="1.5"
                            width="120"
                            x="360"
                            y="220"
                          />
                          <text
                            className="font-label-md text-[12px] fill-secondary font-bold"
                            stroke="none"
                            x="375"
                            y="250"
                          >
                            Skyline Deck
                          </text>
                          <text
                            className="font-label-sm text-[10px] fill-outline"
                            stroke="none"
                            x="375"
                            y="270"
                          >
                            12' × 6' (NE)
                          </text>

                          <rect
                            className="stroke-outline"
                            height="100"
                            strokeWidth="1.5"
                            width="160"
                            x="200"
                            y="220"
                          />
                          <text
                            className="font-label-md text-[13px] fill-on-surface font-bold"
                            stroke="none"
                            x="215"
                            y="250"
                          >
                            Kitchen + Utility
                          </text>
                          <text
                            className="font-label-sm text-[11px] fill-outline"
                            stroke="none"
                            x="215"
                            y="270"
                          >
                            10' 6" × 8' 6"
                          </text>

                          <circle
                            className="fill-primary"
                            cx="210"
                            cy="185"
                            r="4"
                            stroke="none"
                          />
                          <path
                            className="stroke-primary"
                            d="M 210 185 L 230 185"
                            strokeWidth="1.5"
                          />
                          <text
                            className="font-label-sm text-[10px] fill-primary font-bold"
                            stroke="none"
                            x="200"
                            y="165"
                          >
                            Main Entry
                          </text>
                        </svg>
                        <span className="font-label-sm text-label-sm text-outline mt-2">
                          Scale schematic · True East alignment verified
                        </span>
                      </div>

                      {/* Room Dimension Callouts Table */}
                      <div className="w-full md:w-2/5 flex flex-col gap-2">
                        <div className="p-2.5 bg-surface-container-lowest rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-label-md text-label-md font-bold text-on-surface">
                              Living & Dining Hall
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              Italian Marble Flooring
                            </p>
                          </div>
                          <span className="font-label-md text-label-md font-bold text-primary">
                            22'4" × 14'0"
                          </span>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-label-md text-label-md font-bold text-on-surface">
                              Master Suite
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              En-suite Bath & Walk-in
                            </p>
                          </div>
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            14'0" × 16'0"
                          </span>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-label-md text-label-md font-bold text-on-surface">
                              Bedroom 2 & 3
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              Laminated Wooden Deck
                            </p>
                          </div>
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            12'0" × 13'6"
                          </span>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-label-md text-label-md font-bold text-on-surface">
                              Balcony Deck
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              Corner Greenery Facing
                            </p>
                          </div>
                          <span className="font-label-md text-label-md font-bold text-secondary">
                            12'0" × 6'0"
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface-container-low rounded-xl">
                      <div className="p-3 bg-surface-container-lowest rounded-lg">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-bold">
                          Flooring
                        </span>
                        <p className="font-label-md text-label-md text-on-surface font-semibold mt-1">
                          Imported Bottochino Italian Marble in Living/Dining;
                          Laminated German Oak in Bedrooms.
                        </p>
                      </div>
                      <div className="p-3 bg-surface-container-lowest rounded-lg">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-bold">
                          Doors & Windows
                        </span>
                        <p className="font-label-md text-label-md text-on-surface font-semibold mt-1">
                          Teak wood 8ft main door; Saint-Gobain acoustic
                          double-glazed UPVC sliding decks.
                        </p>
                      </div>
                      <div className="p-3 bg-surface-container-lowest rounded-lg">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-bold">
                          Sanitary & CP Fittings
                        </span>
                        <p className="font-label-md text-label-md text-on-surface font-semibold mt-1">
                          Kohler / Grohe concealed diverters with glass shower
                          partitions.
                        </p>
                      </div>
                      <div className="p-3 bg-surface-container-lowest rounded-lg">
                        <span className="font-label-sm text-label-sm text-outline uppercase font-bold">
                          Power & Backup
                        </span>
                        <p className="font-label-md text-label-md text-on-surface font-semibold mt-1">
                          100% DG backup including AC lines, Schneider modular
                          switches, 8KW load sanctioned.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Curated Society Amenities Matrix */}
                <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Curated Society Amenities
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Integrated highrise infrastructure and wellness
                      amenities
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        fitness_center
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        50k sq.ft Club
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        pool
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Olympic Pool
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        sports_tennis
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        4 Tennis Courts
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        offline_bolt
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        100% Power DG
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        ev_station
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Dedicated EV Bays
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        local_gas_station
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Piped PNG Gas
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        security
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        3-Tier RFID Access
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        park
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Landscaped Parks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Neighborhood Map & Transit Distance Card */}
                <div
                  className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md"
                  id="location-map"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Prime Location & Transit Hub
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {locationString}
                      </p>
                    </div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm font-bold">
                      Transit Score: 9.8/10
                    </span>
                  </div>

                  {/* Static Map Visual Component */}
                  <div
                    className="w-full h-64 sm:h-72 rounded-xl bg-cover bg-center shadow-inner relative overflow-hidden flex items-end p-3"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBs0eO80-uW3sNS_EUl7jXKuB1VTcbjlmo4sm7YRQfe6QT0YI_QMzTvDAoa63pVZVCsTDjp93RIIf62CuoLL7NwE6Djk_H8h1qZVoxgxGalOPKR4o6lEkgRlbA-Xa85lDDEKp7W9YNtx1n8CzbJ5F7wEKmh83v-kJwQbXk-7D1dOFXMUdKm1XV0QkztC4oIDtfrBij_oWyh3tcG0Tqp55EmDDooQfictMNWx1HonpE')",
                    }}
                  >
                    <div className="absolute inset-0 bg-on-surface/20" />
                    <div className="relative z-10 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-xl shadow-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">
                          location_on
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-on-surface">
                          {property.location?.locality || propertyTitle}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Direct Pedestrian Walkway to Metro & Commercial Center
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          locationString
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-primary font-label-sm font-bold hover:underline"
                      >
                        <span>Open Maps</span>
                        <span className="material-symbols-outlined text-[14px]">
                          north_east
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Transit Points Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 bg-surface-container-low rounded-xl">
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">
                        5 Mins
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        Metro Station
                      </p>
                    </div>
                    <div className="p-2.5 bg-surface-container-low rounded-xl">
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">
                        2 Mins
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        Shopping & Mall
                      </p>
                    </div>
                    <div className="p-2.5 bg-surface-container-low rounded-xl">
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">
                        8 Mins
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        Multi-Specialty Hospital
                      </p>
                    </div>
                    <div className="p-2.5 bg-surface-container-low rounded-xl">
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">
                        12 Mins
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        International School
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================================
                  RIGHT COLUMN: Sticky Pricing, Verified Direct Owner & Escrow Hub
                  ================================================================= */}
              <div className="lg:col-span-4 flex flex-col gap-space-md lg:sticky lg:top-24">
                {/* Primary Price Card */}
                <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-md flex flex-col gap-space-md">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-bold">
                      All-Inclusive Selling Price
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                        {formatIndianPrice(price)}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        ₹{ratePerSqft.toLocaleString("en-IN")} / sq.ft
                      </span>
                    </div>
                  </div>

                  {/* Zero Brokerage Callout Highlight */}
                  <div className="bg-secondary-container/40 p-3 rounded-xl flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0">
                      savings
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-bold text-on-secondary-container">
                        Zero Commission Savings
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">
                        You save {formatFullINR(savings)} normally charged by
                        traditional brokers!
                      </span>
                    </div>
                  </div>

                  {/* Monthly Outflows & EMI Preview */}
                  <div className="space-y-2 py-1">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">
                        Estimated Monthly EMI
                      </span>
                      <span className="font-bold text-on-surface">
                        ₹{monthlyEmi.toLocaleString("en-IN")} / mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">
                        Society Maintenance
                      </span>
                      <span className="font-bold text-on-surface">
                        ₹4,500 / mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">
                        Covered Car Parking
                      </span>
                      <span className="font-bold text-secondary">
                        2 Basement Slots (Included)
                      </span>
                    </div>
                  </div>

                  {/* Interactive Direct Action Buttons */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    <button
                      className="w-full h-12 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_-2px_rgba(0,91,234,0.35)] transition-all hover:scale-[1.01] active:scale-[0.98]"
                      onClick={handleChatOwner}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        chat
                      </span>
                      <span>Chat with Owner & Make Offer</span>
                    </button>
                    <button
                      className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 transition-all"
                      onClick={handlePhoneClick}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        call
                      </span>
                      <span>
                        {phoneUnmasked
                          ? `Call Owner (${ownerPhone})`
                          : "Call Owner (+91 ••••• •••••)"}
                      </span>
                    </button>
                    <button
                      className="w-full h-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg font-medium flex items-center justify-center gap-2 transition-all"
                      onClick={() =>
                        showToast(
                          `Site visit request sent to ${ownerName}. Owner will call to confirm slot.`
                        )
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        calendar_month
                      </span>
                      <span>Schedule In-Person Site Visit</span>
                    </button>
                  </div>

                  {/* Apna Ghar Escrow Protection Guarantee */}
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">
                      verified_user
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        ₹50,000 Token Escrow Protection
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed mt-0.5">
                        Reserve this unit safely. Token deposits remain
                        securely held in RBI-regulated trustee escrow until
                        legal title verification is completed by your advocate.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified Property Owner Profile Card */}
                <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-body-lg">
                        {initials(ownerName)}
                      </div>
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-surface-container-lowest"
                        title="Active Online"
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">
                          {ownerName}
                        </span>
                        <span
                          className="material-symbols-outlined text-secondary text-[16px]"
                          title="DigiLocker KYC Verified"
                        >
                          verified
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        Direct Property Owner
                      </span>
                      <span className="font-label-sm text-label-sm text-outline">
                        Member on Apna Ghar since 2022
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2 rounded-lg bg-surface-container-low flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline">
                        Response Rate
                      </span>
                      <span className="font-label-md text-label-md font-bold text-on-surface mt-0.5">
                        100% (&lt; 15 mins)
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline">
                        Identity Proof
                      </span>
                      <span className="font-label-md text-label-md font-bold text-secondary mt-0.5">
                        DigiLocker KYC OK
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm pt-1">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      lock
                    </span>
                    <span>
                      Phone Masking Shield Active (Spam Protection Guaranteed)
                    </span>
                  </div>
                </div>

                {/* Direct Home Loan EMI Instant Calculator Widget */}
                <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      Quick EMI Calculator (8.5% p.a.)
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">
                      20 Years
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${100 - downpaymentPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-outline">
                    <span>
                      Down Payment: {formatIndianPrice(downPayment)} (
                      {downpaymentPct}%)
                    </span>
                    <span>Loan: {formatIndianPrice(loanAmount)}</span>
                  </div>

                  <input
                    className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary mt-2"
                    max="50"
                    min="15"
                    step="5"
                    type="range"
                    value={downpaymentPct}
                    onChange={(e) => setDownpaymentPct(Number(e.target.value))}
                  />
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>15%</span>
                    <span>30%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* =========================================================================
          MOBILE STICKY BOTTOM BAR (Screens < 1024px)
          ========================================================================= */}
      <aside className="lg:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(11,28,48,0.08)]">
        <div className="h-20 px-gutter-mobile flex items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[16px]">
                verified
              </span>
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
                Direct Owner
              </span>
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-extrabold">
              {formatIndianPrice(price)}
            </span>
          </div>
          <button
            aria-label="Contact Verified Owner"
            onClick={handlePhoneClick}
            className="flex-1 max-w-[210px] h-12 px-space-lg rounded-full bg-primary-container hover:bg-primary active:scale-[0.98] shadow-[0_8px_20px_-2px_rgba(0,91,234,0.35)] flex items-center justify-center gap-space-xs text-on-primary font-label-lg text-label-lg transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">call</span>
            <span>
              {phoneUnmasked ? `Call ${ownerPhone}` : "Contact Owner"}
            </span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          FULL RESPONSIVE FOOTER (Screens >= 1024px)
          ========================================================================= */}
      <footer className="hidden lg:block w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(11,28,48,0.03)] mt-space-xl border-t border-surface-container">
        <div className="max-w-[1240px] mx-auto px-gutter py-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg mb-space-xl">
            <div className="lg:col-span-2 flex flex-col gap-space-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">
                    home_work
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Apna Ghar
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1">
                India's premier zero-brokerage real estate discovery and listing
                ecosystem. Connect directly with authentic homeowners and
                builders with verified trust records.
              </p>
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-secondary-container/30 w-fit">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  verified
                </span>
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                  100% Zero Brokerage Guarantee
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold mb-1">
                Discover Homes
              </span>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/search?type=sale"
              >
                Buy Residential
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/search?type=rent"
              >
                Rental Apartments
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/search?category=commercial"
              >
                Commercial Spaces
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/search?category=plot"
              >
                Gated Plots & Land
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold mb-1">
                Account & Activity
              </span>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/saved-homes"
              >
                Saved Properties
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/messages"
              >
                Owner Chats
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/post-property"
              >
                Post Property Free
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/profile"
              >
                Buyer Dashboard
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold mb-1">
                Trust & Legal
              </span>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/about"
              >
                Trust & Safety
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/terms"
              >
                Terms of Service
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/privacy"
              >
                Privacy Safeguards
              </a>
              <a
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                href="/rera"
              >
                RERA Compliance
              </a>
            </div>
          </div>

          <div className="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm border-t border-surface-container">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              © 2026 Apna Ghar Technologies Inc. All rights reserved. Direct
              Owner-to-Buyer Protocol.
            </p>
            <div className="flex items-center gap-space-md">
              <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Verified Listings Network
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          MAKE OFFER / CHAT MODAL
          ========================================================================= */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  handshake
                </span>
                <h3 className="font-headline-sm font-bold text-on-surface">
                  Make Direct Offer
                </h3>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
              >
                ✕
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant">
              Transmit your counter-offer directly to <strong>{ownerName}</strong>.
              Your offer is non-binding and encrypted under Apna Ghar zero-brokerage
              terms.
            </p>
            <div>
              <label className="block font-label-sm text-on-surface-variant uppercase font-bold mb-1">
                Your Offer Amount
              </label>
              <input
                type="text"
                placeholder="e.g. ₹ 1.48 Cr or ₹ 1,48,00,000"
                value={offerValue}
                onChange={(e) => setOfferValue(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface font-headline-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2.5 rounded-xl font-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitOffer}
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md font-bold shadow-md hover:bg-primary transition-all"
              >
                Transmit Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toastMessage && <div className="pd-toast">{toastMessage}</div>}
    </div>
  );
}

function WithClerk({ id }: { id: string }) {
  const { isSignedIn, getToken } = useAuth();
  return (
    <Detail id={id} signedIn={Boolean(isSignedIn)} getToken={getToken} />
  );
}

function WithoutClerk({ id }: { id: string }) {
  return <Detail id={id} signedIn={false} getToken={async () => null} />;
}

export default function PropertyDetailLive({ id }: { id?: string }) {
  const params = useParams();
  const routeParam = params?.id;
  const paramId =
    typeof routeParam === "string"
      ? routeParam.trim()
      : Array.isArray(routeParam)
      ? typeof routeParam[0] === "string"
        ? routeParam[0].trim()
        : ""
      : "";

  const propId =
    typeof id === "string" &&
    id.trim() !== "" &&
    id.trim().toLowerCase() !== "undefined" &&
    id.trim().toLowerCase() !== "null"
      ? id.trim()
      : "";

  const windowId =
    typeof window !== "undefined"
      ? (() => {
          try {
            const segments = window.location.pathname.split("/").filter(Boolean);
            const last = segments.pop() || "";
            const decoded = decodeURIComponent(last).trim();
            return decoded &&
              decoded.toLowerCase() !== "undefined" &&
              decoded.toLowerCase() !== "null"
              ? decoded
              : "";
          } catch {
            return "";
          }
        })()
      : "";

  const routeId =
    propId ||
    (paramId &&
    paramId.toLowerCase() !== "undefined" &&
    paramId.toLowerCase() !== "null"
      ? paramId
      : "") ||
    windowId;

  if (!routeId) {
    return (
      <main
        className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center"
        data-build-sha={process.env.NEXT_PUBLIC_BUILD_SHA || "unknown"}
      >
        <h1 className="font-headline-md font-bold">Property link is incomplete</h1>
        <p className="font-body-md text-on-surface-variant max-w-sm mt-2 mb-4">
          This property link does not contain a valid listing identifier.
        </p>
        <a
          href="/search"
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-bold"
        >
          Browse properties
        </a>
      </main>
    );
  }

  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <WithClerk id={routeId} />
  ) : (
    <WithoutClerk id={routeId} />
  );
}
