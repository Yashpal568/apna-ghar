"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
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

const LUXURY_PHOTO_FALLBACKS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBpkGLtIRJ2P8LD2oJSg2HaAVvKmydajf4yPxObnwg8nRx5p8YLQd1MNyjza8OK8QV48AL-7Phfpx2LD490SkPRKOBtXJZbcS_WZW4psayWVBMASbWM_so_QIVkezoKiZBsTmO2bXxMGh3audoBqWrsjEOPrWfGhjKmUkMo7UqUUNmdOuauC_tMGUpIyWIdV5tCeE9Cv1ozJnQB85jsGimLR4rmssm00lwhF7baDRhkWK8sxs1TyaZk",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCbdd66wMfWFEeUfHJcR4FBh6QPH3zCvqfVRhU2gQW5Ky-SGR2FEbWj2A2DSND-jduaD8vC3DvRcEVaTDYp_5Sg_FL7rfI2-N-vLdujiw2Mos_7sLFoXTqqBspaea3jsVriH_P37_n01rhbpaI3D72xZKnEmPUyIpqqH444Os_a7sVGvM7SlVnKdnvXN8tCLJvifYAnWihgkVaoUu0dxb8Uf0997uM2xG39S4-GuKsHrJW7mL65fgEc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD9peq6BrORC1uT_3wttO9ujS6NlCSG7-0qvH7h1iqcOXDBK9yEvGbBbC3argtGcHUHcKlSKFL1EHgHhIRlN1NyUCIyp3fN3nGnTLD1JfQQ5YWdupBa6WKfR89jgvkv7SZXy0UGOz4Pl0ih2LpP6kE0NPbbEj0YMthMzB4LHerFUlIf856nWu_w_oot_pfdke_jjJGzuEkNNiBsKecuPvWvc9C3MJ1wSAcuSMxJs0-eh8mV-m-T9VQT",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBIO8XrouLCZUOAaU83rRoK0fKY-si16l2A4aa3kEZASqcpjNJ7T3nUYYf9BM7CpG91sPgXzRLQ6L2qcCziXLmZgJBgAkPX99m_Cp7jREef4_AmgJ97o5aJrcagE-D-y5DzbpzKsa9Z26Rg5V_4X7ECX4bV5mPlU2471uQ4NnnvLZ5hm3pIFLJukEa0GRJDSjP8tG3-U8H479NXzounf-PchfeRGncQYeFij1XadkYzMc023XIKf_JR",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCfpaBBv822P3QxdgFKZI1H0LG952yjOY7ODE7WipKXYa4zpIccZVx0VvZd-DbMTKquk3ZPWKECCFZZamTPw3tlaGXuh7oyc_1FJC8cCPOgE2fBvM2ZBOjpRMuaXrIWx_TF9_JaJPTzPdQPYDVphrPTM2N96sDqSqguUkV20Z5plbuH6ebykSU1iGbID_jdCn2DWDtAzwv_kYXLjetTGNYSHJaNyWbIAZdBAauRdyp_QtXJfOBhhR1L",
];

