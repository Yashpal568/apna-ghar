"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchApi } from "../utils/api";

export type Property = {
  _id: string;
  slug?: string;
  title: string;
  description: string;
  listingType: "sale" | "rent";
  priceAmount: number;
  currency?: string;
  categoryId: string;
  location: { city: string; state: string; locality?: string; addressText?: string };
  areaValue: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  imageUrls?: string[];
  contactPhone?: string;
  furnishing?: string;
  status?: string;
};

type Result = {
  items: Property[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

const CATEGORY_MAP: Record<string, string> = {
  apartment: "Apartment",
  apartments: "Apartment",
  house: "Independent House",
  houses: "Independent House",
  villa: "Luxury Villa",
  villas: "Luxury Villa",
  plot: "Residential Plot",
  plots: "Residential Plot",
  commercial: "Commercial Space",
  pg: "PG & Co-Living",
  "6ae3438b927d87c0475f2369": "Apartment",
  "6ae3438b927d87c0475f236a": "Independent House",
  "6ae3438b927d87c0475f236b": "Luxury Villa",
  "6ae3438b927d87c0475f236c": "Residential Plot",
  "6ae3438b927d87c0475f236d": "Commercial Space",
  "6ae3438b927d87c0475f236e": "PG & Co-Living",
};

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  apartment: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80",
  house: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  villa: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80",
  plot: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
  commercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
  pg: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
  default: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
};

export function getFallbackImage(categoryId?: string): string {
  if (!categoryId) return CATEGORY_FALLBACK_IMAGES.default;
  const lower = categoryId.toLowerCase();
  if (lower.includes("plot") || lower === "6ae3438b927d87c0475f236c") return CATEGORY_FALLBACK_IMAGES.plot;
  if (lower.includes("commercial") || lower === "6ae3438b927d87c0475f236d") return CATEGORY_FALLBACK_IMAGES.commercial;
  if (lower.includes("villa") || lower === "6ae3438b927d87c0475f236b") return CATEGORY_FALLBACK_IMAGES.villa;
  if (lower.includes("house") || lower === "6ae3438b927d87c0475f236a") return CATEGORY_FALLBACK_IMAGES.house;
  if (lower.includes("apartment") || lower.includes("flat") || lower === "6ae3438b927d87c0475f2369")
    return CATEGORY_FALLBACK_IMAGES.apartment;
  if (lower.includes("pg") || lower === "6ae3438b927d87c0475f236e") return CATEGORY_FALLBACK_IMAGES.pg;
  return CATEGORY_FALLBACK_IMAGES.default;
}

export function formatIndianPrice(amount: number, listingType?: string): string {
  if (!amount || isNaN(amount) || amount <= 0) return "Price on Request";
  let formatted = "";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    formatted = `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, "")} Cr`;
  } else if (amount >= 100000) {
    const lakh = amount / 100000;
    formatted = `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2).replace(/\.?0+$/, "")} L`;
  } else {
    formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return listingType === "rent" ? `${formatted} / mo` : formatted;
}

export function sanitizePropertyTitle(
  title?: string,
  categoryId?: string,
  location?: { locality?: string; city?: string; state?: string }
): string {
  const clean = title?.trim();
  const isInvalid = !clean || clean === "0" || clean.toLowerCase() === "null" || clean.toLowerCase() === "undefined";
  if (!isInvalid) {
    return clean;
  }
  const cat = CATEGORY_MAP[categoryId?.toLowerCase() || ""] || CATEGORY_MAP[categoryId || ""] || "Verified Property";
  const locParts = [location?.locality, location?.city].filter(Boolean);
  const loc = locParts.length > 0 ? locParts.join(", ") : location?.state || "Prime Location";
  return `${cat} in ${loc}`;
}

const normalizeCategory = (cat?: string): string | undefined => {
  if (!cat || cat === "all" || cat === "all property types" || cat === "any") return undefined;
  if (cat === "apartments") return "apartment";
  if (cat === "houses") return "house";
  if (cat === "plots") return "plot";
  if (cat === "villas") return "villa";
  return cat;
};

function toggleSavedProperty(property: Property): boolean {
  try {
    const existing = JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[];
    const isSaved = existing.some((item) => item._id === property._id);
    const next = isSaved ? existing.filter((item) => item._id !== property._id) : [property, ...existing];
    localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(next));
    window.dispatchEvent(new Event("apna-ghar-saved-change"));
    return !isSaved;
  } catch {
    return false;
  }
}

