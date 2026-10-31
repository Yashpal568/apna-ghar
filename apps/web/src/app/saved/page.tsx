"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import SiteFooter from "../components/SiteFooter";

type Home = {
  _id: string;
  slug?: string;
  title: string;
  description?: string;
  listingType: "sale" | "rent";
  priceAmount: number;
  areaValue: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  imageUrls?: string[];
  location?: { city?: string; state?: string; locality?: string };
};

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function readLocalHomes(): Home[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("apna-ghar-saved-homes") || "[]");
    return Array.isArray(value) ? value.filter((item): item is Home => Boolean(item && typeof item._id === "string" && typeof item.title === "string")) : [];
  } catch {
    return [];
  }
}

export default function SavedPage() {
  const { isSignedIn, getToken } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [removingId, setRemovingId] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const localHomes = readLocalHomes();
    setHomes(localHomes);
    setNotice("");
    if (!isSignedIn) {
      setReady(true);
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("Your session is not ready. Sign in again.");
      // Migrate device-saved homes to the signed-in account before loading the canonical server list.
      for (const home of localHomes) {
        if (signal?.aborted) return;
        await fetch(`${apiBase}/saved-properties/${encodeURIComponent(home._id)}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal,
        }).catch(() => undefined);
      }
      const response = await fetch(`${apiBase}/saved-properties`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal,
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : "Could not sync saved homes. Your device list is still available.");
      const serverHomes = await response.json() as Home[];
      if (signal?.aborted) return;
      const merged = Array.isArray(serverHomes) ? serverHomes : [];
      setHomes(merged);
      localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(merged));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNotice(error instanceof Error ? error.message : "Saved homes could not be synced. Your device list is still available.");
    } finally {
      if (!signal?.aborted) setReady(true);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = () => { void load(); };
    window.addEventListener("apna-ghar-saved-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("apna-ghar-saved-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [load]);

  const remove = async (home: Home) => {
    const previous = homes;
    const next = homes.filter((item) => item._id !== home._id);
    setHomes(next);
    setNotice("");
    setRemovingId(home._id);
    localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(next));
    window.dispatchEvent(new Event("apna-ghar-saved-change"));
    try {
      if (isSignedIn) {
        const token = await getToken();
        if (!token) throw new Error("Your session expired. Please sign in again.");
        const response = await fetch(`${apiBase}/saved-properties/${encodeURIComponent(home._id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Could not remove this saved home from your account.");
      }
    } catch (error) {
      setHomes(previous);
      localStorage.setItem("apna-ghar-saved-homes", JSON.stringify(previous));
      setNotice(error instanceof Error ? error.message : "Could not remove this home.");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <main className="page-shell interior-page">
      
      <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>Saved homes</span></div>
      <section className="listing-intro">
        <p className="eyebrow">YOUR SHORTLIST</p>
        <h1>Places worth<br /><em>coming back to.</em></h1>
        <p>Keep your favourite properties together while you compare.</p>
      </section>
      {notice && <p className="form-notice" role="status">{notice}</p>}
      {!ready ? (
        <div className="search-empty" role="status"><h2>Loading saved homes…</h2><p>Checking this device and your account.</p></div>
      ) : homes.length === 0 ? (
        <div className="search-empty">
          <div className="empty-illustration"><span>⌂</span><span>♡</span></div>
          <h2>Your shortlist starts here</h2>
          <p>Save properties from search results and they’ll appear here. Sign in to sync them across devices.</p>
          <a className="button button-primary" href="/search">Explore properties ↗</a>
        </div>
      ) : (
        <>
          <div className="results-toolbar">
            <div><h2>Saved properties</h2><p>{homes.length} saved home{homes.length === 1 ? "" : "s"}{isSignedIn ? " · synced to your account when available" : " · stored on this device"}</p></div>
            <a className="text-link" href="/search">Find more homes ↗</a>
          </div>
          <div className="property-results-grid">
            {homes.map((home) => (
              <article className="property-result-card" key={home._id}>
                <div className="property-result-link">
                  <div className="property-result-image">{home.imageUrls?.[0] ? <img src={home.imageUrls[0]} alt="" loading="lazy" /> : <span aria-hidden="true">⌂</span>}<span className="property-result-badge">{home.listingType === "rent" ? "FOR RENT" : "FOR SALE"}</span></div>
                  <div className="property-result-body">
                    <p className="property-result-location">{[home.location?.locality, home.location?.city, home.location?.state].filter(Boolean).join(", ")}</p>
                    <h3>{home.title}</h3>
                    <p className="property-result-price">{money(home.priceAmount)}{home.listingType === "rent" ? " / month" : ""}</p>
                    <p className="property-result-facts">{home.bedrooms ? home.bedrooms + " beds · " : ""}{home.bathrooms ? home.bathrooms + " baths · " : ""}{home.areaValue} {home.areaUnit}</p>
                  </div>
                </div>
                <button className="button button-outline saved-toggle" type="button" disabled={removingId === home._id} onClick={() => void remove(home)}>{removingId === home._id ? "Removing…" : "Remove from saved"}</button>
              </article>
            ))}
          </div>
        </>
      )}
      <SiteFooter />
    </main>
  );
}