function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    return "₹" + (amount / 10000000).toFixed(2) + " Cr";
  } else if (amount >= 100000) {
    return "₹" + (amount / 100000).toFixed(2) + " L";
  }
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function formatINR(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function formatPriceCr(amount: number): string {
  if (amount >= 10000000) {
    return "₹" + (amount / 10000000).toFixed(2) + " Cr";
  }
  return formatIndianCurrency(amount);
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
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(128);
  const [phoneUnmasked, setPhoneUnmasked] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isExpandedDesc, setIsExpandedDesc] = useState(false);
  const [is360Active, setIs360Active] = useState(false);
  const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);

  // Quick Mortgage EMI Calculations State
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [activeBank, setActiveBank] = useState("HDFC");

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

  // Carousel auto-advance (every 4s, pause on hover)
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + 5) % 5);
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % 5);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: property?.title || "4 BHK Luxury Builder Floor in Model Town, Amritsar",
          text: `Check out ${property?.title || "this luxury property"} on Apna Ghar (Zero Brokerage)`,
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

  const toggleShortlist = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    setSaveCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
    showToast(
      nextSaved ? "Added to your Saved Homes ❤️" : "Removed from Saved Homes"
    );

    try {
      const target = property || { _id: id, title: "4 BHK Luxury Floor" };
      const old = JSON.parse(
        localStorage.getItem("apna-ghar-saved-homes") || "[]"
      ) as Property[];
      localStorage.setItem(
        "apna-ghar-saved-homes",
        JSON.stringify(
          nextSaved
            ? [target, ...old.filter((p) => p._id !== (property?._id || id))]
            : old.filter((p) => p._id !== (property?._id || id))
        )
      );
      window.dispatchEvent(new Event("apna-ghar-saved-change"));

      if (signedIn && property?._id) {
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
      window.location.href = `tel:${(property?.contactPhone || "+919876543210").replace(/[^+0-9]/g, "")}`;
    }
  };

  const handleChatOwner = async () => {
    if (!signedIn) {
      router.push(
        "/sign-in?redirect_url=" +
          encodeURIComponent("/property/" + (property?.slug || property?._id || id))
      );
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const propId = property?._id || id;
      const response = await fetch(
        API + "/conversations/property/" + encodeURIComponent(propId),
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
      if (!response.ok) {
        throw new Error(typeof body.message === "string" ? body.message : "Could not start this conversation.");
      }
      if (!body?.conversationId) throw new Error("The conversation was not created. Please try again.");
      router.push("/messages?conversation=" + encodeURIComponent(body.conversationId));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not start this conversation.");
    }
  };

  const handleApplyLoan = () => {
    showToast("Processing pre-approved loan application...");
    setTimeout(() => {
      showToast("Loan pre-sanction application submitted successfully! 🎉");
      setTimeout(() => setIsEmiModalOpen(false), 1200);
    }, 700);
  };

  // Values & Calculations
  const priceAmount = property?.priceAmount || 15200000;
  const valuation = priceAmount;
  const areaValue = property?.areaValue || 900;
  const ratePerSqft = Math.round(priceAmount / areaValue) || 16846;
  const ownerName = property?.contactName?.trim() || "Yash Pal";
  const ownerPhone = property?.contactPhone?.trim() || "+91 98765 43210";

  const downPaymentAmount = Math.round((valuation * downPaymentPct) / 100);
  const loanAmount = Math.max(0, valuation - downPaymentAmount);
  const monthlyRate = (interestRate / 12) / 100;
  const totalMonths = tenureYears * 12;
  const monthlyEmi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
  const totalRepayment = Math.round(monthlyEmi * totalMonths);
  const totalInterest = Math.max(0, totalRepayment - loanAmount);
  const principalPct = totalRepayment > 0 ? Math.round((loanAmount / totalRepayment) * 100) : 48;
  const interestPct = Math.max(0, 100 - principalPct);

  if (loading) {
    return (
      <div
        className="property-detail-scope bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between"
        data-build-sha={process.env.NEXT_PUBLIC_BUILD_SHA || "unknown"}
      >
        <div className="desktop-only hidden lg:block">
          <SiteHeader active="browse" />
        </div>
        <header className="mobile-only lg:hidden h-14 px-4 flex items-center border-b border-surface-container bg-surface/90 backdrop-blur-xl">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
          </button>
          <span className="font-headline-sm font-bold ml-2">Property Details</span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-on-surface">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <h1 className="font-headline-sm text-headline-sm font-bold">
            Loading Property Listing
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Fetching authentic owner dossier and blueprints…
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error && !property) {
    return (
      <div
        className="property-detail-scope bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between"
        data-build-sha={process.env.NEXT_PUBLIC_BUILD_SHA || "unknown"}
      >
        <div className="desktop-only hidden lg:block">
          <SiteHeader active="browse" />
        </div>
        <header className="mobile-only lg:hidden h-14 px-4 flex items-center border-b border-surface-container bg-surface/90 backdrop-blur-xl">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
          </button>
          <span className="font-headline-sm font-bold ml-2">Property Details</span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">home_work</span>
          </div>
          <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest">
            APNA GHAR · PROPERTY DETAILS
          </span>
          <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold mt-1 mb-2">
            We couldn’t load this listing
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
            {error || "This property is no longer published or the link is incorrect."}
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
        <SiteFooter />
      </div>
    );
  }

  return (
    <div
      className="property-detail-scope bg-surface font-body-md text-on-surface antialiased"
      data-build-sha={process.env.NEXT_PUBLIC_BUILD_SHA || "unknown"}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pd-toast">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 360° Walkthrough Modal */}
      {is360Active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          onClick={() => setIs360Active(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[36px]">360</span>
            </div>
            <h3 className="font-headline-md text-2xl font-bold mb-2">360° Architectural Virtual Tour</h3>
            <p className="text-on-surface-variant max-w-md mb-6">
              Interactive 3D walkthrough is loaded for Model Town 4 BHK Luxury Builder Floor. Inspect rooms, balconies, and fixtures in full virtual reality.
            </p>
            <div className="w-full h-64 rounded-xl overflow-hidden mb-6 relative">
              <img
                src={LUXURY_PHOTO_FALLBACKS[0]}
                alt="360 Tour Preview"
                className="w-full h-full object-cover filter brightness-95"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="px-4 py-2 rounded-full bg-white/90 font-bold text-slate-900 text-sm shadow-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">view_in_ar</span>
                  Drag to rotate 360°
                </span>
              </div>
            </div>
            <button
              onClick={() => setIs360Active(false)}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-container transition-all"
            >
              Close Walkthrough
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          DESKTOP 1440px VIEWPORT
          ========================================================================= */}
      <div className="desktop-only hidden lg:block">
        {/* Desktop Navbar */}
        <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-20 max-w-[1240px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md shrink-0">
              <a className="flex items-center gap-3" href="/">
                <img
                  alt="Apna Ghar real estate platform emblem logo."
                  className="h-8 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1WnQ9qrpgpq_29SYoHJQlGnU3LRTueFcHAMtTz325oVlsm_JAMhiCncBWmGI70paS1spuQIgv3J5wbewsRnIWnYPaVF02sV2R6ffOHLPN8caZK0w4hpa7-BcmHOSyUxRVZ1riw18NF9ao1RVKHtH5sSPoSf07ykn5gqif111vdvoyZd17KEioWoZHqiU9qMHJTElE242eQt7R5ygulrXPUapF7lWTSHM8C1K7t6fcRt"
                />
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                  Apna Ghar
                </span>
              </a>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                0% BROKERAGE
              </span>
            </div>
            <div className="hidden xl:flex items-center flex-1 max-w-xs mx-space-sm">
              <div className="w-full flex items-center bg-surface-container-low px-3 py-2 rounded-xl text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] mr-2 text-outline">search</span>
                <span className="flex-1 font-body-sm text-body-sm text-outline">Search city, locality...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-surface-container-lowest rounded shadow-sm text-outline">⌘K</kbd>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              <a className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" href="/search">
                Browse properties
              </a>
              <a className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" href="/search?type=sale">
                Buy
              </a>
              <a className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" href="/search?type=rent">
                Rent
              </a>
              <a className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors flex items-center gap-1.5" href="/messages">
                <span>Messages</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">3</span>
              </a>
              <a className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" href="/saved">
                Saved
              </a>
              <a className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" href="/appearance">
                Appearance
              </a>
            </nav>
            <div className="flex items-center gap-space-sm shrink-0">
              <a
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_8px_20px_-2px_rgba(0,91,234,0.35)] hover:bg-primary transition-all active:scale-[0.98] font-bold"
                href="/list-property"
              >
                Post Property ↗
              </a>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm">
                  YP
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Main Content */}
        {/*  Container  */}
<div className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
{/*  Top Breadcrumb & Actions Bar  */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
<nav className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
<a className="hover:text-primary transition-colors" href="#">Home</a>
<span className="text-outline-variant">/</span>
<a className="hover:text-primary transition-colors" href="#">Buy</a>
<span className="text-outline-variant">/</span>
<a className="hover:text-primary transition-colors" href="#">Amritsar</a>
<span className="text-outline-variant">/</span>
<span className="text-on-surface font-semibold">Model Town</span>
</nav>
<div className="flex items-center gap-2">
<button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-md text-label-md" id="btn-share" onClick={handleShare}>
<span className="material-symbols-outlined text-[18px]">share</span>
<span>Share</span>
</button>
<button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-md text-label-md" id="btn-save" onClick={toggleShortlist}>
<span className="material-symbols-outlined text-[18px] text-error" style={{ "fontVariationSettings": "'FILL' 0" }}>favorite</span>
<span id="save-text">Save</span>
</button>
</div>
</div>
{/*  Property Header Info Lockup  */}
<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
<div className="space-y-1.5">
<div className="flex flex-wrap items-center gap-2.5">
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm tracking-wide">
<span className="material-symbols-outlined text-[13px]" style={{ "fontVariationSettings": "'FILL' 1" }}>verified</span>
            DIRECT OWNER LISTING
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[13px]">bolt</span>
            READY TO MOVE
          </span>
<span className="text-on-surface-variant font-body-sm text-body-sm">Listing ID: #AG-774921</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
          4 BHK Luxury Builder Floor in Model Town, Amritsar
        </h1>
<p className="flex items-center gap-1.5 text-on-surface-variant font-body-md text-body-md">
<span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
<span>A-Block, Prime Boulevard, Model Town, Amritsar, Punjab 143002</span>
<span className="text-outline-variant">•</span>
<a className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5" href="#location-section">
            View on Map <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
</a>
</p>
</div>
</div>
{/*  Modern Auto-changing Image Carousel Section  */}
<section aria-label="Property Image Gallery" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className="relative w-full rounded-2xl overflow-hidden shadow-sm mb-8 bg-surface-container-low group/carousel" id="property-carousel">
<div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] overflow-hidden select-none">
{/*  Carousel Slides Track  */}
<div className="relative w-full h-full" id="carousel-track">
{/*  Slide 1  */}
<div className={`carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${activeSlide === 0 ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"}`} data-index="0">
<img alt="Grand Living Room and Sunlit Architectural Foyer" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpkGLtIRJ2P8LD2oJSg2HaAVvKmydajf4yPxObnwg8nRx5p8YLQd1MNyjza8OK8QV48AL-7Phfpx2LD490SkPRKOBtXJZbcS_WZW4psayWVBMASbWM_so_QIVkezoKiZBsTmO2bXxMGh3audoBqWrsjEOPrWfGhjKmUkMo7UqUUNmdOuauC_tMGUpIyWIdV5tCeE9Cv1ozJnQB85jsGimLR4rmssm00lwhF7baDRhkWK8sxs1TyaZk"/>
<div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20"></div>
<div className="absolute bottom-6 left-6 text-white pointer-events-none">
<span className="px-3 py-1 rounded-md bg-black/50 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">Grand Living &amp; Dining Hall</span>
</div>
</div>
{/*  Slide 2  */}
<div className={`carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${activeSlide === 1 ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"}`} data-index="1">
<img alt="Modern Minimalist Architectural Living Space" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbdd66wMfWFEeUfHJcR4FBh6QPH3zCvqfVRhU2gQW5Ky-SGR2FEbWj2A2DSND-jduaD8vC3DvRcEVaTDYp_5Sg_FL7rfI2-N-vLdujiw2Mos_7sLFoXTqqBspaea3jsVriH_P37_n01rhbpaI3D72xZKnEmPUyIpqqH444Os_a7sVGvM7SlVnKdnvXN8tCLJvifYAnWihgkVaoUu0dxb8Uf0997uM2xG39S4-GuKsHrJW7mL65fgEc"/>
<div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20"></div>
<div className="absolute bottom-6 left-6 text-white pointer-events-none">
<span className="px-3 py-1 rounded-md bg-black/50 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">Modern Master Suite</span>
</div>
</div>
{/*  Slide 3  */}
<div className={`carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${activeSlide === 2 ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"}`} data-index="2">
<img alt="Premium Modular Kitchen and Dining" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9peq6BrORC1uT_3wttO9ujS6NlCSG7-0qvH7h1iqcOXDBK9yEvGbBbC3argtGcHUHcKlSKFL1EHgHhIRlN1NyUCIyp3fN3nGnTLD1JfQQ5YWdupBa6WKfR89jgvkv7SZXy0UGOz4Pl0ih2LpP6kE0NPbbEj0YMthMzB4LHerFUlIf856nWu_w_oot_pfdke_jjJGzuEkNNiBsKecuPvWvc9C3MJ1wSAcuSMxJs0-eh8mV-m-T9VQT"/>
<div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20"></div>
<div className="absolute bottom-6 left-6 text-white pointer-events-none">
<span className="px-3 py-1 rounded-md bg-black/50 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">Modular Italian Kitchen</span>
</div>
</div>
{/*  Slide 4  */}
<div className={`carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${activeSlide === 3 ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"}`} data-index="3">
<img alt="Private Balcony and Serene Green Panorama" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIO8XrouLCZUOAaU83rRoK0fKY-si16l2A4aa3kEZASqcpjNJ7T3nUYYf9BM7CpG91sPgXzRLQ6L2qcCziXLmZgJBgAkPX99m_Cp7jREef4_AmgJ97o5aJrcagE-D-y5DzbpzKsa9Z26Rg5V_4X7ECX4bV5mPlU2471uQ4NnnvLZ5hm3pIFLJukEa0GRJDSjP8tG3-U8H479NXzounf-PchfeRGncQYeFij1XadkYzMc023XIKf_JR"/>
<div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20"></div>
<div className="absolute bottom-6 left-6 text-white pointer-events-none">
<span className="px-3 py-1 rounded-md bg-black/50 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">Private Teak Terrace Deck</span>
</div>
</div>
{/*  Slide 5  */}
<div className={`carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${activeSlide === 4 ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"}`} data-index="4">
<img alt="Exterior Elevation and Landscaped Garden Driveway" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfpaBBv822P3QxdgFKZI1H0LG952yjOY7ODE7WipKXYa4zpIccZVx0VvZd-DbMTKquk3ZPWKECCFZZamTPw3tlaGXuh7oyc_1FJC8cCPOgE2fBvM2ZBOjpRMuaXrIWx_TF9_JaJPTzPdQPYDVphrPTM2N96sDqSqguUkV20Z5plbuH6ebykSU1iGbID_jdCn2DWDtAzwv_kYXLjetTGNYSHJaNyWbIAZdBAauRdyp_QtXJfOBhhR1L"/>
<div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20"></div>
<div className="absolute bottom-6 left-6 text-white pointer-events-none">
<span className="px-3 py-1 rounded-md bg-black/50 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">Exterior Front Boulevard</span>
</div>
</div>
</div>
{/*  Top Floating Badges Over Carousel  */}
<div className="absolute top-5 left-5 flex items-center gap-2.5 z-20">
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold shadow-md">
<span className="material-symbols-outlined text-[15px] text-emerald-400" style={{ "fontVariationSettings": "'FILL' 1" }}>verified</span>
        Verified Owner Listing
      </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-xs font-semibold shadow-md" id="carousel-counter">
<span className="material-symbols-outlined text-[14px] text-slate-500">photo_camera</span>
<span id="slide-number">{activeSlide + 1}</span> / 5 Photos
      </span>
</div>
{/*  Top Right 360 Walkthrough Button  */}
<div className="absolute top-5 right-5 z-20">
<button onClick={() => { setIs360Active(true); showToast("Launching 360° Architectural Walkthrough..."); }} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold shadow-md hover:bg-white transition-all hover:scale-105 active:scale-95">
<span className="material-symbols-outlined text-[17px] text-primary">360</span>
<span>360° Walkthrough</span>
</button>
</div>
{/*  Next & Previous Arrows  */}
<button aria-label="Previous Slide" className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg transition-all opacity-80 hover:opacity-100 active:scale-90 z-20" id="carousel-prev" onClick={prevSlide}>
<span className="material-symbols-outlined text-[24px]">chevron_left</span>
</button>
<button aria-label="Next Slide" className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg transition-all opacity-80 hover:opacity-100 active:scale-90 z-20" id="carousel-next" onClick={nextSlide}>
<span className="material-symbols-outlined text-[24px]">chevron_right</span>
</button>
{/*  Carousel Thumbnail Dots / Indicators  */}
<div className="absolute bottom-5 right-6 flex items-center gap-2 z-20" id="carousel-indicators">
{[0, 1, 2, 3, 4].map((idx) => (
  <button
    key={idx}
    aria-label={`Slide ${idx + 1}`}
    onClick={() => setActiveSlide(idx)}
    className={`carousel-dot h-2 rounded-full transition-all duration-300 ${activeSlide === idx ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
    data-slide={idx}
  />
))}</div>
</div>
</section>
{/*  Core Highlights Metric Bar  */}
<div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm mb-10">
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">bed</span>
</div>
<div>
<div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Bedrooms</div>
<div className="font-headline-sm text-headline-sm text-on-surface font-bold">4 BHK + 3 Bath</div>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">square_foot</span>
</div>
<div>
<div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Super Area</div>
<div className="font-headline-sm text-headline-sm text-on-surface font-bold">900 sq.ft</div>
<div className="font-body-sm text-body-sm text-outline">Carpet: 720 sq.ft</div>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">apartment</span>
</div>
<div>
<div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Floor Level</div>
<div className="font-headline-sm text-headline-sm text-on-surface font-bold">14th of 28</div>
<div className="font-body-sm text-body-sm text-outline">3 Lifts per Tower</div>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">explore</span>
</div>
<div>
<div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Facing</div>
<div className="font-headline-sm text-headline-sm text-on-surface font-bold">East Facing</div>
<div className="font-body-sm text-body-sm text-secondary font-semibold">100% Vaastu</div>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">directions_car</span>
</div>
<div>
<div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Car Parking</div>
<div className="font-headline-sm text-headline-sm text-on-surface font-bold">2 Covered</div>
<div className="font-body-sm text-body-sm text-outline">Basement Level 1</div>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined text-[20px]">verified_user</span>
</div>
<div>
<div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Ownership</div>
<div className="font-headline-sm text-headline-sm text-secondary font-bold">Freehold Title</div>
<div className="font-body-sm text-body-sm text-outline">A-Khata Clear</div>
</div>
</div>
</div>
</div>
{/*  Main Content Split: Left (8 Cols), Right Sticky (4 Cols)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
{/*  LEFT COLUMN: Main Details & Specs  */}
<div className="lg:col-span-7 xl:col-span-8 space-y-10">
{/*  Direct Owner Verification Profile Bar  */}
<div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
<div className="flex items-center gap-4">
<div className="relative">
<div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-headline-md text-headline-md font-bold">
                YP
              </div>
<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-[13px]">check</span>
</div>
</div>
<div>
<div className="flex items-center gap-2">
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Yash Pal (Owner)</h3>
<span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">DigiLocker KYC Verified</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Property owner since 2019 • Typically responds within <span className="text-on-surface font-semibold">15 minutes</span>
</p>
</div>
</div>
<div className="flex items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
<div className="text-right hidden sm:block">
<div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Response Rate</div>
<div className="font-headline-sm text-headline-sm font-bold text-secondary">100%</div>
</div>
<span className="inline-flex px-3 py-1.5 rounded-xl bg-surface-container-low text-primary font-label-md text-label-md">
              0% Commission Direct Deal
            </span>
</div>
</div>
{/*  Property Description Section  */}
<div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm">
<div className="flex items-center justify-between mb-4">
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">Property Overview</h2>
<span className="text-outline font-label-sm text-label-sm uppercase tracking-wider">Refurbished 2024</span>
</div>
<div className="prose max-w-none text-on-surface-variant font-body-lg text-body-lg leading-relaxed">
<p id="desc-snippet">
              Immaculately constructed 4 Bedroom luxury builder floor nestled in the high-demand residential heart of Model Town, Amritsar. Boasting floor-to-ceiling Italian marble finishes, oversized triple-glazed soundproof acoustic windows, and an expansive 3-side open architectural layout guaranteeing maximum morning sunlight and unobstructed park panoramas.
            </p>
<div className="hidden mt-3 space-y-3" id="desc-extra">
<p>
                Each bedroom features dedicated imported Spanish walk-in closets, attached designer en-suite bathrooms equipped with Grohe concealed fittings, and private teakwood study alcoves. The high-spec modular kitchen contains Blum soft-touch push drawers, granite quartz countertops, and dedicated piped gas provision.
              </p>
<p>
                Benefiting from zero-brokerage direct engagement, this home represents an exceptional private family residence or high-yield rental investment within walking distance of prime retail high streets and tier-one educational institutions.
              </p>
</div>
<button className="mt-4 text-primary font-label-lg text-label-lg font-bold inline-flex items-center gap-1 hover:underline cursor-pointer" id="desc-toggle-btn">
<span>Read complete description</span>
<span className="material-symbols-outlined text-[16px]">expand_more</span>
</button>
</div>
{/*  Quick Fact Matrix  */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 bg-surface-container-low/40 rounded-xl p-4">
<div>
<div className="font-label-sm text-label-sm text-outline uppercase">Balconies</div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">3 Wide Balconies</div>
</div>
<div>
<div className="font-label-sm text-label-sm text-outline uppercase">Flooring</div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">Italian Botticino</div>
</div>
<div>
<div className="font-label-sm text-label-sm text-outline uppercase">Furnishing</div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">Semi-Furnished</div>
</div>
<div>
<div className="font-label-sm text-label-sm text-outline uppercase">Water Source</div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">24x7 Municipal &amp; RO</div>
</div>
</div>
</div>
{/*  Government Title & Legal Clearances  */}
<div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm">
<div className="flex items-center justify-between mb-4">
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">Legal &amp; Title Verification</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Validated through Punjab Land Records Portal &amp; Institutional Legal Audit</p>
</div>
<span className="material-symbols-outlined text-secondary text-[28px]">verified</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
<div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
<div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[18px]">gavel</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">A-Khata Freehold Property</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Absolute single ownership title with zero municipal tax arrears through 2025.</p>
</div>
</div>
<div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
<div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[18px]">rule_folder</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">15-Year Clean EC Record</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Encumbrance Certificate searches verify Nil registered mortgages or active litigation.</p>
</div>
</div>
<div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
<div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">Occupancy Certificate (OC)</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Full OC issued by Amritsar Municipal Corporation with fire and safety clearance.</p>
</div>
</div>
<div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
<div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[18px]">account_balance</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface font-bold">Pre-Approved Bank Loans</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">SBI, HDFC Bank, and ICICI have vetted title papers for expedited 72-hr loan sanctions.</p>
</div>
</div>
</div>
</div>
{/*  Premium Amenities Grid  */}
<div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm">
<div className="flex items-center justify-between mb-6">
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">Amenities &amp; Features</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Carefully designed for effortless luxury and maximum convenience</p>
</div>
<span className="px-2.5 py-1 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm">24 Total Amenities</span>
</div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">fitness_center</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">50,000 sq.ft Clubhouse</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">Fully Equipped Gym</span>
</div>
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">pool</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">Olympic Swimming Pool</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">Heated All-Season</span>
</div>
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">sports_tennis</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">4 Tennis Courts</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">Synthetic Turf Surfaces</span>
</div>
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">electric_meter</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">100% DG Power Backup</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">Dual Line Automation</span>
</div>
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">ev_station</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">Dedicated EV Bays</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">Fast 22kW Chargers</span>
</div>
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">propane</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">Piped PNG Gas</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">Metred City Gas Grid</span>
</div>
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">security</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">3-Tier RFID Access</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">24x7 CCTV &amp; Guard</span>
</div>
<div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
<span className="material-symbols-outlined text-[24px]">nature_people</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">Landscaped Parks</span>
<span className="font-body-sm text-body-sm text-outline mt-0.5">Zen Walking Trails</span>
</div>
</div>
</div>
{/*  Location & Neighborhood Hub  */}
<div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm" id="location-section">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">Location &amp; Commute Highlights</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Model Town, Amritsar • Coveted residential pin with effortless arterial connectivity</p>
</div>
<a className="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold hover:underline" href="#">
              Get Directions <span className="material-symbols-outlined text-[16px]">navigation</span>
</a>
</div>
{/*  Interactive Static Map View Placeholder with location  */}
<div className="w-full h-72 rounded-xl bg-cover bg-center relative overflow-hidden mb-6 shadow-inner" data-location="Model Town, Amritsar, Punjab" style={{ "backgroundImage": "url('https" }}>
<div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
<span className="font-label-sm text-label-sm font-bold text-on-surface">Model Town Prime Boulevard</span>
</div>
</div>
{/*  Transit & Landmark Distances  */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
<div className="p-3.5 rounded-xl bg-surface-container-low">
<div className="flex items-center gap-2 text-primary mb-1">
<span className="material-symbols-outlined text-[18px]">directions_subway</span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Metro / Rapid Transit</span>
</div>
<div className="font-headline-sm text-headline-sm font-bold text-on-surface">5 Mins</div>
<div className="font-body-sm text-body-sm text-outline">Model Town Station (1.2 km)</div>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low">
<div className="flex items-center gap-2 text-primary mb-1">
<span className="material-symbols-outlined text-[18px]">local_mall</span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Shopping Mall</span>
</div>
<div className="font-headline-sm text-headline-sm font-bold text-on-surface">2 Mins</div>
<div className="font-body-sm text-body-sm text-outline">Mall of Amritsar &amp; High St</div>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low">
<div className="flex items-center gap-2 text-primary mb-1">
<span className="material-symbols-outlined text-[18px]">local_hospital</span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Fortis Escorts</span>
</div>
<div className="font-headline-sm text-headline-sm font-bold text-on-surface">8 Mins</div>
<div className="font-body-sm text-body-sm text-outline">Multi-speciality Hospital</div>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low">
<div className="flex items-center gap-2 text-primary mb-1">
<span className="material-symbols-outlined text-[18px]">school</span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Heritage School</span>
</div>
<div className="font-headline-sm text-headline-sm font-bold text-on-surface">12 Mins</div>
<div className="font-body-sm text-body-sm text-outline">Top CBSE &amp; ICSE Campuses</div>
</div>
</div>
</div>
</div>
{/*  RIGHT COLUMN: Minimalist & Ultra-Premium Sticky Pricing Card  */}
<div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-5">
<div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100">
{/*  Single Line Price Header  */}
<div className="flex items-baseline justify-between gap-3 pb-3">
<span className="text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">₹1.52 Cr</span>
<span className="text-sm font-semibold text-slate-500 whitespace-nowrap">₹16,846 / sq.ft</span>
</div>
{/*  Subtle Zero Commission Badge  */}
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-5">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      Zero Brokerage • Save ₹3.03 Lakhs
    </div>
{/*  Simplified Key Financial Highlights  */}
<div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-100/90 mb-6 text-center">
<div className="px-1"><span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Monthly EMI</span>
<span className="text-sm font-bold text-slate-900">₹1.05 L<span className="text-[11px] font-normal text-slate-400">/mo</span></span>
<button className="mt-1 text-[11px] text-primary hover:text-primary-container font-semibold flex items-center justify-center gap-0.5 mx-auto hover:underline cursor-pointer transition-colors active:scale-95" id="open-emi-modal-btn" onClick={() => setIsEmiModalOpen(true)}>
<span>Calculate</span><span className="material-symbols-outlined text-[13px]">tune</span>
</button></div>
<div className="px-1 border-x border-slate-100">
<span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Maintenance</span>
<span className="text-sm font-bold text-slate-900">₹4,500<span className="text-[11px] font-normal text-slate-400">/mo</span></span>
</div>
<div className="px-1">
<span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Parking</span>
<span className="text-sm font-bold text-slate-900">2 Covered</span>
</div>
</div>
{/*  Primary Action CTAs  */}
<div className="space-y-3 mb-5">
<button className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-3px_rgba(0,69,183,0.35)] hover:bg-primary-container transition-all active:scale-[0.98]" id="btn-chat-owner" onClick={handleChatOwner}>
<span className="material-symbols-outlined text-[20px]">chat</span>
<span>Chat with Owner &amp; Make Offer</span>
</button>
<button className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-[0.98]" id="btn-call-owner" onClick={handlePhoneClick}>
<span className="material-symbols-outlined text-[19px] text-slate-600">call</span>
<span id="call-label">{phoneUnmasked ? ownerPhone : "Call Owner (Masked)"}</span>
</button>
</div>
{/*  Subtle Trust / Escrow Note  */}
<div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
<span className="material-symbols-outlined text-[17px] text-emerald-600">verified_user</span>
<span>₹50,000 Token Escrow Protection</span>
</div>
</div>
{/*  Safety & Verified Guarantee Card (Clean minimalist)  */}
<div className="p-5 rounded-2xl bg-surface-container-lowest border border-slate-100/80 shadow-sm space-y-2">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
<h4 className="font-headline-sm text-[15px] text-on-surface font-bold">100% Genuine Direct Listing</h4>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
      Ownership documents, municipal records, and seller identity verified before approval. No intermediary agents or hidden surcharges.
    </p>
</div>
{/*  Neighborhood Price Trend Mini Card  */}
<div className="p-5 rounded-2xl bg-surface-container-lowest border border-slate-100/80 shadow-sm">
<div className="flex items-center justify-between mb-2">
<span className="font-label-sm text-label-sm text-outline uppercase">Model Town Index</span>
<span className="text-secondary font-bold font-label-sm text-label-sm inline-flex items-center gap-0.5">
<span className="material-symbols-outlined text-[14px]">trending_up</span> +14.2% YoY
      </span>
</div>
<div className="flex items-baseline gap-2 mb-3">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹16,400 - ₹18,200</span>
<span className="font-body-sm text-body-sm text-outline">avg / sq.ft</span>
</div>
<svg className="w-full h-10 text-primary" fill="none" viewBox="0 0 200 40">
<path d="M0 35 L30 32 L70 28 L110 30 L150 18 L180 12 L200 5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
<path d="M0 35 L30 32 L70 28 L110 30 L150 18 L180 12 L200 5 L200 40 L0 40 Z" fill="currentColor" fillOpacity="0.08"></path>
</svg>
<div className="flex justify-between text-body-sm font-body-sm text-outline mt-1 text-[11px]">
<span>2022</span>
<span>2023</span>
<span>2024</span>
<span className="font-semibold text-primary">Current</span>
</div>
</div>
</div>
</div>
{/*  Similar Direct Owner Listings Section  */}
<section className="mt-16 pt-10 border-t border-outline-variant/30">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
<div>
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Zero Brokerage Homes</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-0.5">
            More Verified 3 &amp; 4 BHKs in Model Town, Amritsar
          </h2>
</div>
<a className="inline-flex items-center gap-1.5 text-primary font-label-lg text-label-lg font-bold hover:underline" href="#">
          Explore all 48 listings in Amritsar
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/*  Similar Card 1  */}
<div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
<div className="relative h-52 overflow-hidden">
<img alt="4 BHK Luxury Penthouse Model Town" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfpaBBv822P3QxdgFKZI1H0LG952yjOY7ODE7WipKXYa4zpIccZVx0VvZd-DbMTKquk3ZPWKECCFZZamTPw3tlaGXuh7oyc_1FJC8cCPOgE2fBvM2ZBOjpRMuaXrIWx_TF9_JaJPTzPdQPYDVphrPTM2N96sDqSqguUkV20Z5plbuH6ebykSU1iGbID_jdCn2DWDtAzwv_kYXLjetTGNYSHJaNyWbIAZdBAauRdyp_QtXJfOBhhR1L"/>
<span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold">
              0% Brokerage
            </span>
<span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-inverse-surface/80 text-on-primary font-label-sm text-label-sm">
              Ready to Move
            </span>
</div>
<div className="p-5 flex-1 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-1">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹1.35 Cr</span>
<span className="font-body-sm text-body-sm text-outline">₹15,000/sq.ft</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1">3 BHK Independent Floor</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Green Avenue, Model Town, Amritsar</p>
</div>
<div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-container text-body-sm font-body-sm text-on-surface-variant">
<span>3 Beds • 3 Baths • 1,200 sq.ft</span>
<span className="text-primary font-bold">View Unit</span>
</div>
</div>
</div>
{/*  Similar Card 2  */}
<div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
<div className="relative h-52 overflow-hidden">
<img alt="Designer 4 BHK Villa with private garden" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9peq6BrORC1uT_3wttO9ujS6NlCSG7-0qvH7h1iqcOXDBK9yEvGbBbC3argtGcHUHcKlSKFL1EHgHhIRlN1NyUCIyp3fN3nGnTLD1JfQQ5YWdupBa6WKfR89jgvkv7SZXy0UGOz4Pl0ih2LpP6kE0NPbbEj0YMthMzB4LHerFUlIf856nWu_w_oot_pfdke_jjJGzuEkNNiBsKecuPvWvc9C3MJ1wSAcuSMxJs0-eh8mV-m-T9VQT"/>
<span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
              Direct Owner
            </span>
<span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-inverse-surface/80 text-on-primary font-label-sm text-label-sm">
              Under 1 Yr Old
            </span>
</div>
<div className="p-5 flex-1 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-1">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹1.85 Cr</span>
<span className="font-body-sm text-body-sm text-outline">₹17,200/sq.ft</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1">4 BHK Corner Luxury Kothi</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Ranjit Avenue Extn, Amritsar</p>
</div>
<div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-container text-body-sm font-body-sm text-on-surface-variant">
<span>4 Beds • 4 Baths • 1,850 sq.ft</span>
<span className="text-primary font-bold">View Unit</span>
</div>
</div>
</div>
{/*  Similar Card 3  */}
<div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
<div className="relative h-52 overflow-hidden">
<img alt="Premium Sky Condo with terrace deck" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIO8XrouLCZUOAaU83rRoK0fKY-si16l2A4aa3kEZASqcpjNJ7T3nUYYf9BM7CpG91sPgXzRLQ6L2qcCziXLmZgJBgAkPX99m_Cp7jREef4_AmgJ97o5aJrcagE-D-y5DzbpzKsa9Z26Rg5V_4X7ECX4bV5mPlU2471uQ4NnnvLZ5hm3pIFLJukEa0GRJDSjP8tG3-U8H479NXzounf-PchfeRGncQYeFij1XadkYzMc023XIKf_JR"/>
<span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold">
              0% Brokerage
            </span>
<span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-inverse-surface/80 text-on-primary font-label-sm text-label-sm">
              Freehold A-Khata
            </span>
</div>
<div className="p-5 flex-1 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-1">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹1.48 Cr</span>
<span className="font-body-sm text-body-sm text-outline">₹16,100/sq.ft</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1">4 BHK High-Rise Sky Residence</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Albert Road, Model Town, Amritsar</p>
</div>
<div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-container text-body-sm font-body-sm text-on-surface-variant">
<span>4 Beds • 4 Baths • 1,450 sq.ft</span>
<span className="text-primary font-bold">View Unit</span>
</div>
</div>
</div>
</div>
</section>
</div>
{/*  Interactive Client Logic (Carousel, Call, Chat, Save, Share)  */}


        {/* Desktop Mortgage EMI Calculator Modal */}
        {isEmiModalOpen && (
<div aria-labelledby="emi-modal-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" id="emi-modal" role="dialog" onClick={(e) => { if (e.target === e.currentTarget) setIsEmiModalOpen(false); }}>
<div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-slate-100/90 overflow-hidden flex flex-col max-h-[92vh]">
{/*  Modal Header  */}
<div className="flex items-center justify-between px-6 py-4.5 border-b border-surface-container bg-surface-container-low/40 shrink-0">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-[22px]">calculate</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold" id="emi-modal-title">Quick Mortgage EMI Calculator</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
<span>Model Town 4 BHK</span>
<span className="text-outline-variant">•</span>
<span className="font-semibold text-primary">Property Value: ₹1.52 Cr</span>
<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px]">Verified Title</span>
</p>
</div>
</div>
<button aria-label="Close Calculator" className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-all hover:scale-105 active:scale-95" id="close-emi-modal-btn" onClick={() => setIsEmiModalOpen(false)}>
<span className="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
{/*  Modal Scrollable Body  */}
<div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Left Column: Interactive Input Controls (7 Cols)  */}
<div className="lg:col-span-7 space-y-6">
{/*  Property Price (Fixed baseline)  */}
<div className="p-4 rounded-xl bg-surface-container-low/50 border border-slate-100 flex items-center justify-between">
<div>
<span className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">Property Listing Value</span>
<span className="text-xl font-bold text-on-surface font-headline-sm">₹ 1,52,00,000</span>
</div>
<span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">verified</span> 0% Brokerage
          </span>
</div>
{/*  Down Payment Slider & Indicator  */}
<div className="space-y-2">
<div className="flex items-center justify-between text-body-sm">
<label className="font-semibold text-on-surface flex items-center gap-1.5" htmlFor="downpayment-slider">
<span>Down Payment</span>
<span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed" id="dp-pct-badge">20%</span>
</label>
<div className="text-right">
<span className="text-sm font-bold text-on-surface" id="dp-amount-display">₹30.40 Lakhs</span>
<span className="text-xs text-outline block">Loan: <span className="font-medium text-primary" id="loan-amount-display">₹1.216 Cr</span></span>
</div>
</div>
<input className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary" id="downpayment-slider" max="50" min="10" step="5" type="range" value="20"/>
<div className="flex justify-between text-[11px] text-outline">
<span>10% (Min ₹15.2 L)</span>
<span>30%</span>
<span>50% (₹76.0 L)</span>
</div>
</div>
{/*  Interest Rate Slider & Presets  */}
<div className="space-y-2.5">
<div className="flex items-center justify-between text-body-sm">
<label className="font-semibold text-on-surface" htmlFor="interest-slider">Interest Rate (% p.a.)</label>
<span className="text-sm font-bold text-primary bg-primary-fixed/60 px-2.5 py-0.5 rounded-lg">
<span id="interest-rate-display">8.50</span>% p.a.
            </span>
</div>
<input className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary" id="interest-slider" max="12.0" min="7.5" step="0.05" type="range" value="8.50"/>
{/*  Preset Bank Rates Pills  */}
<div className="flex flex-wrap items-center gap-2 pt-1">
<span className="text-xs text-outline">Presets:</span>
<button className="bank-rate-preset px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold hover:border-primary text-slate-700 hover:text-primary transition-all" data-rate="8.25" type="button">
              SBI (8.25%)
            </button>
<button className="bank-rate-preset px-2.5 py-1 rounded-lg border border-primary bg-primary-fixed text-xs font-bold text-on-primary-fixed transition-all" data-rate="8.50" type="button">
              HDFC (8.50%)
            </button>
<button className="bank-rate-preset px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold hover:border-primary text-slate-700 hover:text-primary transition-all" data-rate="8.75" type="button">
              ICICI (8.75%)
            </button>
</div>
</div>
{/*  Loan Tenure (Years)  */}
<div className="space-y-2.5">
<div className="flex items-center justify-between text-body-sm">
<label className="font-semibold text-on-surface" htmlFor="tenure-slider">Loan Tenure</label>
<span className="text-sm font-bold text-on-surface">
<span id="tenure-years-display">20</span> Years (<span id="tenure-months-display">240</span> Months)
            </span>
</div>
<input className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary" id="tenure-slider" max="30" min="5" step="1" type="range" value="20"/>
{/*  Quick Tenure Pills  */}
<div className="grid grid-cols-5 gap-2 pt-1">
<button className="tenure-preset py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary text-center transition-all" data-tenure="10" type="button">10 Yrs</button>
<button className="tenure-preset py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary text-center transition-all" data-tenure="15" type="button">15 Yrs</button>
<button className="tenure-preset py-1.5 rounded-lg border-2 border-primary bg-primary-fixed text-xs font-bold text-on-primary-fixed text-center transition-all" data-tenure="20" type="button">20 Yrs</button>
<button className="tenure-preset py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary text-center transition-all" data-tenure="25" type="button">25 Yrs</button>
<button className="tenure-preset py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary text-center transition-all" data-tenure="30" type="button">30 Yrs</button>
</div>
</div>
</div>
{/*  Right Column: EMI Calculation Result, Visual Breakdown & Bank Offers (5 Cols)  */}
<div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
{/*  EMI Result Hero Card  */}
<div className="p-5 rounded-2xl bg-gradient-to-t from-primary/10 to-surface-container-low border border-primary/20 text-center shadow-sm">
<span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Estimated Monthly Repayment</span>
<div className="flex items-baseline justify-center gap-1.5">
<span className="text-3xl font-extrabold text-primary font-headline-lg" id="calculated-emi-text">₹1,05,520</span>
<span className="text-sm text-outline font-medium">/ month</span>
</div>
<div className="mt-2 text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full">
<span className="material-symbols-outlined text-[13px]">check_circle</span> Instant Online Sanction Eligible
          </div>
</div>
{/*  Visual Loan Breakdown Bar & Legend  */}
<div className="p-4 rounded-xl bg-surface-container-low/60 border border-slate-100 space-y-3">
<div className="flex items-center justify-between text-xs font-semibold text-on-surface">
<span>Total Repayment:</span>
<span className="text-sm font-bold text-on-surface" id="total-payment-display">₹2.53 Cr</span>
</div>
{/*  Ratio Bar  */}
<div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden shadow-inner">
<div className="bg-primary h-full transition-all duration-300" id="principal-ratio-bar" style={{ "width": "48%" }} title="Principal"></div>
<div className="bg-secondary-fixed-dim h-full transition-all duration-300" id="interest-ratio-bar" style={{ "width": "52%" }} title="Interest"></div>
</div>
{/*  Breakdown Legend  */}
<div className="grid grid-cols-2 gap-2 text-xs pt-1">
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
<div>
<span className="text-outline block text-[10px] uppercase">Principal</span>
<span className="font-bold text-on-surface" id="principal-legend-text">₹1.22 Cr (48%)</span>
</div>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim shrink-0"></span>
<div>
<span className="text-outline block text-[10px] uppercase">Total Interest</span>
<span className="font-bold text-secondary" id="interest-legend-text">₹1.31 Cr (52%)</span>
</div>
</div>
</div>
</div>
{/*  Verified Partner Bank Offers  */}
<div className="space-y-2">
<span className="text-xs font-bold text-outline uppercase tracking-wider block">Partner Bank Loan Offers</span>
<div className="space-y-1.5">
<div className="p-2.5 rounded-xl border border-slate-100 bg-surface-container-lowest hover:border-primary/40 flex items-center justify-between transition-colors shadow-sm">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-xs text-primary">SBI</div>
<div>
<span className="text-xs font-bold text-on-surface block">SBI Regular Home Loan</span>
<span className="text-[10px] text-emerald-600 font-semibold">Zero Processing Fees</span>
</div>
</div>
<div className="text-right">
<span className="text-xs font-bold text-on-surface block">8.40%</span>
<span className="text-[10px] text-outline">Pre-Approved</span>
</div>
</div>
<div className="p-2.5 rounded-xl border border-primary/30 bg-primary-fixed/20 flex items-center justify-between transition-colors shadow-sm">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">HDFC</div>
<div>
<span className="text-xs font-bold text-on-surface block">HDFC Reach Home Loan</span>
<span className="text-[10px] text-primary font-semibold">Fast 48-hr Disbursal</span>
</div>
</div>
<div className="text-right">
<span className="text-xs font-bold text-primary block">8.50%</span>
<span className="text-[10px] text-emerald-700 font-semibold">Instant KYC</span>
</div>
</div>
</div>
</div>
</div>
</div>
{/*  Modal Footer Actions  */}
<div className="px-6 py-4 bg-surface-container-low/50 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
<div className="flex items-center gap-2 text-xs text-outline">
<span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
<span>Encumbrance checked • No hidden charges • 100% Free Service</span>
</div>
<div className="flex items-center gap-3 w-full sm:w-auto">
<button className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors" id="btn-close-bottom" type="button">
          Dismiss
        </button>
<button className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95" id="btn-apply-loan" type="button">
<span>Apply for Pre-Approved Loan</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</button>
</div>
</div>
</div>
</div>

        )}
      </div>

      {/* =========================================================================
          MOBILE 390px VIEWPORT
          ========================================================================= */}
      <div className="mobile-only lg:hidden">
        {/* Mobile Top App Bar */}
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-16 px-gutter-mobile flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <button
                aria-label="Go back"
                onClick={() => router.back()}
                className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">chevron_left</span>
              </button>
              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[200px] font-bold">
                {property?.title && property.title !== "plot for sale" ? property.title : "4 BHK Luxury Builder Floor"}
              </h1>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                aria-label="Share property"
                onClick={handleShare}
                className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
              <button
                aria-label="Save to favorites"
                onClick={toggleShortlist}
                className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span
                  className="material-symbols-outlined text-[20px] text-error"
                  style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>
              <button
                aria-label="More options"
                onClick={() => showToast("Direct Owner Verified Listing")}
                className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1 text-on-primary font-bold text-xs">
                YP
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Main Stack */}
        {/*  Edge-to-Edge Media Gallery Carousel  */}
<section className="relative w-full overflow-hidden bg-surface-container-low">
<div className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar" id="mediaScroller" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
{/*  Slide 1: Primary Living Area  */}
<div className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container">
<img alt="Spacious sunlit living room of 4 BHK luxury floor in Model Town Amritsar" className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-wDI6ohYYw58A2_ame5gg8-uMZkVRiB1q5lvnleRdSrlSnuROL7hvtNUJ7H1m-WQP534BkQNGNVCqdSONDy8YOfviHf-aeJoYDH7g9WV0L18R1orDYz0q6vpK_PXLLsd__iIywtOhoYPNvDeIOc145MLRMHbuPr0qtj_q6MeMtUqNeIc52vb0LaIZUL-xR87UidnE-7zryEdhvaiiHQhrzaTPTw7Vxv4rOCxEDIxINV96kQ69wtG7"/>
<div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent"></div>
</div>
{/*  Slide 2: Master Suite  */}
<div className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container">
<img alt="Elegantly designed master bedroom with private balcony view" className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3jDAsEE8kPdufESU_rr2FcyVrts9wsKvVpljrRlaRRyLa2FqKHTWmmScbsN2hpNMSQrDtuK8p9tav2-FuPPzOMNnFEOeHihsRNvb5-BEtB9m-S4LXoCm44fjrB7HIJnuWmw6syW1KGS6BO227PXv-fR2SPN1zUXLFKrQDVfZVykyfc2x9uVMUwzqS2-wFaW5GrPvefBEdd8A_tqsDhTjOAMCmeMC98W_1wjmfSh9aqLRRcKHirt_w"/>
<div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent"></div>
</div>
{/*  Slide 3: Modular Kitchen  */}
<div className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container">
<img alt="Modern designer island kitchen with quartz countertops" className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe8Wn1vBT4LGtWrFw1RW_yl10zM_KfPJYbR3JhiIY0kyM2XABd0PMXM9meUVqVKVgYzfdm4qV8uJOV6gOkrY5aUQ8iF4ddwaJkWBClP9HeC7AkFg3TyoD-eU5AnUX3vPiIxdge4Uf5eyxPGtsIYq9I9ZE0_vsC3uw6js61Oshfn8Nka7Q1ESrK5_Xw1g1BjYxH_SwvNe_DUqMaLICGu6wZsO3QlvR1GTtdt6ZgE-NQjMikMwRoYm1u"/>
<div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent"></div>
</div>
{/*  Slide 4: Balcony Panoramic View  */}
<div className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container">
<img alt="Expansive private balcony garden offering unobstructed city skyline views" className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRY3xKoDqyMvH_hgQY28DQlYvN2Oep0h24dgqrTPmWLuZjguIwPue_WSRacihHodzjR3gK-a4qi1X4X_gz2X5anAD6o82xNh876Bi0-Mfdeywftn3A-RaTKnrHBoLoTrmf8lmNDlfPjV4xjwc6dhoHmeTIzo2MCi04fKzSVTgp26iJTYkL_EoPpoD3Ke8FSRjj1N3ilRhb71tYPf7VPC2Zkd0xq2eM9aPGN_TndA702Q_0RGgtKmrL"/>
<div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent"></div>
</div>
{/*  Slide 5: Luxury Bath  */}
<div className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container">
<img alt="Spa-like bathroom with glass shower enclosure and premium fixtures" className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXg99p_4mB8aAMd4wNZ0wldYivc-8u2rw6CVW_AR0l4uOG5cxLAg4NBq7uC3NThQQh1CdIQGPQPvoXi_GVgjM-XqmZYto2s8BFwZVfr4N6idr3eLN63Ri89E1mN_Z4JPHBl-U-s8gqfuLKvy6O4fZ9Z6AGfAOiafUFxy4ZSwoVHsvWf9CLwG0gCkcNX59Z-I8WytlksYVauk_l56Xv0V_Ncp79SCiFvZzDT9IKyLbWS_t1iMzuWu-r"/>
<div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent"></div>
</div>
{/*  Slide 6: Building Exterior & Clubhouse  */}
<div className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container">
<img alt="Contemporary architecture building facade with landscaped approach" className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQmHmZRxLOi3boDdYy8VgyoZZFuv-tbliNCa2NwBiaYWWH1CecNUTOkxOwZa8RHUnL9Xk-sC4Df5v56_5R5okJzKcx1ovkFqAszunIgleRNXgsAD4cu6zuEyUdAP_Ea94hDh3EDCofr3_Fb39WUIrBNm_KZg5mEdq9zRCGGs2t17JOdS3CdETBC2nXGb4NwXh9TcdebMZBHfeifH8e6UbqbKhWO-CkJnZNnCKqfO5NUA9AiIu4CLpK"/>
<div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent"></div>
</div>
</div>
{/*  Floating Top Badges  */}
<div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-on-secondary shadow-md font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[15px]" style={{ "fontVariationSettings": "'FILL' 1" }}>verified</span>
<span>VERIFIED DIRECT OWNER</span>
</span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-on-surface/70 backdrop-blur-md text-surface font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px]">photo_camera</span>
<span id="photoCounter">{activeMobileSlide + 1} / 6</span>
</span>
</div>
{/*  Floating Bottom Visual Controls  */}
<div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
<div className="flex items-center gap-1 px-2 py-1 rounded-full bg-on-surface/40 backdrop-blur-md" id="carouselIndicators">
<div className="w-4 h-1.5 rounded-full bg-surface transition-all duration-300"></div>
<div className="w-1.5 h-1.5 rounded-full bg-surface/50 transition-all duration-300"></div>
<div className="w-1.5 h-1.5 rounded-full bg-surface/50 transition-all duration-300"></div>
<div className="w-1.5 h-1.5 rounded-full bg-surface/50 transition-all duration-300"></div>
<div className="w-1.5 h-1.5 rounded-full bg-surface/50 transition-all duration-300"></div>
<div className="w-1.5 h-1.5 rounded-full bg-surface/50 transition-all duration-300"></div>
</div>
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-md text-label-md shadow-md active:scale-95 transition-transform" type="button">
<span className="material-symbols-outlined text-[16px]">view_in_ar</span>
<span>360° Virtual Tour</span>
</button>
</div>
</section>
{/*  Core Content Stack  */}
<div className="px-gutter-mobile flex flex-col gap-space-lg pt-space-md">
{/*  Title & Valuation Card  */}
<section className="flex flex-col gap-space-sm">
{/*  Brokerage Savings Callout  */}
<div className="inline-flex items-center self-start gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px]">savings</span>
<span>ZERO BROKERAGE • SAVE ₹3.03 LAKHS</span>
</div>
{/*  Headline & Neighborhood  */}
<div className="flex flex-col">
<h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
          4 BHK Luxury Floor in Model Town
        </h1>
<div className="flex items-center gap-1 mt-1 text-on-surface-variant">
<span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
<span className="font-body-sm text-body-sm underline underline-offset-2">Model Town, Phase II, Amritsar, Punjab</span>
<span className="text-outline-variant">•</span>
<span className="font-label-md text-label-md text-primary">Map View</span>
</div>
</div>
{/*  Price & Rate Block  */}
<div className="flex items-baseline justify-between pt-1">
<div className="flex items-baseline gap-2">
<span className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-extrabold">₹1.52 Cr</span>
<span className="font-body-sm text-body-sm text-on-surface-variant font-medium">₹16,846 / sq.ft</span>
</div>
<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px]">trending_up</span>
<span>Fair Market Value</span>
</div>
</div>
</section>
{/*  Key Property Specifications (Clean Modern Pill Grid)  */}
<section className="grid grid-cols-3 gap-2.5">
{/*  Spec 1  */}
<div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
<span className="material-symbols-outlined text-[18px]">bed</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">CONFIGURATION</span>
<span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">4 BHK</span>
<span className="font-body-sm text-body-sm text-outline text-[11px]">4 Ensuite Baths</span>
</div>
{/*  Spec 2  */}
<div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
<span className="material-symbols-outlined text-[18px]">square_foot</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">SUPER AREA</span>
<span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">2,750</span>
<span className="font-body-sm text-body-sm text-outline text-[11px]">2,410 sq.ft Carpet</span>
</div>
{/*  Spec 3  */}
<div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary mb-1.5">
<span className="material-symbols-outlined text-[18px]">key</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">POSSESSION</span>
<span className="font-headline-sm text-headline-sm text-secondary mt-0.5">Ready</span>
<span className="font-body-sm text-body-sm text-outline text-[11px]">Brand New</span>
</div>
{/*  Spec 4  */}
<div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
<span className="material-symbols-outlined text-[18px]">apartment</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">FLOOR LEVEL</span>
<span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">3rd of 4</span>
<span className="font-body-sm text-body-sm text-outline text-[11px]">Elevator Access</span>
</div>
{/*  Spec 5  */}
<div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
<span className="material-symbols-outlined text-[18px]">explore</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">VASTU ORIENTATION</span>
<span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">East</span>
<span className="font-body-sm text-body-sm text-outline text-[11px]">Morning Sunlight</span>
</div>
{/*  Spec 6  */}
<div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
<span className="material-symbols-outlined text-[18px]">directions_car</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">RESERVED PARKING</span>
<span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">2 Covered</span>
<span className="font-body-sm text-body-sm text-outline text-[11px]">Basement + Stilt</span>
</div>
</section>
{/*  Verified Legal Title & Compliance Card  */}
<section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]" style={{ "fontVariationSettings": "'FILL' 1" }}>gavel</span>
</div>
<span className="font-label-lg text-label-lg text-on-surface">100% Legal Title Cleared</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">PropGuard™ Verified</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
        Complete legal due diligence completed by certified property advocates. All original documents verified with local authorities.
      </p>
<div className="grid grid-cols-2 gap-2 pt-1">
<div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low">
<span className="material-symbols-outlined text-secondary text-[18px]" style={{ "fontVariationSettings": "'FILL' 1" }}>check_circle</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Freehold A-Khata</span>
<span className="font-label-sm text-label-sm text-outline">Clear Ownership</span>
</div>
</div>
<div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low">
<span className="material-symbols-outlined text-secondary text-[18px]" style={{ "fontVariationSettings": "'FILL' 1" }}>check_circle</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">15-Yr Encumbrance</span>
<span className="font-label-sm text-label-sm text-outline">Nil Dues &amp; Liens</span>
</div>
</div>
<div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low">
<span className="material-symbols-outlined text-secondary text-[18px]" style={{ "fontVariationSettings": "'FILL' 1" }}>check_circle</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">OC &amp; CC Certified</span>
<span className="font-label-sm text-label-sm text-outline">Municipal Sanction</span>
</div>
</div>
<div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low">
<span className="material-symbols-outlined text-secondary text-[18px]" style={{ "fontVariationSettings": "'FILL' 1" }}>check_circle</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Bank Loan Pre-OK</span>
<span className="font-label-sm text-label-sm text-outline">SBI, HDFC &amp; ICICI</span>
</div>
</div>
</div>
</section>
{/*  Verified Owner Profile (Trust & Safety First)  */}
<section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="relative">
<div className="w-13 h-13 w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline-sm text-headline-sm font-bold">
              YP
            </div>
<div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
<span className="material-symbols-outlined text-[11px]" style={{ "fontVariationSettings": "'FILL' 1" }}>check</span>
</div>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-1.5">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Yash Pal</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Owner • DigiLocker Verified • Listed 3 days ago</span>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
          100% Response
        </span>
</div>
<div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low">
<span className="material-symbols-outlined text-primary text-[20px]">shield</span>
<div className="flex flex-col flex-1">
<span className="font-label-md text-label-md text-on-surface">Phone Number Masked for Privacy</span>
<span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Calls routed through secure virtual proxy. No spam guaranteed.</span>
</div>
</div>
</section>
{/*  Interactive EMI Calculator Module  */}
<section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[22px]">calculate</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Affordability &amp; EMI</h2>
</div>
<span className="font-label-sm text-label-sm text-outline">@ 8.5% p.a. • 20 Yrs</span>
</div>
{/*  Live Calculation Display  */}
<div className="p-3 rounded-xl bg-surface-container flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Estimated Monthly EMI</span>
<span className="font-headline-md text-headline-md text-primary font-bold" id="monthlyEmiDisplay">₹{monthlyEmi.toLocaleString("en-IN")}</span>
</div>
<div className="flex flex-col items-end">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Loan Amount</span>
<span className="font-label-lg text-label-lg text-on-surface font-semibold" id="loanAmountDisplay">₹{(loanAmount / 10000000).toFixed(2)} Cr</span>
</div>
</div>
{/*  Interactive Slider  */}
<div className="flex flex-col gap-1.5">
<div className="flex justify-between items-center font-label-md text-label-md">
<span className="text-on-surface-variant">Down Payment: <strong className="text-on-surface font-semibold" id="dpPercentageLabel">20%</strong></span>
<span className="text-primary font-semibold" id="dpAmountLabel">₹30.40 Lakhs</span>
</div>
<input className="w-full h-2 rounded-lg bg-surface-container-high appearance-none cursor-pointer accent-primary" id="downPaymentSlider" max="50" min="10" step="5" type="range" value="20"/>
<div className="flex justify-between font-label-sm text-label-sm text-outline pt-1">
<span>10% (₹15.2L)</span>
<span>30%</span>
<span>50% (₹76.0L)</span>
</div>
</div>
</section>
{/*  Architectural Blueprint & Layout  */}
<section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[20px]">architecture</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Architectural Floor Plan</h2>
</div>
<span className="font-label-sm text-label-sm text-primary">Vastu Compliant</span>
</div>
{/*  Floor Plan Visual Snippet  */}
<div className="relative w-full aspect-[16/9] rounded-xl bg-surface-container-low overflow-hidden flex items-center justify-center group cursor-pointer" id="planTrigger">
{/*  Blueprint SVG Graphics  */}
<svg className="w-full h-full p-4 text-outline-variant stroke-current" fill="none" viewBox="0 0 400 220">
<rect className="text-primary/40" height="180" rx="8" strokeDasharray="4 4" strokeWidth="2" width="360" x="20" y="20"></rect>
{/*  Master Bedroom  */}
<rect className="text-outline" height="90" strokeWidth="1.5" width="130" x="35" y="35"></rect>
<text className="font-label-sm" fill="currentColor" font-size="11" text-anchor="middle" x="100" y="85">Master Suite (16x14)</text>
{/*  Living Dining  */}
<rect className="text-primary" height="150" strokeWidth="1.5" width="190" x="175" y="35"></rect>
<text className="font-label-sm" fill="currentColor" font-size="12" text-anchor="middle" x="270" y="115">Grand Living Lounge (24x18)</text>
{/*  Kitchen  */}
<rect className="text-outline" height="50" strokeWidth="1.5" width="130" x="35" y="135"></rect>
<text className="font-label-sm" fill="currentColor" font-size="10" text-anchor="middle" x="100" y="165">Modular Kitchen (12x10)</text>
</svg>
<div className="absolute inset-0 bg-on-surface/5 flex items-end justify-end p-3">
<button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow text-on-surface font-label-md text-label-md active:scale-95 transition-transform" type="button">
<span className="material-symbols-outlined text-[16px]">zoom_in</span>
<span>View Full Specs</span>
</button>
</div>
</div>
<span className="font-body-sm text-body-sm text-outline text-[12px] text-center">4 Bed • 4 Bath • 2 Balconies • 1 Utility Room</span>
</section>
{/*  Amenities & Lifestyle Perks  */}
<section className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<h2 className="font-headline-sm text-headline-sm text-on-surface">Curated Amenities</h2>
<span className="font-label-md text-label-md text-primary">16 Total</span>
</div>
<div className="grid grid-cols-2 gap-2">
<div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">electric_car</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">EV Fast Charging</span>
<span className="font-label-sm text-label-sm text-outline">Dedicated Station</span>
</div>
</div>
<div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">elevator</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Otis High-Speed Lift</span>
<span className="font-label-sm text-label-sm text-outline">Automatic ARD</span>
</div>
</div>
<div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">nest_cam_wired_stand</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">3-Tier CCTV Sec</span>
<span className="font-label-sm text-label-sm text-outline">24x7 Guarded</span>
</div>
</div>
<div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">power</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">100% Power Backup</span>
<span className="font-label-sm text-label-sm text-outline">Dual Inverter Line</span>
</div>
</div>
</div>
</section>
{/*  Neighborhood Proximity Highlights  */}
<section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 mb-4">
<div className="flex items-center justify-between">
<h2 className="font-headline-sm text-headline-sm text-on-surface">Location Milestones</h2>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Prime Model Town</span>
</div>
<div className="flex flex-col gap-2.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<div className="flex items-center gap-2 text-on-surface">
<span className="material-symbols-outlined text-outline text-[18px]">school</span>
<span>Spring Dale Senior School</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant font-medium">0.8 km (3 mins)</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm">
<div className="flex items-center gap-2 text-on-surface">
<span className="material-symbols-outlined text-outline text-[18px]">local_hospital</span>
<span>Fortis Escorts Hospital</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant font-medium">1.4 km (5 mins)</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm">
<div className="flex items-center gap-2 text-on-surface">
<span className="material-symbols-outlined text-outline text-[18px]">flight</span>
<span>Sri Guru Ram Dass Airport</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant font-medium">11.2 km (20 mins)</span>
</div>
</div>
</section>
</div>
{/*  Client Interaction Script (EMI Calc + Carousel Indicator Track)  */}


        {/* Mobile Fixed Bottom Dock */}
        <aside className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(11,28,48,0.08)]"><div className="h-20 px-gutter-mobile flex items-center justify-between gap-space-md"><div className="flex flex-col"><div className="flex items-center gap-1"><span className="material-symbols-outlined text-secondary text-[16px]">verified</span><span className="font-label-sm text-label-sm text-secondary uppercase">Direct Owner</span></div><span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Quick Response</span></div><button aria-label="Contact Verified Owner" onClick={handlePhoneClick} className="flex-1 max-w-[210px] h-12 px-space-lg rounded-full bg-primary-container hover:bg-primary active:scale-[0.98] shadow-[0_8px_20px_-2px_rgba(0,91,234,0.35)] flex items-center justify-center gap-space-xs text-on-primary font-label-lg text-label-lg transition-all"><span className="material-symbols-outlined text-[20px]">call</span><span>Contact Owner</span></button></div></aside>

        {/* Mobile Slide-Up Bottom Sheet Mortgage EMI Modal */}
        {isEmiModalOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEmiModalOpen(false);
            }}
          >
            {/*  Bottom Sheet Modal Structure  */}
<div className="relative z-10 w-full bg-surface-container-lowest rounded-t-3xl shadow-2xl flex flex-col pt-3 pb-8">
{/*  Drag Handle & Modal Bar  */}
<div className="w-full flex justify-center py-1">
<div className="w-12 h-1.5 rounded-full bg-outline-variant/60"></div>
</div>
{/*  Modal Header  */}
<div className="px-gutter-mobile pt-2 pb-4 flex items-start justify-between">
<div className="min-w-0 pr-space-sm">
<div className="flex items-center gap-1.5 mb-1">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Live Quotation</span>
</div>
<h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Mortgage EMI Calculator</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
<span className="font-label-lg text-label-lg text-on-surface font-semibold">₹1.52 Cr</span>
<span>•</span>
<span className="text-secondary font-medium">Model Town 4 BHK Luxury</span>
</p>
</div>
<button aria-label="Close calculator" className="w-9 h-9 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center active:scale-95 transition-transform"  type="button">
<span className="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
<div className="px-gutter-mobile flex flex-col gap-space-lg">
{/*  Primary Repayment Highlight Card  */}
<div className="w-full rounded-2xl bg-gradient-to-br from-surface-container-low via-surface-container-lowest to-surface-container-high/40 p-4 shadow-sm flex flex-col gap-3.5">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Estimated Monthly EMI</span>
<div className="flex items-center gap-1 bg-secondary-container/30 px-2 py-0.5 rounded-full">
<span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
<span className="font-label-sm text-label-sm text-on-secondary-container">Pre-Sanction Match</span>
</div>
</div>
<div className="flex items-baseline gap-1.5">
<span className="font-headline-xl-mobile text-headline-xl-mobile text-primary-container font-extrabold tracking-tight" id="emiDisplay">
            ₹1,05,527
          </span>
<span className="font-label-lg text-label-lg text-on-surface-variant">/ month</span>
</div>
{/*  Loan Breakup Visualizer (Dual Progress Bar)  */}
<div className="w-full flex flex-col gap-1.5 pt-1">
<div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden flex">
<div className="h-full bg-primary-container transition-all duration-300" id="principalBar" style={{ width: `${principalPct}%` }}></div>
<div className="h-full bg-secondary transition-all duration-300" id="interestBar" style={{ width: `${interestPct}%` }}></div>
</div>
<div className="flex items-center justify-between text-on-surface-variant">
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
<span className="font-label-sm text-label-sm">Principal: <strong className="text-on-surface font-semibold" id="principalSummary">₹1.22 Cr (48%)</strong></span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm">Interest: <strong className="text-on-surface font-semibold" id="interestSummary">₹1.31 Cr (52%)</strong></span>
</div>
</div>
</div>
{/*  Overall Summary Stat Row  */}
<div className="pt-2 flex items-center justify-between bg-surface-container-lowest/80 rounded-xl px-3 py-2">
<span className="font-body-sm text-body-sm text-on-surface-variant">Total Payable (P+I)</span>
<span className="font-label-lg text-label-lg text-on-surface font-bold" id="totalPayableSummary">{formatIndianCurrency(totalRepayment)}</span>
</div>
</div>
{/*  Touch-Optimized Interactive Controls  */}
<div className="flex flex-col gap-5">
{/*  Control 1: Down Payment  */}
<div className="flex flex-col gap-2 bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm">
<div className="flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface font-semibold">Down Payment</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Loan: <span className="text-on-surface font-medium" id="loanAmountText">₹1.22 Cr</span></span>
</div>
<div className="text-right">
<span className="font-label-lg text-label-lg text-primary-container font-bold bg-primary-fixed/40 px-2.5 py-1 rounded-lg" id="downPaymentValue">
                20% (₹30.40 L)
              </span>
</div>
</div>
<div className="pt-2 px-1">
<input className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary-container" id="dpRange" max="60" min="10" step="5" type="range" value="20"/>
<div className="flex justify-between items-center pt-2 font-label-sm text-label-sm text-on-surface-variant">
<span>10% (Min ₹15.2L)</span>
<span>25%</span>
<span>40%</span>
<span>60% (₹91.2L)</span>
</div>
</div>
</div>
{/*  Control 2: Interest Rate with Quick Bank Presets  */}
<div className="flex flex-col gap-2.5 bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm">
<div className="flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface font-semibold">Interest Rate</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Floating repo-linked</span>
</div>
<div className="text-right">
<span className="font-label-lg text-label-lg text-on-surface font-bold bg-surface-container-high px-2.5 py-1 rounded-lg" id="rateValue">
                8.50% p.a.
              </span>
</div>
</div>
{/*  Bank Preset Touch Chips  */}
<div className="grid grid-cols-4 gap-1.5 pt-1">
<button className="bank-pill py-1.5 px-2 rounded-xl text-center bg-surface-container-low text-on-surface hover:bg-surface-container active:scale-95 transition-all"  type="button">
<span className="block font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">SBI</span>
<span className="block font-label-sm text-label-sm font-semibold text-primary">8.25%</span>
</button>
<button className="bank-pill active-pill py-1.5 px-2 rounded-xl text-center bg-primary-container text-on-primary shadow-sm active:scale-95 transition-all"  type="button">
<span className="block font-label-sm text-label-sm uppercase font-bold">HDFC</span>
<span className="block font-label-sm text-label-sm font-semibold">8.50%</span>
</button>
<button className="bank-pill py-1.5 px-2 rounded-xl text-center bg-surface-container-low text-on-surface hover:bg-surface-container active:scale-95 transition-all"  type="button">
<span className="block font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">ICICI</span>
<span className="block font-label-sm text-label-sm font-semibold text-primary">8.75%</span>
</button>
<button className="bank-pill py-1.5 px-2 rounded-xl text-center bg-surface-container-low text-on-surface hover:bg-surface-container active:scale-95 transition-all"  type="button">
<span className="block font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">AXIS</span>
<span className="block font-label-sm text-label-sm font-semibold text-primary">9.10%</span>
</button>
</div>
<div className="px-1 pt-1">
<input className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary-container" id="rateRange" max="12.0" min="7.5" step="0.05" type="range" value="8.50"/>
</div>
</div>
{/*  Control 3: Loan Tenure  */}
<div className="flex flex-col gap-2.5 bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm">
<div className="flex items-center justify-between">
<span className="font-label-lg text-label-lg text-on-surface font-semibold">Loan Tenure</span>
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider" id="tenureLabel">20 Years (240 Mo)</span>
</div>
<div className="grid grid-cols-5 gap-1.5">
<button onClick={() => setTenureYears(10)} className={`tenure-pill py-2 rounded-xl font-label-sm text-label-sm active:scale-95 transition-all ${tenureYears === 10 ? "bg-primary-container text-on-primary font-bold shadow-sm" : "bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container"}`}>10 Yrs</button>
<button onClick={() => setTenureYears(15)} className={`tenure-pill py-2 rounded-xl font-label-sm text-label-sm active:scale-95 transition-all ${tenureYears === 15 ? "bg-primary-container text-on-primary font-bold shadow-sm" : "bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container"}`}>15 Yrs</button>
<button onClick={() => setTenureYears(20)} className={`tenure-pill py-2 rounded-xl font-label-sm text-label-sm active:scale-95 transition-all ${tenureYears === 20 ? "bg-primary-container text-on-primary font-bold shadow-sm" : "bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container"}`}>20 Yrs</button>
<button onClick={() => setTenureYears(25)} className={`tenure-pill py-2 rounded-xl font-label-sm text-label-sm active:scale-95 transition-all ${tenureYears === 25 ? "bg-primary-container text-on-primary font-bold shadow-sm" : "bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container"}`}>25 Yrs</button>
<button onClick={() => setTenureYears(30)} className={`tenure-pill py-2 rounded-xl font-label-sm text-label-sm active:scale-95 transition-all ${tenureYears === 30 ? "bg-primary-container text-on-primary font-bold shadow-sm" : "bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container"}`}>30 Yrs</button>
</div>
</div>
</div>
{/*  Partner Bank Pre-Approved Offers Stack  */}
<div className="flex flex-col gap-2.5">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold">Partner Bank Offers</span>
<span className="font-label-sm text-label-sm text-primary font-medium">2 Verified Deals</span>
</div>
<div className="flex flex-col gap-2">
{/*  SBI Offer Card  */}
<div className="w-full bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-extrabold text-sm">
                SBI
              </div>
<div className="flex flex-col">
<div className="flex items-center gap-1.5">
<span className="font-label-lg text-label-lg text-on-surface font-bold">SBI Regular Home Loan</span>
<span className="font-label-sm text-label-sm bg-secondary-fixed/40 text-on-secondary-fixed-variant px-1.5 py-0.5 rounded-md font-semibold">Pre-Approved</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">8.40% • Zero Processing Fee</span>
</div>
</div>
<span className="material-symbols-outlined text-primary text-[20px]">chevron_right</span>
</div>
{/*  HDFC Offer Card  */}
<div className="w-full bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary-container font-extrabold text-sm">
                HDFC
              </div>
<div className="flex flex-col">
<div className="flex items-center gap-1.5">
<span className="font-label-lg text-label-lg text-on-surface font-bold">HDFC Reach Home Loan</span>
<span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed-variant px-1.5 py-0.5 rounded-md font-semibold">Instant KYC</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">8.50% • 48-hr Disbursal Assurance</span>
</div>
</div>
<span className="material-symbols-outlined text-primary text-[20px]">chevron_right</span>
</div>
</div>
</div>
{/*  Sticky-Style Action Area  */}
<div className="pt-2 flex flex-col gap-3">
{/*  Reassurance Footer Note  */}
<div className="flex items-center justify-center gap-2 text-on-surface-variant">
<span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
<span className="font-label-sm text-label-sm text-center">Encumbrance checked • No hidden fees • 100% Free Service</span>
</div>
{/*  Primary CTA Button  */}
<button className="w-full h-12 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"  type="button">
<span>Apply for Pre-Approved Loan</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
{/*  Secondary Dismiss  */}
<button className="w-full py-2 text-center font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"  type="button">
          Dismiss &amp; Return to Listing
        </button>
</div>
</div>
</div>


          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

export default function PropertyDetailLive({ id }: { id?: string }) {
  const params = useParams();
  const cleanId = (typeof id === "string" && id) || (typeof params?.id === "string" && params.id) || "werwtw-mvuzhfat";
  const { isSignedIn, getToken } = useAuth();

  return (
    <Detail
      id={cleanId}
      signedIn={Boolean(isSignedIn)}
      getToken={getToken}
    />
  );
}