export type PropertySearchResultsProps = {
  location?: string;
  transaction?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  minBedrooms?: string;
  minBathrooms?: string;
  furnishing?: string;
  initialSort?: string;
};

export default function PropertySearchResults({
  location: propLocation = "",
  transaction: propTransaction = "all",
  category: propCategory = "",
  minPrice: propMinPrice = "",
  maxPrice: propMaxPrice = "",
  minBedrooms: propMinBedrooms = "",
  minBathrooms: propMinBathrooms = "",
  furnishing: propFurnishing = "",
  initialSort = "newest",
}: PropertySearchResultsProps) {
  // Filter form state
  const [locationInput, setLocationInput] = useState(propLocation);
  const [transactionState, setTransactionState] = useState(propTransaction);
  const [categoryState, setCategoryState] = useState(propCategory);
  const [minPriceState, setMinPriceState] = useState(propMinPrice);
  const [maxPriceState, setMaxPriceState] = useState(propMaxPrice);
  const [minBedroomsState, setMinBedroomsState] = useState(propMinBedrooms);
  const [minBathroomsState, setMinBathroomsState] = useState(propMinBathrooms);
  const [furnishingState, setFurnishingState] = useState(propFurnishing);

  // Active query parameters currently fetched
  const [activeParams, setActiveParams] = useState({
    location: propLocation,
    transaction: propTransaction,
    category: propCategory,
    minPrice: propMinPrice,
    maxPrice: propMaxPrice,
    minBedrooms: propMinBedrooms,
    minBathrooms: propMinBathrooms,
    furnishing: propFurnishing,
  });

  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">(
    initialSort === "price_asc" || initialSort === "price_desc" ? initialSort : "newest"
  );
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedNotice, setSavedNotice] = useState("");
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  const { isSignedIn, getToken } = useAuth();
  const [, startTransition] = useTransition();

  // Sync with prop changes if Next.js performs navigation (e.g. clicking top navbar links)
  useEffect(() => {
    setLocationInput(propLocation);
    setTransactionState(propTransaction);
    setCategoryState(propCategory);
    setMinPriceState(propMinPrice);
    setMaxPriceState(propMaxPrice);
    setMinBedroomsState(propMinBedrooms);
    setMinBathroomsState(propMinBathrooms);
    setFurnishingState(propFurnishing);
    setActiveParams({
      location: propLocation,
      transaction: propTransaction,
      category: propCategory,
      minPrice: propMinPrice,
      maxPrice: propMaxPrice,
      minBedrooms: propMinBedrooms,
      minBathrooms: propMinBathrooms,
      furnishing: propFurnishing,
    });
    setPage(1);
  }, [
    propLocation,
    propTransaction,
    propCategory,
    propMinPrice,
    propMaxPrice,
    propMinBedrooms,
    propMinBathrooms,
    propFurnishing,
  ]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const loc = sp.get("location") || "";
      const rawTx = (sp.get("transaction") || "").toLowerCase();
      const tx = rawTx === "rent" ? "rent" : rawTx === "buy" || rawTx === "sale" ? "buy" : "all";
      const cat = sp.get("type") || sp.get("categoryId") || "";
      const minP = sp.get("minPrice") || "";
      const maxP = sp.get("maxPrice") || "";
      const beds = sp.get("minBedrooms") || "";
      const baths = sp.get("minBathrooms") || "";
      const furn = sp.get("furnishing") || "";
      const s = (sp.get("sort") as typeof sort) || "newest";
      const p = Number(sp.get("page")) || 1;

      setLocationInput(loc);
      setTransactionState(tx);
      setCategoryState(cat);
      setMinPriceState(minP);
      setMaxPriceState(maxP);
      setMinBedroomsState(beds);
      setMinBathroomsState(baths);
      setFurnishingState(furn);
      setSort(s === "price_asc" || s === "price_desc" ? s : "newest");
      setPage(p);
      setActiveParams({
        location: loc,
        transaction: tx,
        category: cat,
        minPrice: minP,
        maxPrice: maxP,
        minBedrooms: beds,
        minBathrooms: baths,
        furnishing: furn,
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update browser URL query string without full page reload
  const updateUrlHistory = (
    nextParams: typeof activeParams,
    nextSort: string,
    nextPage: number
  ) => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams();
    if (nextParams.location.trim()) sp.set("location", nextParams.location.trim());
    if (nextParams.transaction && nextParams.transaction !== "all") sp.set("transaction", nextParams.transaction);
    if (nextParams.category && nextParams.category !== "all") sp.set("type", nextParams.category);
    if (nextParams.minPrice) sp.set("minPrice", nextParams.minPrice);
    if (nextParams.maxPrice) sp.set("maxPrice", nextParams.maxPrice);
    if (nextParams.minBedrooms) sp.set("minBedrooms", nextParams.minBedrooms);
    if (nextParams.minBathrooms) sp.set("minBathrooms", nextParams.minBathrooms);
    if (nextParams.furnishing) sp.set("furnishing", nextParams.furnishing);
    if (nextSort && nextSort !== "newest") sp.set("sort", nextSort);
    if (nextPage > 1) sp.set("page", String(nextPage));

    const qs = sp.toString();
    const nextUrl = qs ? `/search?${qs}` : "/search";
    window.history.pushState({}, "", nextUrl);
  };

  // Form submit handler
  const handleFilterSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const next = {
      location: locationInput.trim(),
      transaction: transactionState,
      category: categoryState,
      minPrice: minPriceState,
      maxPrice: maxPriceState,
      minBedrooms: minBedroomsState,
      minBathrooms: minBathroomsState,
      furnishing: furnishingState,
    };
    setActiveParams(next);
    setPage(1);
    updateUrlHistory(next, sort, 1);
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setLocationInput("");
    setTransactionState("all");
    setCategoryState("");
    setMinPriceState("");
    setMaxPriceState("");
    setMinBedroomsState("");
    setMinBathroomsState("");
    setFurnishingState("");
    const resetValues = {
      location: "",
      transaction: "all",
      category: "",
      minPrice: "",
      maxPrice: "",
      minBedrooms: "",
      minBathrooms: "",
      furnishing: "",
    };
    setActiveParams(resetValues);
    setPage(1);
    updateUrlHistory(resetValues, sort, 1);
  };

  // Remove individual filter chip
  const removeFilterChip = (key: keyof typeof activeParams) => {
    const updated = { ...activeParams };
    if (key === "transaction") {
      updated.transaction = "all";
      setTransactionState("all");
    } else if (key === "location") {
      updated.location = "";
      setLocationInput("");
    } else if (key === "category") {
      updated.category = "";
      setCategoryState("");
    } else if (key === "minPrice") {
      updated.minPrice = "";
      setMinPriceState("");
    } else if (key === "maxPrice") {
      updated.maxPrice = "";
      setMaxPriceState("");
    } else if (key === "minBedrooms") {
      updated.minBedrooms = "";
      setMinBedroomsState("");
    } else if (key === "minBathrooms") {
      updated.minBathrooms = "";
      setMinBathroomsState("");
    } else if (key === "furnishing") {
      updated.furnishing = "";
      setFurnishingState("");
    }
    setActiveParams(updated);
    setPage(1);
    updateUrlHistory(updated, sort, 1);
  };

  // Saved properties sync with Clerk auth & localStorage
  useEffect(() => {
    let cancelled = false;
    const refreshSaved = () => {
      try {
        const stored = (JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[]).map(
          (item) => item._id
        );
        setSavedIds(stored);
      } catch {
        setSavedIds([]);
      }
    };
    refreshSaved();

    if (isSignedIn) {
      void (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const response = await fetchApi("/saved-properties", {
            headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          });
          if (!response.ok) return;
          const serverHomes = (await response.json()) as Property[];
          if (cancelled || !Array.isArray(serverHomes)) return;
          const localHomes = (() => {
            try {
              return JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]") as Property[];
            } catch {
              return [];
            }
          })();
          const merged = [
            ...serverHomes,
            ...localHomes.filter((home) => !serverHomes.some((serverHome) => serverHome._id === home._id)),
          ];
          setSavedIds(merged.map((item) => item._id));
          localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(merged));
        } catch {
          // Local saved state remains available offline
        }
      })();
    }
    window.addEventListener("apna-ghar-saved-change", refreshSaved);
    window.addEventListener("storage", refreshSaved);
    return () => {
      cancelled = true;
      window.removeEventListener("apna-ghar-saved-change", refreshSaved);
      window.removeEventListener("storage", refreshSaved);
    };
  }, [getToken, isSignedIn]);

  // Save / Unsave action
  async function changeSaved(property: Property, isSaved: boolean) {
    if (!isSignedIn) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/sign-in?redirect_url=${redirectUrl}`);
      return;
    }
    const nextSaved = !isSaved;
    const changed = toggleSavedProperty(property);
    if (changed !== nextSaved) {
      setSavedNotice("Could not update saved homes on this device.");
      return;
    }
    setSavedIds((ids) =>
      nextSaved ? [property._id, ...ids.filter((id) => id !== property._id)] : ids.filter((id) => id !== property._id)
    );
    setSavedNotice("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Your session is not ready. Sign in again.");
      const response = await fetchApi(`/saved-properties/${encodeURIComponent(property._id)}`, {
        method: nextSaved ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session expired. Sign in again."
            : "Account sync failed. Saved on this device."
        );
      }
      setSavedNotice(nextSaved ? "Property saved to your account." : "Property removed from saved homes.");
    } catch (error) {
      setSavedNotice(error instanceof Error ? error.message : "Account sync failed. Saved on device.");
    }
  }

  // Chat with owner
  async function contactOwner(property: Property) {
    if (!isSignedIn) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/sign-in?redirect_url=${redirectUrl}`);
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again to contact the owner.");
      const response = await fetchApi("/conversations/property/" + encodeURIComponent(property._id), {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.message === "string" ? body.message : "Could not open this conversation.");
      }
      window.location.assign("/messages?conversation=" + encodeURIComponent(body.conversationId));
    } catch (error) {
      setSavedNotice(error instanceof Error ? error.message : "Could not initiate chat with owner.");
    }
  }

  // Fetch properties from backend API
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        sort,
      });

      if (activeParams.location.trim()) {
        params.set("q", activeParams.location.trim());
      }
      if (activeParams.minPrice && Number(activeParams.minPrice) >= 0) {
        params.set("minPrice", activeParams.minPrice);
      }
      if (activeParams.maxPrice && Number(activeParams.maxPrice) >= 0) {
        params.set("maxPrice", activeParams.maxPrice);
      }
      if (activeParams.minBedrooms && Number(activeParams.minBedrooms) >= 0) {
        params.set("minBedrooms", activeParams.minBedrooms);
      }
      if (activeParams.minBathrooms && Number(activeParams.minBathrooms) >= 0) {
        params.set("minBathrooms", activeParams.minBathrooms);
      }
      if (activeParams.furnishing) {
        params.set("furnishing", activeParams.furnishing);
      }
      if (
        activeParams.transaction === "rent" ||
        activeParams.transaction === "sale" ||
        activeParams.transaction === "buy"
      ) {
        params.set("listingType", activeParams.transaction === "buy" ? "sale" : activeParams.transaction);
      }
      const normalizedCat = normalizeCategory(activeParams.category);
      if (normalizedCat) {
        params.set("categoryId", normalizedCat);
      }

      try {
        const response = await fetchApi(`/properties?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Property search failed (${response.status}).`);
        }
        const data = (await response.json()) as Result;
        setResult(data);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError("We couldn't connect to live listings. Check your connection or retry.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [activeParams, page, sort]);

  // Calculate active filter count & chips
  const activeChips: { key: keyof typeof activeParams; label: string }[] = [];
  if (activeParams.location.trim()) {
    activeChips.push({ key: "location", label: `📍 ${activeParams.location.trim()}` });
  }
  if (activeParams.transaction && activeParams.transaction !== "all") {
    activeChips.push({
      key: "transaction",
      label: activeParams.transaction === "rent" ? "🔑 For Rent" : "🏷 For Sale",
    });
  }
  if (activeParams.category && activeParams.category !== "all") {
    const catName = CATEGORY_MAP[activeParams.category.toLowerCase()] || activeParams.category;
    activeChips.push({ key: "category", label: `🏠 ${catName}` });
  }
  if (activeParams.minPrice) {
    activeChips.push({
      key: "minPrice",
      label: `Min: ₹${Number(activeParams.minPrice).toLocaleString("en-IN")}`,
    });
  }
  if (activeParams.maxPrice) {
    activeChips.push({
      key: "maxPrice",
      label: `Max: ₹${Number(activeParams.maxPrice).toLocaleString("en-IN")}`,
    });
  }
  if (activeParams.minBedrooms) {
    activeChips.push({ key: "minBedrooms", label: `🛏 ${activeParams.minBedrooms}+ BHK` });
  }
  if (activeParams.minBathrooms) {
    activeChips.push({ key: "minBathrooms", label: `🚿 ${activeParams.minBathrooms}+ Bath` });
  }
  if (activeParams.furnishing) {
    activeChips.push({ key: "furnishing", label: `🛋 ${activeParams.furnishing}` });
  }

  // Price validation warning
  const priceValidationWarning =
    Boolean(minPriceState) &&
    Boolean(maxPriceState) &&
    Number(minPriceState) > Number(maxPriceState)
      ? "Min price cannot be greater than Max price."
      : null;

  return (
    <section className="agh-discovery-container" aria-live="polite">
      {/* 1. Complete Responsive Search & Filter Bar */}
      <div className="agh-filter-wrapper">
        <form className="agh-filter-card" onSubmit={handleFilterSubmit}>
          <div className="agh-filter-grid">
            {/* Location */}
            <div className="agh-filter-field agh-filter-field-location">
              <label htmlFor="search-filter-location">Location</label>
              <div className="agh-input-with-icon">
                <span className="agh-input-icon" aria-hidden="true">📍</span>
                <input
                  id="search-filter-location"
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="City, locality, project or landmark…"
                  aria-label="Location search"
                />
              </div>
            </div>

            {/* Looking to (Buy / Rent / All) */}
            <div className="agh-filter-field">
              <label htmlFor="search-filter-transaction">Looking to</label>
              <select
                id="search-filter-transaction"
                value={transactionState}
                onChange={(e) => setTransactionState(e.target.value)}
                aria-label="Transaction type"
              >
                <option value="all">All (Buy &amp; Rent)</option>
                <option value="buy">Buy (For Sale)</option>
                <option value="rent">Rent (For Lease)</option>
              </select>
            </div>

            {/* Property type */}
            <div className="agh-filter-field">
              <label htmlFor="search-filter-type">Property type</label>
              <select
                id="search-filter-type"
                value={categoryState}
                onChange={(e) => setCategoryState(e.target.value)}
                aria-label="Property type"
              >
                <option value="">All property types</option>
                <option value="apartment">Apartment / Flat</option>
                <option value="house">Independent House</option>
                <option value="villa">Luxury Villa</option>
                <option value="plot">Plot / Land</option>
                <option value="commercial">Commercial Property</option>
                <option value="pg">PG &amp; Co-Living</option>
              </select>
            </div>

            {/* Price Min */}
            <div className="agh-filter-field">
              <label htmlFor="search-filter-minprice">Min price (₹)</label>
              <input
                id="search-filter-minprice"
                type="number"
                min="0"
                step="50000"
                inputMode="numeric"
                value={minPriceState}
                onChange={(e) => setMinPriceState(e.target.value)}
                placeholder="No min"
                aria-label="Minimum price in Rupees"
              />
            </div>

            {/* Price Max */}
            <div className="agh-filter-field">
              <label htmlFor="search-filter-maxprice">Max price (₹)</label>
              <input
                id="search-filter-maxprice"
                type="number"
                min="0"
                step="50000"
                inputMode="numeric"
                value={maxPriceState}
                onChange={(e) => setMaxPriceState(e.target.value)}
                placeholder="No max"
                aria-label="Maximum price in Rupees"
              />
            </div>

            {/* Bedrooms */}
            <div className="agh-filter-field">
              <label htmlFor="search-filter-bedrooms">Bedrooms</label>
              <select
                id="search-filter-bedrooms"
                value={minBedroomsState}
                onChange={(e) => setMinBedroomsState(e.target.value)}
                aria-label="Bedrooms filter"
              >
                <option value="">Any bedrooms</option>
                <option value="1">1+ BHK</option>
                <option value="2">2+ BHK</option>
                <option value="3">3+ BHK</option>
                <option value="4">4+ BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div className="agh-filter-field">
              <label htmlFor="search-filter-bathrooms">Bathrooms</label>
              <select
                id="search-filter-bathrooms"
                value={minBathroomsState}
                onChange={(e) => setMinBathroomsState(e.target.value)}
                aria-label="Bathrooms filter"
              >
                <option value="">Any bathrooms</option>
                <option value="1">1+ Bath</option>
                <option value="2">2+ Baths</option>
                <option value="3">3+ Baths</option>
                <option value="4">4+ Baths</option>
              </select>
            </div>

            {/* Furnishing */}
            <div className="agh-filter-field">
              <label htmlFor="search-filter-furnishing">Furnishing</label>
              <select
                id="search-filter-furnishing"
                value={furnishingState}
                onChange={(e) => setFurnishingState(e.target.value)}
                aria-label="Furnishing status"
              >
                <option value="">Any furnishing</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>

          {/* Price validation note */}
          {priceValidationWarning && (
            <div className="agh-filter-warning" role="alert">
              <span>⚠️</span> {priceValidationWarning}
            </div>
          )}

          {/* Form Actions */}
          <div className="agh-filter-actions">
            <button
              type="button"
              className="button button-outline agh-filter-reset-btn"
              onClick={handleResetFilters}
            >
              ↺ Reset filters
            </button>
            <button
              type="submit"
              className="button button-primary agh-filter-submit-btn"
              disabled={Boolean(priceValidationWarning)}
            >
              Update search ↗
            </button>
          </div>
        </form>

        {/* 2. Active Filter Chips with Remove Triggers */}
        {activeChips.length > 0 && (
          <div className="agh-filter-chips-row" aria-label="Active filters">
            <span className="agh-filter-chips-label">Active filters:</span>
            <div className="agh-filter-chips-list">
              {activeChips.map((chip) => (
                <button
                  type="button"
                  key={chip.key}
                  className="agh-filter-chip"
                  onClick={() => removeFilterChip(chip.key)}
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  <span>{chip.label}</span>
                  <span className="agh-filter-chip-remove" aria-hidden="true">
                    ×
                  </span>
                </button>
              ))}
              {activeChips.length >= 2 && (
                <button
                  type="button"
                  className="agh-filter-chip-clear-all"
                  onClick={handleResetFilters}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notice bar for save/unsave feedback */}
      {savedNotice && (
        <div className="form-notice agh-notice-banner" role="status">
          <span>ℹ</span>
          <p>{savedNotice}</p>
          <button type="button" onClick={() => setSavedNotice("")} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      )}

      {/* Modal notice for masked phone connect */}
      {modalNotice && (
        <div className="agh-modal-backdrop" onClick={() => setModalNotice(null)}>
          <div className="agh-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="agh-modal-header">
              <h3>Direct Owner Connect</h3>
              <button type="button" onClick={() => setModalNotice(null)} aria-label="Close dialog">
                ×
              </button>
            </div>
            <div className="agh-modal-body">
              <p>{modalNotice}</p>
            </div>
            <div className="agh-modal-footer">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setModalNotice(null)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Results Toolbar & Sort Control */}
      <div className="results-toolbar agh-results-toolbar">
        <div>
          <h2>Available Properties</h2>
          <p>
            {loading ? (
              "Finding verified direct owner listings…"
            ) : (
              <>
                <strong>{result?.pagination.total ?? 0}</strong> verified listing
                {(result?.pagination.total ?? 0) === 1 ? "" : "s"} · Direct from owners
              </>
            )}
          </p>
        </div>
        <div className="results-toolbar-actions">
          <label className="sort-control">
            <span>Sort by:</span>
            <select
              aria-label="Sort properties"
              value={sort}
              onChange={(event) => {
                const nextSort = event.target.value as typeof sort;
                setSort(nextSort);
                setPage(1);
                updateUrlHistory(activeParams, nextSort, 1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
            </select>
          </label>
          <a className="text-link agh-saved-counter-link" href="/saved">
            ♥ Saved homes ({savedIds.length})
          </a>
        </div>
      </div>

      {/* 4. Loading State with Modern Shimmer Skeletons */}
      {loading ? (
        <div className="property-results-grid" aria-label="Loading properties">
          {Array.from({ length: 6 }, (_, index) => (
            <article className="property-result-card skeleton-card" key={index} aria-hidden="true">
              <div className="skeleton skeleton-image" />
              <div className="property-result-body">
                <div className="skeleton skeleton-copy skeleton-short" />
                <div className="skeleton skeleton-heading" />
                <div className="skeleton skeleton-price" />
                <div className="skeleton skeleton-copy" />
              </div>
              <div className="property-card-actions" style={{ padding: "0 16px 16px" }}>
                <div className="skeleton skeleton-action" />
                <div className="skeleton skeleton-action" />
              </div>
            </article>
          ))}
        </div>
      ) : error ? (
        /* 5. Error State with Friendly Retry */
        <div className="search-empty" role="alert">
          <div className="empty-illustration">
            <span>⚠️</span>
          </div>
          <h2>Listings temporarily unavailable</h2>
          <p>{error}</p>
          <button
            className="button button-primary"
            onClick={() => {
              setLoading(true);
              setError("");
              setActiveParams({ ...activeParams });
            }}
            type="button"
          >
            Retry search
          </button>
        </div>
      ) : !result?.items.length ? (
        /* 6. Empty State with Clear Suggestions & Reset Action */
        <div className="search-empty">
          <div className="empty-illustration">
            <span>⌂</span>
            <span>⌕</span>
          </div>
          <h2>No matching properties found</h2>
          <p>
            We couldn't find any verified listings matching your specific criteria. Try broadening your
            budget, selecting all property types, or resetting your filters.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="button button-outline" type="button" onClick={handleResetFilters}>
              Reset all filters ↺
            </button>
            <a className="button button-primary" href="/list-property">
              Post your property ＋
            </a>
          </div>
          <a className="text-link" href="/" style={{ marginTop: "16px", display: "inline-block" }}>
            ← Back to home
          </a>
        </div>
      ) : (
        /* 7. Redesigned Property Listing Cards Grid */
        <>
          <div className="property-results-grid">
            {result.items.map((property) => {
              const isSaved = savedIds.includes(property._id);
              const fallbackImage = getFallbackImage(property.categoryId);
              const primaryImage =
                property.imageUrls && property.imageUrls.length > 0 && property.imageUrls[0]?.trim()
                  ? property.imageUrls[0].trim()
                  : fallbackImage;
              const displayTitle = sanitizePropertyTitle(
                property.title,
                property.categoryId,
                property.location
              );
              const priceText = formatIndianPrice(property.priceAmount, property.listingType);
              const categoryLabel =
                CATEGORY_MAP[property.categoryId?.toLowerCase()] ||
                CATEGORY_MAP[property.categoryId] ||
                "Residential";

              const locationText = [
                property.location?.locality,
                property.location?.city,
                property.location?.state,
              ]
                .filter(Boolean)
                .join(", ") || "India";

              const detailHref = `/property/${encodeURIComponent(property.slug || property._id)}`;

              return (
                <article className="property-result-card agh-property-card" key={property._id}>
                  {/* Top Clickable Card Anchor */}
                  <a className="property-result-link" href={detailHref}>
                    {/* Image with Badges & Error Handling */}
                    <div className="property-result-image agh-card-image-wrap">
                      <img
                        src={primaryImage}
                        alt={displayTitle}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== fallbackImage) {
                            target.src = fallbackImage;
                          }
                        }}
                      />
                      {/* Transaction Badge */}
                      <span
                        className={`property-result-badge agh-badge-tx ${
                          property.listingType === "rent" ? "is-rent" : "is-sale"
                        }`}
                      >
                        {property.listingType === "rent" ? "FOR RENT" : "FOR SALE"}
                      </span>

                      {/* Direct Owner Zero Commission Badge */}
                      <span className="agh-badge-verified">✓ Direct Owner · 0% Fee</span>
                    </div>

                    {/* Card Body */}
                    <div className="property-result-body">
                      {/* Location */}
                      <p className="property-result-location">
                        <span aria-hidden="true">📍 </span>
                        {locationText}
                      </p>

                      {/* Title (Sanitized - Never displays "0") */}
                      <h3 title={displayTitle}>{displayTitle}</h3>

                      {/* Formatted Indian Price */}
                      <p className="property-result-price">{priceText}</p>

                      {/* Spec Chips / Facts */}
                      <div className="agh-card-specs">
                        <span className="agh-spec-chip agh-spec-category">{categoryLabel}</span>
                        {property.bedrooms ? (
                          <span className="agh-spec-chip">
                            <strong>{property.bedrooms}</strong> BHK
                          </span>
                        ) : null}
                        {property.bathrooms ? (
                          <span className="agh-spec-chip">
                            <strong>{property.bathrooms}</strong> Bath{property.bathrooms > 1 ? "s" : ""}
                          </span>
                        ) : null}
                        {property.areaValue ? (
                          <span className="agh-spec-chip">
                            {property.areaValue.toLocaleString("en-IN")} {property.areaUnit || "sq.ft"}
                          </span>
                        ) : null}
                        {property.furnishing ? (
                          <span className="agh-spec-chip" style={{ textTransform: "capitalize" }}>
                            {property.furnishing}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </a>

                  {/* Working Card Actions */}
                  <div className="property-card-actions agh-card-actions">
                    <button
                      className={`button button-outline property-save-button agh-card-save-btn ${
                        isSaved ? "is-saved" : ""
                      }`}
                      type="button"
                      aria-pressed={isSaved}
                      onClick={(e) => {
                        e.stopPropagation();
                        void changeSaved(property, isSaved);
                      }}
                    >
                      {isSaved ? "♥ Saved" : "♡ Save home"}
                    </button>

                    {property.contactPhone?.trim() ? (
                      <a
                        className="button button-outline agh-card-call-btn"
                        href={`tel:${property.contactPhone.replace(/[^+0-9]/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        ☎ Call owner
                      </a>
                    ) : (
                      <button
                        className="button button-outline agh-card-call-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalNotice(
                            "Direct phone numbers remain masked until mutual token verification under Apna Ghar Escrow guidelines. You can message the owner directly using the 'Chat Owner' button to schedule a site visit or request documents."
                          );
                        }}
                      >
                        ☎ Call owner
                      </button>
                    )}

                    <button
                      className="button button-primary agh-card-chat-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void contactOwner(property);
                      }}
                    >
                      💬 Chat owner
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 8. Server-Side Pagination Controls */}
          {result.pagination.pages > 1 && (
            <nav className="results-pagination agh-pagination" aria-label="Property result pages">
              <button
                className="button button-outline"
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const prevPage = Math.max(1, page - 1);
                  setPage(prevPage);
                  updateUrlHistory(activeParams, sort, prevPage);
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
              >
                ← Previous
              </button>
              <span aria-live="polite">
                Page <strong>{result.pagination.page}</strong> of{" "}
                <strong>{result.pagination.pages}</strong>
              </span>
              <button
                className="button button-outline"
                type="button"
                disabled={page >= result.pagination.pages}
                onClick={() => {
                  const nextPage = Math.min(result.pagination.pages, page + 1);
                  setPage(nextPage);
                  updateUrlHistory(activeParams, sort, nextPage);
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
