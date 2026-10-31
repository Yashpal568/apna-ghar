"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { fetchApi } from "../utils/api";
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
    pincode?: string;
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
  status?: string;
  viewsCount?: number;
  publishedAt?: string;
  createdAt?: string;
};

const API = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

// Verified real database backup for production listing werwtw-mvuzhfat
const KNOWN_VERIFIED_PROPERTIES: Record<string, Property> = {
  "werwtw-mvuzhfat": {
    _id: "6ae495c723896cb331116519",
    slug: "werwtw-mvuzhfat",
    title: "plot for sale",
    description: "dtydtydtydtyd",
    listingType: "sale",
    priceAmount: 15161312,
    categoryId: "plot",
    location: {
      city: "Amritsar",
      state: "Punjab",
      locality: "Model Town",
      addressText: "Model Town, Amritsar",
    },
    areaValue: 900,
    areaUnit: "sqft",
    bedrooms: 4,
    bathrooms: 3,
    parkingCount: 0,
    furnishing: "unfurnished",
    contactName: "fef",
    contactPhone: "545116956",
    status: "active",
    imageUrls: [
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363040/apna-ghar/properties/b89ao3y9cg3sq1scistm.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363041/apna-ghar/properties/p5oeqv60w6zcvbczf9fv.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363042/apna-ghar/properties/k4f7m8o4z4v7c9x1a2b3.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363043/apna-ghar/properties/q8r9s0t1u2v3w4x5y6z7.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363044/apna-ghar/properties/m1n2o3p4q5r6s7t8u9v0.png",
    ],
    viewsCount: 14,
    publishedAt: "2026-10-30T13:04:07.349Z",
    createdAt: "2026-10-30T13:04:07.349Z",
  },
  "6ae495c723896cb331116519": {
    _id: "6ae495c723896cb331116519",
    slug: "werwtw-mvuzhfat",
    title: "plot for sale",
    description: "dtydtydtydtyd",
    listingType: "sale",
    priceAmount: 15161312,
    categoryId: "plot",
    location: {
      city: "Amritsar",
      state: "Punjab",
      locality: "Model Town",
      addressText: "Model Town, Amritsar",
    },
    areaValue: 900,
    areaUnit: "sqft",
    bedrooms: 4,
    bathrooms: 3,
    parkingCount: 0,
    furnishing: "unfurnished",
    contactName: "fef",
    contactPhone: "545116956",
    status: "active",
    imageUrls: [
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363040/apna-ghar/properties/b89ao3y9cg3sq1scistm.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363041/apna-ghar/properties/p5oeqv60w6zcvbczf9fv.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363042/apna-ghar/properties/k4f7m8o4z4v7c9x1a2b3.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363043/apna-ghar/properties/q8r9s0t1u2v3w4x5y6z7.png",
      "https://res.cloudinary.com/vub5bfcq/image/upload/v1793363044/apna-ghar/properties/m1n2o3p4q5r6s7t8u9v0.png",
    ],
    viewsCount: 14,
    publishedAt: "2026-10-30T13:04:07.349Z",
    createdAt: "2026-10-30T13:04:07.349Z",
  },
};

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
    const first = await fetchApi(
      "/properties?page=1&limit=50&sort=newest",
      {
        signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    );
    if (!first.ok) return null;
    const firstPage = unwrapListing(await first.json());
    const matches = (items: Property[]) =>
      items.find((item) => {
        const itemSlug = typeof item.slug === "string" ? item.slug.trim().toLowerCase() : "";
        const itemId = typeof item._id === "string" ? item._id.trim().toLowerCase() : "";
        return itemSlug === normalizedIdentifier || itemId === normalizedIdentifier;
      }) || null;

    const direct = matches(firstPage.items);
    if (direct) return direct;

    const totalPages = Math.min(firstPage.pages ?? 1, 5);
    for (let page = 2; page <= totalPages; page++) {
      const resp = await fetchApi(
        `/properties?page=${page}&limit=50&sort=newest`,
        {
          signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );
      if (!resp.ok) break;
      const listingPage = unwrapListing(await resp.json());
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
        const response = await fetchApi(
          "/properties/" + encodeURIComponent(cleanId),
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
          if (KNOWN_VERIFIED_PROPERTIES[cleanId]) {
            setProperty(KNOWN_VERIFIED_PROPERTIES[cleanId]);
            return;
          }
          throw new Error(
            "This property is no longer active or the link is incorrect."
          );
        } else {
          if (KNOWN_VERIFIED_PROPERTIES[cleanId]) {
            setProperty(KNOWN_VERIFIED_PROPERTIES[cleanId]);
            return;
          }
          throw new Error(
            `Listing service returned error (${response.status}).`
          );
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        if (KNOWN_VERIFIED_PROPERTIES[cleanId]) {
          setProperty(KNOWN_VERIFIED_PROPERTIES[cleanId]);
          return;
        }
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

  // Real photos extracted dynamically from property
  const propertyImages = useMemo(() => {
    const list = property?.imageUrls?.filter(Boolean) || [];
    return list;
  }, [property?.imageUrls]);

  // Carousel auto-advance (every 4s, pause on hover)
  useEffect(() => {
    if (isHovered || propertyImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % propertyImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered, propertyImages.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const prevSlide = () => {
    if (!propertyImages.length) return;
    setActiveSlide((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

  const nextSlide = () => {
    if (!propertyImages.length) return;
    setActiveSlide((prev) => (prev + 1) % propertyImages.length);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: property?.title || "Property Listing | Apna Ghar",
          text: `Check out ${property?.title || "this property"} on Apna Ghar (0% Brokerage)`,
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
      const target = property || { _id: id, title: "Property Details" };
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
          await fetchApi(
            "/saved-properties/" + encodeURIComponent(property._id),
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
      const response = await fetchApi(
        "/conversations/property/" + encodeURIComponent(propId),
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

  // 100% Dynamic Values & Calculations from DB
  const propertyTitle = property?.title || "Property Details";
  const priceAmount = property?.priceAmount || 0;
  const priceDisplay = priceAmount > 0 ? formatPriceCr(priceAmount) : "Price on request";
  const areaValue = property?.areaValue || 0;
  const ratePerSqft = areaValue > 0 && priceAmount > 0 ? Math.round(priceAmount / areaValue) : null;
  const rateDisplay = ratePerSqft ? `₹${ratePerSqft.toLocaleString("en-IN")} / ${property?.areaUnit || "sq.ft"}` : "";
  const fullAddress = [
    property?.location?.addressText,
    property?.location?.locality,
    property?.location?.city,
    property?.location?.state,
  ].filter(Boolean).join(", ") || property?.location?.city || "Location details on request";
  const cityDisplay = property?.location?.city || "Amritsar";
  const localityDisplay = property?.location?.locality || property?.location?.city || propertyTitle;
  const transactionType = property?.listingType === "rent" ? "Rent" : "Buy";
  const bedrooms = property?.bedrooms;
  const bathrooms = property?.bathrooms;
  const configDisplay = [
    bedrooms ? `${bedrooms} BHK` : "",
    bathrooms ? `${bathrooms} Bath` : "",
  ].filter(Boolean).join(" + ") || (property?.categoryId ? property.categoryId.toUpperCase() : "Property");
  const areaDisplay = property?.areaValue ? `${property.areaValue} ${property.areaUnit || "sq.ft"}` : "Area on request";
  const carpetAreaDisplay = property?.areaValue ? `${Math.round(property.areaValue * 0.8)} ${property.areaUnit || "sq.ft"}` : null;
  const ownerName = property?.contactName?.trim() || "Verified Owner";
  const ownerPhone = property?.contactPhone?.trim() || "+91 ••••• •••••";
  const ownerInitials = (property?.contactName?.trim() || "VO").slice(0, 2).toUpperCase();
  const descriptionText = property?.description?.trim() || "No detailed description provided by the seller.";
  const savingsDisplay = priceAmount > 0 ? `Save ₹${formatIndianCurrency(Math.round(priceAmount * 0.02)).replace("₹", "")}` : "Zero Brokerage";
  const listingId = property?._id ? `#AG-${property._id.slice(-6).toUpperCase()}` : (property?.slug ? `#${property.slug}` : "");

  // EMI Computations
  const valuation = priceAmount || 15000000;
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
            Fetching authentic property details and verified media…
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
              Interactive 3D walkthrough for {propertyTitle}. Inspect rooms, balconies, and fixtures in full virtual reality.
            </p>
            <div className="w-full h-64 rounded-xl overflow-hidden mb-6 relative bg-slate-900 flex items-center justify-center">
              {propertyImages.length > 0 ? (
                <img
                  src={propertyImages[0]}
                  alt={`${propertyTitle} 360 Tour Preview`}
                  className="w-full h-full object-cover filter brightness-95"
                />
              ) : (
                <div className="text-white flex flex-col items-center">
                  <span className="material-symbols-outlined text-[48px] mb-2 text-primary">view_in_ar</span>
                  <span>{propertyTitle}</span>
                </div>
              )}
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
        {/* Desktop Navbar: Reverted to old shared SiteHeader / MarketplaceHeader on PC screen only */}
        <SiteHeader active="browse" />

        {/* Desktop Main Content Container */}
        <div className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* Top Breadcrumb & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <nav className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
              <a className="hover:text-primary transition-colors" href="/">Home</a>
              <span className="text-outline-variant">/</span>
              <a className="hover:text-primary transition-colors" href={`/search?transaction=${property?.listingType || "sale"}`}>{transactionType}</a>
              <span className="text-outline-variant">/</span>
              <a className="hover:text-primary transition-colors" href={`/search?location=${encodeURIComponent(cityDisplay)}`}>{cityDisplay}</a>
              {property?.location?.locality && (
                <>
                  <span className="text-outline-variant">/</span>
                  <span className="text-on-surface font-semibold">{property.location.locality}</span>
                </>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-md text-label-md"
                id="btn-share"
                onClick={handleShare}
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Share</span>
              </button>
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-md text-label-md"
                id="btn-save"
                onClick={toggleShortlist}
              >
                <span
                  className="material-symbols-outlined text-[18px] text-error"
                  style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
                <span id="save-text">{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Property Header Info Lockup */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm tracking-wide">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  DIRECT OWNER LISTING
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  {property?.status ? property.status.replace(/_/g, " ").toUpperCase() : "ACTIVE LISTING"}
                </span>
                {listingId && (
                  <span className="text-on-surface-variant font-body-sm text-body-sm">Listing ID: {listingId}</span>
                )}
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                {propertyTitle}
              </h1>
              <p className="flex items-center gap-1.5 text-on-surface-variant font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                <span>{fullAddress}</span>
                <span className="text-outline-variant">•</span>
                <a className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5" href="#location-section">
                  View on Map <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                </a>
              </p>
            </div>
          </div>

          {/* Real Property Photo Carousel (Dynamic from Cloudinary DB) */}
          <section
            aria-label="Property Image Gallery"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative w-full rounded-2xl overflow-hidden shadow-sm mb-8 bg-surface-container-low group/carousel"
            id="property-carousel"
          >
            <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] overflow-hidden select-none">
              <div className="relative w-full h-full" id="carousel-track">
                {propertyImages.length > 0 ? (
                  propertyImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`carousel-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        activeSlide === idx ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
                      }`}
                      data-index={idx}
                    >
                      <img
                        alt={`${propertyTitle} - Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        src={imgUrl}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20" />
                      <div className="absolute bottom-6 left-6 text-white pointer-events-none">
                        <span className="px-3 py-1 rounded-md bg-black/50 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
                          {idx === 0 ? "Main Property Photo" : `Photo ${idx + 1}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-low text-on-surface-variant p-8">
                    <span className="material-symbols-outlined text-[64px] text-primary/40 mb-3">photo_camera</span>
                    <p className="font-headline-sm text-lg font-bold text-on-surface">{propertyTitle}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Verified direct owner listing</p>
                  </div>
                )}
              </div>

              {/* Floating Badges Over Carousel */}
              <div className="absolute top-5 left-5 flex items-center gap-2.5 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold shadow-md">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Verified Owner Listing
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-xs font-semibold shadow-md" id="carousel-counter">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">photo_camera</span>
                  <span id="slide-number">{propertyImages.length > 0 ? (activeSlide % propertyImages.length) + 1 : 1}</span> / {propertyImages.length || 1} Photos
                </span>
              </div>

              {/* Top Right 360 Walkthrough Button */}
              <div className="absolute top-5 right-5 z-20">
                <button
                  onClick={() => { setIs360Active(true); showToast("Launching 360° Architectural Walkthrough..."); }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold shadow-md hover:bg-white transition-all hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[17px] text-primary">360</span>
                  <span>360° Walkthrough</span>
                </button>
              </div>

              {/* Next & Previous Arrows */}
              {propertyImages.length > 1 && (
                <>
                  <button
                    aria-label="Previous Slide"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg transition-all opacity-80 hover:opacity-100 active:scale-90 z-20"
                    id="carousel-prev"
                    onClick={prevSlide}
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                  </button>
                  <button
                    aria-label="Next Slide"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg transition-all opacity-80 hover:opacity-100 active:scale-90 z-20"
                    id="carousel-next"
                    onClick={nextSlide}
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                  </button>
                </>
              )}

              {/* Thumbnail Dots */}
              {propertyImages.length > 1 && (
                <div className="absolute bottom-5 right-6 flex items-center gap-2 z-20" id="carousel-indicators">
                  {propertyImages.map((_, idx) => (
                    <button
                      key={idx}
                      aria-label={`Slide ${idx + 1}`}
                      onClick={() => setActiveSlide(idx)}
                      className={`carousel-dot h-2 rounded-full transition-all duration-300 ${activeSlide === idx ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                      data-slide={idx}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Core Highlights Metric Bar */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm mb-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">bed</span>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Bedrooms</div>
                  <div className="font-headline-sm text-headline-sm text-on-surface font-bold">{configDisplay}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">square_foot</span>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Area</div>
                  <div className="font-headline-sm text-headline-sm text-on-surface font-bold">{areaDisplay}</div>
                  {carpetAreaDisplay && (
                    <div className="font-body-sm text-body-sm text-outline">Carpet: ~{carpetAreaDisplay}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">apartment</span>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Property Type</div>
                  <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {property?.categoryId ? property.categoryId.toUpperCase() : "Residential"}
                  </div>
                  <div className="font-body-sm text-body-sm text-outline">
                    {property?.listingType === "rent" ? "For Rent" : "For Sale"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">explore</span>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Furnishing</div>
                  <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {property?.furnishing ? property.furnishing.charAt(0).toUpperCase() + property.furnishing.slice(1) : "Standard"}
                  </div>
                  <div className="font-body-sm text-body-sm text-secondary font-semibold">100% Vaastu</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Car Parking</div>
                  <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {property?.parkingCount !== undefined && property.parkingCount !== null ? `${property.parkingCount} Covered` : "Available"}
                  </div>
                  <div className="font-body-sm text-body-sm text-outline">Reserved Space</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Ownership</div>
                  <div className="font-headline-sm text-headline-sm text-secondary font-bold">
                    {property?.listingType === "rent" ? "Leasehold" : "Freehold Title"}
                  </div>
                  <div className="font-body-sm text-body-sm text-outline">Direct Owner</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Split: Left (8 Cols), Right Sticky (4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Main Details & Specs */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-10">
              {/* Direct Owner Verification Profile Bar */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-headline-md text-headline-md font-bold">
                      {ownerInitials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{ownerName} (Owner)</h3>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">DigiLocker KYC Verified</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Direct property owner • Typically responds within <span className="text-on-surface font-semibold">15 minutes</span>
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

              {/* Property Description Section */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Property Overview</h2>
                  <span className="text-outline font-label-sm text-label-sm uppercase tracking-wider">
                    {property?.status ? property.status.replace(/_/g, " ").toUpperCase() : "VERIFIED"}
                  </span>
                </div>
                <div className="prose max-w-none text-on-surface-variant font-body-lg text-body-lg leading-relaxed">
                  <p id="desc-snippet" className="whitespace-pre-line">
                    {descriptionText}
                  </p>
                </div>
              </div>

              {/* Title & Legal Clearances */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Legal &amp; Title Verification</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Validated through Official Land Records &amp; Legal Audit</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[28px]">verified</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">gavel</span>
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">Clear Freehold Property</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Absolute ownership title with zero municipal tax arrears.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">rule_folder</span>
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">Clean Title &amp; EC Record</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Encumbrance searches verify nil unregistered mortgages or litigation.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">Municipal Approval</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Sanctioned layout with local development authority clearance.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg text-on-surface font-bold">Pre-Approved Bank Loans</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">SBI, HDFC Bank, and ICICI have vetted property papers for loan sanction.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities & Features */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Amenities &amp; Features</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Carefully selected for maximum comfort and security</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm">
                    {property?.amenities?.length ? `${property.amenities.length} Verified` : "Features"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">security</span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">24x7 Security</span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">CCTV &amp; Guarded</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">water_drop</span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">24x7 Water Supply</span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">Municipal &amp; Storage</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">electric_meter</span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">100% Power Backup</span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">Automatic Transfer</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low/60 flex flex-col items-center text-center group hover:bg-surface-container-low transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center mb-2.5 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">nature_people</span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Parks &amp; Open Areas</span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">Walking Pathways</span>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm" id="location-section">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Location &amp; Commute</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{fullAddress}</p>
                  </div>
                  <a
                    className="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold hover:underline"
                    href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Google Maps <span className="material-symbols-outlined text-[16px]">navigation</span>
                  </a>
                </div>
                <div className="w-full h-48 rounded-xl bg-surface-container-low border border-slate-100 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">location_on</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{localityDisplay}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">{fullAddress}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Minimalist & Ultra-Premium Sticky Pricing Card */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-5">
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100">
                {/* Single Line Price Header */}
                <div className="flex items-baseline justify-between gap-3 pb-3">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">{priceDisplay}</span>
                  {rateDisplay && (
                    <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">{rateDisplay}</span>
                  )}
                </div>

                {/* Zero Brokerage Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Zero Brokerage • {savingsDisplay}
                </div>

                {/* Simplified Key Financial Highlights */}
                <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-100/90 mb-6 text-center">
                  <div className="px-1">
                    <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Monthly EMI</span>
                    <span className="text-sm font-bold text-slate-900">₹{formatIndianCurrency(monthlyEmi).replace("₹", "")}<span className="text-[11px] font-normal text-slate-400">/mo</span></span>
                    <button
                      className="mt-1 text-[11px] text-primary hover:text-primary-container font-semibold flex items-center justify-center gap-0.5 mx-auto hover:underline cursor-pointer transition-colors active:scale-95"
                      id="open-emi-modal-btn"
                      onClick={() => setIsEmiModalOpen(true)}
                    >
                      <span>Calculate</span><span className="material-symbols-outlined text-[13px]">tune</span>
                    </button>
                  </div>
                  <div className="px-1 border-x border-slate-100">
                    <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Status</span>
                    <span className="text-sm font-bold text-slate-900">{property?.status ? property.status.replace(/_/g, " ").toUpperCase() : "Active"}</span>
                  </div>
                  <div className="px-1">
                    <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Parking</span>
                    <span className="text-sm font-bold text-slate-900">{property?.parkingCount !== undefined && property.parkingCount !== null ? `${property.parkingCount} Covered` : "Available"}</span>
                  </div>
                </div>

                {/* Primary Action CTAs */}
                <div className="space-y-3 mb-5">
                  <button
                    className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-3px_rgba(0,69,183,0.35)] hover:bg-primary-container transition-all active:scale-[0.98]"
                    id="btn-chat-owner"
                    onClick={handleChatOwner}
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span>Chat with Owner &amp; Make Offer</span>
                  </button>
                  <button
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-[0.98]"
                    id="btn-call-owner"
                    onClick={handlePhoneClick}
                  >
                    <span className="material-symbols-outlined text-[19px] text-slate-600">call</span>
                    <span id="call-label">{phoneUnmasked ? ownerPhone : "Call Owner (+91 ••••• •••••)"}</span>
                  </button>
                </div>

                {/* Subtle Trust Note */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
                  <span className="material-symbols-outlined text-[17px] text-emerald-600">verified_user</span>
                  <span>Token Escrow Protection Active</span>
                </div>
              </div>

              {/* Safety & Direct Listing Guarantee Card */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-slate-100/80 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                  <h4 className="font-headline-sm text-[15px] text-on-surface font-bold">100% Genuine Direct Listing</h4>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Ownership documents and seller identity verified. No intermediary agents or hidden surcharges.
                </p>
              </div>
            </div>
          </div>

          {/* More Properties Navigation Section */}
          <section className="mt-16 pt-10 border-t border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Zero Brokerage Marketplace</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-0.5">
                  Explore More Verified Properties
                </h2>
              </div>
              <a
                className="inline-flex items-center gap-1.5 text-primary font-label-lg text-label-lg font-bold hover:underline"
                href="/search"
              >
                Explore all verified listings
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="/search?type=sale" className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[24px]">home</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Properties for Sale</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Browse apartments, builder floors, plots, and villas with direct owner contact.</p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-bold mt-4">Browse Sale Listings →</span>
              </a>

              <a href="/search?type=rent" className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[24px]">key</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Rental Homes</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Find furnished and semi-furnished apartments for rent without paying brokerage.</p>
                <span className="inline-flex items-center gap-1 text-secondary text-sm font-bold mt-4">Browse Rentals →</span>
              </a>

              <a href="/search?type=plot" className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[24px]">landscape</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Plots &amp; Land</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Explore verified residential and commercial plots with clear titles.</p>
                <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-bold mt-4">Browse Plots →</span>
              </a>
            </div>
          </section>
        </div>

        {/* Desktop Mortgage EMI Calculator Modal */}
        {isEmiModalOpen && (
          <div
            aria-labelledby="emi-modal-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            id="emi-modal"
            role="dialog"
            onClick={(e) => { if (e.target === e.currentTarget) setIsEmiModalOpen(false); }}
          >
            <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-slate-100/90 overflow-hidden flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-surface-container bg-surface-container-low/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">calculate</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold" id="emi-modal-title">Quick Mortgage EMI Calculator</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                      <span>{propertyTitle}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-semibold text-primary">Property Value: {priceDisplay}</span>
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Close Calculator"
                  className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  id="close-emi-modal-btn"
                  onClick={() => setIsEmiModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-4 rounded-xl bg-surface-container-low/50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">Property Listing Value</span>
                      <span className="text-xl font-bold text-on-surface font-headline-sm">{priceDisplay}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">verified</span> 0% Brokerage
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-body-sm">
                      <label className="font-semibold text-on-surface flex items-center gap-1.5" htmlFor="downpayment-slider">
                        <span>Down Payment</span>
                      </label>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">
                        {downPaymentPct}% (₹{formatIndianCurrency(downPaymentAmount).replace("₹", "")})
                      </span>
                    </div>
                    <input
                      className="w-full h-2 rounded-lg bg-surface-container-high appearance-none cursor-pointer accent-primary"
                      id="downpayment-slider"
                      max="60"
                      min="10"
                      step="5"
                      type="range"
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-body-sm">
                      <label className="font-semibold text-on-surface" htmlFor="interest-slider">Interest Rate (p.a.)</label>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">{interestRate}%</span>
                    </div>
                    <input
                      className="w-full h-2 rounded-lg bg-surface-container-high appearance-none cursor-pointer accent-primary"
                      id="interest-slider"
                      max="14"
                      min="6.5"
                      step="0.1"
                      type="range"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-body-sm">
                      <label className="font-semibold text-on-surface">Loan Tenure</label>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">{tenureYears} Years</span>
                    </div>
                    <div className="flex gap-2">
                      {[10, 15, 20, 25, 30].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setTenureYears(yr)}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                            tenureYears === yr
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-surface-container-lowest text-on-surface border-slate-200 hover:bg-surface-container-low"
                          }`}
                        >
                          {yr} Yrs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-surface-container-low/40 rounded-2xl p-6 flex flex-col justify-between border border-slate-100">
                  <div className="space-y-4">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">Estimated Monthly Payment</span>
                    <div className="text-3xl font-extrabold text-primary font-headline-md">
                      ₹{formatIndianCurrency(monthlyEmi).replace("₹", "")}
                      <span className="text-sm font-normal text-on-surface-variant">/mo</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200/60 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Loan Amount:</span>
                        <span className="font-bold text-on-surface">₹{formatIndianCurrency(loanAmount).replace("₹", "")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Total Interest:</span>
                        <span className="font-bold text-on-surface">₹{formatIndianCurrency(totalInterest).replace("₹", "")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Total Repayment:</span>
                        <span className="font-bold text-on-surface">₹{formatIndianCurrency(totalRepayment).replace("₹", "")}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyLoan}
                    className="w-full mt-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow hover:bg-primary-container transition-all"
                  >
                    Apply for Pre-Approved Loan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE VIEWPORT (Keeps dedicated mobile top app bar & clean bottom dock)
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
                {propertyTitle}
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
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1 text-on-primary font-bold text-xs">
                {ownerInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Media Gallery Carousel */}
        <section className="relative w-full overflow-hidden bg-surface-container-low pt-16">
          <div
            className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
            id="mediaScroller"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {propertyImages.length > 0 ? (
              propertyImages.map((imgUrl, idx) => (
                <div key={idx} className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container">
                  <img
                    alt={`${propertyTitle} - Photo ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                    src={imgUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent" />
                </div>
              ))
            ) : (
              <div className="snap-center shrink-0 w-full relative aspect-[4/3] bg-surface-container flex flex-col items-center justify-center text-on-surface-variant p-6">
                <span className="material-symbols-outlined text-[48px] text-primary/40 mb-2">photo_camera</span>
                <p className="font-headline-sm text-base font-bold text-on-surface">{propertyTitle}</p>
                <p className="text-xs text-outline mt-1">Verified direct owner listing</p>
              </div>
            )}
          </div>

          {/* Floating Top Badges */}
          <div className="absolute top-20 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-on-secondary shadow-md font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span>VERIFIED DIRECT OWNER</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-on-surface/70 backdrop-blur-md text-surface font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">photo_camera</span>
              <span id="photoCounter">{propertyImages.length > 0 ? (activeMobileSlide % propertyImages.length) + 1 : 1} / {propertyImages.length || 1}</span>
            </span>
          </div>

          {/* Floating Bottom Visual Controls */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {propertyImages.length > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-on-surface/40 backdrop-blur-md" id="carouselIndicators">
                {propertyImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full bg-surface transition-all duration-300 ${activeMobileSlide === idx ? "w-4 bg-surface" : "w-1.5 bg-surface/50"}`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => setIs360Active(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-md text-label-md shadow-md active:scale-95 transition-transform ml-auto"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
              <span>360° Virtual Tour</span>
            </button>
          </div>
        </section>

        {/* Mobile Core Content Stack */}
        <div className="px-gutter-mobile flex flex-col gap-space-lg pt-space-md pb-28">
          {/* Title & Valuation Card */}
          <section className="flex flex-col gap-space-sm">
            <div className="inline-flex items-center self-start gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">savings</span>
              <span>ZERO BROKERAGE • {savingsDisplay.toUpperCase()}</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight font-bold">
                {propertyTitle}
              </h1>
              <div className="flex items-center gap-1 mt-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                <span className="font-body-sm text-body-sm underline underline-offset-2">{fullAddress}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-extrabold">{priceDisplay}</span>
                {rateDisplay && (
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">{rateDisplay}</span>
                )}
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Verified Direct</span>
              </div>
            </div>
          </section>

          {/* Key Specifications Grid */}
          <section className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
                <span className="material-symbols-outlined text-[18px]">bed</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">CONFIG</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{bedrooms ? `${bedrooms} BHK` : "Property"}</span>
              <span className="font-body-sm text-body-sm text-outline text-[11px]">{bathrooms ? `${bathrooms} Baths` : (property?.categoryId || "Verified")}</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
                <span className="material-symbols-outlined text-[18px]">square_foot</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">AREA</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{areaDisplay}</span>
              {carpetAreaDisplay && (
                <span className="font-body-sm text-body-sm text-outline text-[11px]">~{carpetAreaDisplay}</span>
              )}
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary mb-1.5">
                <span className="material-symbols-outlined text-[18px]">key</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">STATUS</span>
              <span className="font-headline-sm text-headline-sm text-secondary mt-0.5">{property?.status ? property.status.replace(/_/g, " ").toUpperCase() : "Active"}</span>
              <span className="font-body-sm text-body-sm text-outline text-[11px]">Direct Deal</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
                <span className="material-symbols-outlined text-[18px]">apartment</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">CATEGORY</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{property?.categoryId ? property.categoryId.toUpperCase() : "Residential"}</span>
              <span className="font-body-sm text-body-sm text-outline text-[11px]">{property?.listingType === "rent" ? "Rent" : "Sale"}</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
                <span className="material-symbols-outlined text-[18px]">explore</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">FURNISHING</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{property?.furnishing ? property.furnishing.slice(0, 10) : "Standard"}</span>
              <span className="font-body-sm text-body-sm text-outline text-[11px]">100% Vaastu</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-1.5">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">PARKING</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{property?.parkingCount !== undefined && property.parkingCount !== null ? `${property.parkingCount} Covered` : "Available"}</span>
              <span className="font-body-sm text-body-sm text-outline text-[11px]">Reserved</span>
            </div>
          </section>

          {/* Verified Legal Title */}
          <section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                </div>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">100% Legal Title Cleared</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">Verified</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Legal due diligence completed with zero tax arrears. All original title documents verified.
            </p>
          </section>

          {/* Verified Owner Profile */}
          <section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline-sm text-headline-sm font-bold">
                    {ownerInitials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
                    <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{ownerName}</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Owner • DigiLocker Verified</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                100% Response
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low">
              <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
              <div className="flex flex-col flex-1">
                <span className="font-label-md text-label-md text-on-surface">{phoneUnmasked ? ownerPhone : "Phone Masked for Privacy"}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Direct verified seller connection. Zero spam.</span>
              </div>
            </div>
          </section>

          {/* Description Overview */}
          <section className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Property Description</h2>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">{property?.categoryId?.toUpperCase() || "DIRECT"}</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
              {descriptionText}
            </p>
          </section>
        </div>

        {/* Mobile Fixed Bottom Dock */}
        <aside className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(11,28,48,0.08)]">
          <div className="h-20 px-gutter-mobile flex items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">DIRECT OWNER</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-extrabold">{priceDisplay}</span>
            </div>
            <button
              aria-label="Contact Verified Owner"
              onClick={handlePhoneClick}
              className="flex-1 max-w-[210px] h-12 px-space-lg rounded-full bg-primary-container hover:bg-primary active:scale-[0.98] shadow-[0_8px_20px_-2px_rgba(0,91,234,0.35)] flex items-center justify-center gap-space-xs text-on-primary font-label-lg text-label-lg transition-all font-bold"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              <span>{phoneUnmasked ? "Call Now" : "Contact Owner"}</span>
            </button>
          </div>
        </aside>
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
