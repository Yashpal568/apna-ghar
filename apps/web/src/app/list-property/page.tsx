"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

type Draft = {
  purpose: "sale" | "rent";
  type: string;
  title: string;
  state: string;
  city: string;
  locality: string;
  price: string;
  area: string;
  beds: string;
  baths: string;
  description: string;
  name: string;
  phone: string;
  email: string;
  photos: string;
};

const initialDraft: Draft = {
  purpose: "sale",
  type: "",
  title: "",
  state: "",
  city: "",
  locality: "",
  price: "",
  area: "",
  beds: "",
  baths: "",
  description: "",
  name: "",
  phone: "",
  email: "",
  photos: "",
};

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

function ListingForm() {
  const { getToken } = useAuth();
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [step, setStep] = useState(1);
  const [notice, setNotice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const update = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
  };

  const uploadPhotos = async (fileList: FileList | null) => {
    const selected = Array.from(fileList ?? []);
    if (!selected.length) return;
    if (selected.length + photos.length > 10) {
      setNotice("You can add up to 10 property photos.");
      return;
    }
    const invalid = selected.find((file) => !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 8 * 1024 * 1024);
    if (invalid) {
      setNotice("Choose JPEG, PNG, WebP or AVIF images under 8 MB each.");
      return;
    }
    setUploadingImages(true);
    setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in before uploading property photos.");
      const uploaded: string[] = [];
      for (const file of selected) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch(apiBase + "/properties/images", {
          method: "POST",
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          body: form,
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.url) {
          throw new Error(typeof body?.message === "string" ? body.message : "Could not upload a property photo.");
        }
        uploaded.push(body.url as string);
      }
      setDraft((current) => ({
        ...current,
        photos: [...current.photos.split("\n").map((url) => url.trim()).filter(Boolean), ...uploaded].join("\n"),
      }));
      setNotice(`Uploaded ${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} to Cloudinary.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not upload property photos.");
    } finally {
      setUploadingImages(false);
    }
  };

  const photos = draft.photos.split("\n").map((url) => url.trim()).filter((url) => /^https?:\/\//i.test(url));
  const basicsValid = Boolean(
    draft.type && draft.title.trim() && draft.state.trim() && draft.city.trim() &&
    draft.locality.trim() && Number(draft.price) > 0 && Number(draft.area) > 0
  );
  const contactValid = Boolean(
    draft.name.trim() && draft.phone.replace(/[^0-9]/g, "").length >= 8 &&
    draft.phone.replace(/[^0-9+]/g, "").length <= 18
  );

  const saveDraft = () => {
    try {
      localStorage.setItem("apna-ghar-listing-draft", JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
      setNotice("Draft saved on this device.");
    } catch {
      setNotice("Could not save draft in this browser.");
    }
  };

  const publish = async () => {
    if (!basicsValid || !contactValid) {
      setNotice("Complete the required property and contact fields first.");
      return;
    }

    setPublishing(true);
    setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in before publishing your property.");

      const response = await fetch(apiBase + "/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description || "No description provided.",
          categoryId: draft.type,
          listingType: draft.purpose,
          priceAmount: Number(draft.price),
          location: { state: draft.state, city: draft.city, locality: draft.locality },
          areaValue: Number(draft.area),
          areaUnit: "sqft",
          bedrooms: draft.beds ? Number(draft.beds) : undefined,
          bathrooms: draft.baths ? Number(draft.baths) : undefined,
          imageUrls: photos,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
        throw new Error(message || "Could not publish listing. Check the fields and retry.");
      }

      const created = await response.json();
      localStorage.removeItem("apna-ghar-listing-draft");
      localStorage.setItem("apna-ghar-last-published", JSON.stringify({
        id: created._id,
        slug: created.slug,
        title: created.title,
        createdAt: new Date().toISOString(),
      }));
      window.location.assign("/my-listings?published=1");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not publish listing.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="page-shell interior-page">
      <SiteHeader active="account" />

      <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>List your property</span></div>
      <section className="listing-intro">
        <p className="eyebrow">OWNER EXPERIENCE</p>
        <h1>Let the right people<br />find <em>your place.</em></h1>
        <p>Create a clear listing and review it before publishing.</p>
        <div className="listing-steps">
          {["Property basics", "Details & photos", "Preview"].map((label, index) => (
            <span key={label} className={step === index + 1 ? "step-active" : ""}><b>{index + 1}</b>{label}</span>
          ))}
        </div>
      </section>

      <section className="listing-layout">
        <form className="listing-form" onSubmit={(event) => {
          event.preventDefault();
          setNotice("");
          if (step === 1) {
            if (!basicsValid) {
              setNotice("Complete property type, title, state, city, locality, area and price first.");
              return;
            }
            setStep(2);
          } else if (step === 2) {
            if (!contactValid) {
              setNotice("Enter a contact name and valid phone number.");
              return;
            }
            setStep(3);
          }
        }}>
          {step === 1 && (
            <div className="form-section">
              <p className="eyebrow">STEP 1 OF 3</p><h2>Tell us about the property</h2>
              <div className="form-grid">
                <label>Listing purpose *
                  <select value={draft.purpose} onChange={(event) => update("purpose", event.target.value as Draft["purpose"])}>
                    <option value="sale">Sell a property</option><option value="rent">Rent out a property</option>
                  </select>
                </label>
                <label>Property type *
                  <select required value={draft.type} onChange={(event) => update("type", event.target.value)}>
                    <option value="">Select a type</option><option value="apartment">Apartment / flat</option><option value="house">Independent house</option><option value="villa">Villa</option><option value="plot">Plot / land</option><option value="commercial">Commercial property</option>
                  </select>
                </label>
                <label className="form-span">Listing title *
                  <input required maxLength={100} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Spacious 3 BHK near the metro" />
                </label>
                <label>State *<input required value={draft.state} onChange={(event) => update("state", event.target.value)} /></label>
                <label>City *<input required value={draft.city} onChange={(event) => update("city", event.target.value)} /></label>
                <label>Locality *<input required value={draft.locality} onChange={(event) => update("locality", event.target.value)} /></label>
                <label>Expected price (₹) *<input required type="number" min="1" value={draft.price} onChange={(event) => update("price", event.target.value)} /></label>
                <label>Area (sq ft) *<input required type="number" min="1" value={draft.area} onChange={(event) => update("area", event.target.value)} /></label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <p className="eyebrow">STEP 2 OF 3</p><h2>Property details & contact</h2>
              <div className="form-grid">
                <label>Bedrooms<input type="number" min="0" value={draft.beds} onChange={(event) => update("beds", event.target.value)} /></label>
                <label>Bathrooms<input type="number" min="0" value={draft.baths} onChange={(event) => update("baths", event.target.value)} /></label>
                <label className="form-span">Description<textarea rows={4} maxLength={3000} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
                <label className="form-span">Upload property photos
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploadingImages || photos.length >= 10} onChange={(event) => { void uploadPhotos(event.currentTarget.files); event.currentTarget.value = ""; }} />
                </label>
                <p className="form-help form-span">Upload up to 10 photos, maximum 8 MB each. {uploadingImages ? "Uploading to Cloudinary…" : `${photos.length} photo(s) added.`}</p>
                {photos.length > 0 && <div className="form-span" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                  {photos.map((url, index) => <div key={url} style={{ position: "relative" }}>
                    <img src={url} alt={`Property photo ${index + 1}`} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
                    <button type="button" className="button button-outline" style={{ marginTop: 4, width: "100%" }} onClick={() => update("photos", photos.filter((_, photoIndex) => photoIndex !== index).join("\n"))}>Remove</button>
                  </div>)}
                </div>
                }
                <label>Contact name *<input required value={draft.name} onChange={(event) => update("name", event.target.value)} /></label>
                <label>Phone *<input required type="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" /></label>
                <label className="form-span">Email<input type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} /></label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-section">
              <p className="eyebrow">STEP 3 OF 3</p><h2>Review your listing</h2>
              {photos[0] && <img src={photos[0]} alt="Property preview" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 12 }} />}
              <p className="eyebrow">{draft.purpose === "rent" ? "FOR RENT" : "FOR SALE"} · {draft.type}</p>
              <h2>{draft.title}</h2><p>{[draft.locality, draft.city, draft.state].filter(Boolean).join(", ")}</p>
              <strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(draft.price))}</strong>
              <p>{draft.area} sq ft · {draft.beds || "—"} bedrooms · {draft.baths || "—"} bathrooms</p>
              <p>{draft.description}</p><p className="form-help">Contact: {draft.name} · {draft.phone}</p>
            </div>
          )}

          {notice && <p role="status" className="form-notice">{notice}</p>}
          <div className="listing-actions">
            <button className="button button-quiet" type="button" onClick={() => step > 1 ? setStep(step - 1) : window.location.assign("/")}>{step > 1 ? "← Back" : "Cancel"}</button>
            <button className="button button-outline" type="button" onClick={saveDraft}>Save draft</button>
            {step < 3
              ? <button className="button button-primary" type="submit">Continue ↗</button>
              : <button className="button button-primary" type="button" disabled={publishing || uploadingImages} onClick={publish}>{publishing ? "Publishing…" : "Publish listing ↗"}</button>}
          </div>
        </form>

        <aside className="listing-sidebar">
          <div className="sidebar-icon">⌂</div><h3>Good listings build trust</h3>
          <ul><li>Use an accurate title and current price.</li><li>Describe the property honestly.</li><li>Only use photos you have permission to share.</li><li>Never share OTPs or payment details.</li></ul>
          <a href="/safety" className="text-link">Read listing safety tips ↗</a>
          <div className="sidebar-progress"><span>Listing checklist</span><strong>{step} of 3 steps</strong><div><i style={{ width: (step / 3 * 100) + "%" }} /></div><small>Drafts stay on this device until published.</small></div>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}

export default function ListPropertyPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!configured) {
    return <main className="page-shell interior-page"><section className="search-empty"><h1>Sign in required</h1><p>Configure Clerk authentication before publishing a property.</p><a className="button button-primary" href="/sign-in">Sign in</a><a className="text-link" href="/">Back home</a></section></main>;
  }
  return <ListingForm />;
}
