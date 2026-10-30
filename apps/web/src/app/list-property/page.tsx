"use client";

import { useEffect, useState } from "react";
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
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    let cancelled = false;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      setEditingId(editId);
      setNotice("Loading your listing for editing…");
      void (async () => {
        try {
          const token = await getToken();
          if (!token) throw new Error("Sign in to edit your listing.");
          const response = await fetch(apiBase + "/properties/mine", { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
          if (!response.ok) throw new Error("Could not load your listings. Please sign in and retry.");
          const listings = await response.json() as Array<{ _id: string; title: string; description?: string; categoryId: string; listingType: "sale" | "rent"; priceAmount: number; location?: { state?: string; city?: string; locality?: string }; areaValue: number; bedrooms?: number; bathrooms?: number; imageUrls?: string[]; contactName?: string; contactPhone?: string }>;
          const listing = listings.find((item) => item._id === editId);
          if (!listing) throw new Error("This listing was not found in your account.");
          if (cancelled) return;
          setDraft({
            purpose: listing.listingType,
            type: listing.categoryId,
            title: listing.title,
            state: listing.location?.state || "",
            city: listing.location?.city || "",
            locality: listing.location?.locality || "",
            price: String(listing.priceAmount),
            area: String(listing.areaValue),
            beds: listing.bedrooms === undefined ? "" : String(listing.bedrooms),
            baths: listing.bathrooms === undefined ? "" : String(listing.bathrooms),
            description: listing.description || "",
            name: listing.contactName || "",
            phone: listing.contactPhone || "",
            email: "",
            photos: (listing.imageUrls || []).join("\\n"),
          });
          setNotice("Listing loaded. Review the details and save your changes.");
        } catch (error) {
          if (!cancelled) setNotice(error instanceof Error ? error.message : "Could not load this listing.");
        }
      })();
      return () => { cancelled = true; };
    }
    try {
      const saved = localStorage.getItem("apna-ghar-listing-draft");
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<Draft>;
      setDraft((current) => ({ ...current, ...Object.fromEntries(Object.keys(initialDraft).map((key) => [key, typeof parsed[key as keyof Draft] === "string" ? parsed[key as keyof Draft] : current[key as keyof Draft]])) } as Draft));
    } catch {
      // Ignore an invalid or outdated local draft and let the owner start fresh.
    }
    return () => { cancelled = true; };
  }, [getToken]);

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
    editingId || (draft.name.trim() && draft.phone.replace(/[^0-9]/g, "").length >= 8 &&
    draft.phone.replace(/[^0-9+]/g, "").length <= 18)
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

      const response = await fetch(apiBase + (editingId ? "/properties/" + encodeURIComponent(editingId) : "/properties"), {
        method: editingId ? "PATCH" : "POST",
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
          contactName: draft.name.trim(),
          contactPhone: draft.phone.trim(),
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
      window.location.assign(editingId ? "/my-listings?updated=1" : "/my-listings?published=1");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not publish listing.");
    } finally {
      setPublishing(false);
    }
  };

  const formattedPrice = draft.price && Number(draft.price) > 0 ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(draft.price)) : "Add your expected price";
  const priceInWords = draft.price && Number(draft.price) > 0 ? (Number(draft.price) >= 10000000 ? (Number(draft.price) / 10000000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " crore" : Number(draft.price) >= 100000 ? (Number(draft.price) / 100000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " lakh" : "Below ₹1 lakh") : "Your price will appear here";

  return (
    <main className="page-shell interior-page listing-page-redesign">
      <SiteHeader active="account" />
      <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>{editingId ? "Edit listing" : "Post property"}</span></div>
      <section className="listing-workspace-heading">
        <div className="listing-heading-copy"><p className="eyebrow">OWNER LISTING PORTAL</p><h1>{editingId ? "Update your property" : "Your property. Your next chapter."}</h1><p>{editingId ? "Make your changes, review the details and save your listing." : "Share the details buyers need. Review everything before your property goes live."}</p></div>
        <div className="listing-heading-note"><span className="listing-heading-note-icon">⌂</span><span><strong>Free to post</strong><small>Connect directly with interested buyers and tenants.</small></span></div>
        <div className="listing-progress-track" aria-label={`Step ${step} of 3`}>
          {["Property basics", "Details & photos", "Review & publish"].map((label, index) => <div key={label} className={`listing-progress-step ${step === index + 1 ? "is-current" : step > index + 1 ? "is-complete" : ""}`}><span>{step > index + 1 ? "✓" : index + 1}</span><div><strong>{label}</strong><small>{["Location and price", "Features and images", "Check your listing"][index]}</small></div></div>)}
        </div>
      </section>

      <section className="listing-layout listing-layout-redesign">
        <form className="listing-form listing-form-redesign" onSubmit={(event) => { event.preventDefault(); setNotice(""); if (step === 1) { if (!basicsValid) { setNotice("Complete property type, title, state, city, locality, area and price first."); return; } setStep(2); } else if (step === 2) { if (!contactValid) { setNotice("Enter a contact name and valid phone number."); return; } setStep(3); } }}>
          <div className="form-section listing-step-card">
            <div className="listing-step-card-heading"><div><p className="eyebrow">STEP {step} OF 3</p><h2>{step === 1 ? "Start with the essentials" : step === 2 ? "Add the details that matter" : "Review before you publish"}</h2><p>{step === 1 ? "Tell us what you are listing and where it is located." : step === 2 ? "Help people picture the property with clear details and photos." : "Check the information below. You can go back and edit anything."}</p></div><span className="listing-step-percent">{Math.round(step / 3 * 100)}%</span></div>
            {step === 1 && <div className="listing-fields">
              <fieldset className="listing-fieldset listing-field-full"><legend>What would you like to do?</legend><div className="listing-choice-row">
                <button type="button" className={draft.purpose === "sale" ? "listing-choice is-selected" : "listing-choice"} onClick={() => update("purpose", "sale")}><span className="listing-choice-icon">↗</span><span><strong>Sell property</strong><small>Find someone to buy your place</small></span></button>
                <button type="button" className={draft.purpose === "rent" ? "listing-choice is-selected" : "listing-choice"} onClick={() => update("purpose", "rent")}><span className="listing-choice-icon">⌂</span><span><strong>Rent / lease</strong><small>Find a tenant for your property</small></span></button>
              </div></fieldset>
              <label className="listing-field listing-field-full">Property category *<select required value={draft.type} onChange={(event) => update("type", event.target.value)}><option value="">Choose a property type</option><option value="apartment">Apartment / flat</option><option value="house">Independent house</option><option value="villa">Villa</option><option value="plot">Plot / land</option><option value="commercial">Commercial property</option></select></label>
              <label className="listing-field listing-field-full">Listing title *<input required maxLength={100} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Example: Bright 3 BHK apartment near the metro" /><small>Keep it clear and specific. You can refine it later.</small></label>
              <div className="listing-field-group listing-field-full"><span className="listing-field-group-title">Where is your property?</span><div className="listing-fields listing-fields-nested">
                <label className="listing-field">State *<input required value={draft.state} onChange={(event) => update("state", event.target.value)} placeholder="Uttarakhand" /></label>
                <label className="listing-field">City *<input required value={draft.city} onChange={(event) => update("city", event.target.value)} placeholder="Rudrapur" /></label>
                <label className="listing-field listing-field-full">Locality / neighbourhood *<input required value={draft.locality} onChange={(event) => update("locality", event.target.value)} placeholder="Enter area or neighbourhood" /></label>
              </div></div>
              <div className="listing-field-group listing-field-full"><span className="listing-field-group-title">Price and area</span><div className="listing-fields listing-fields-nested">
                <label className="listing-field">Expected price (₹) *<input required type="number" min="1" value={draft.price} onChange={(event) => update("price", event.target.value)} placeholder="e.g. 8500000" /><small>{priceInWords}</small></label>
                <label className="listing-field">Built-up / plot area (sq ft) *<input required type="number" min="1" value={draft.area} onChange={(event) => update("area", event.target.value)} placeholder="e.g. 1450" /></label>
              </div></div>
            </div>}
            {step === 2 && <div className="listing-fields">
              <fieldset className="listing-fieldset listing-field-full"><legend>Apartment configuration</legend><div className="listing-bhk-options">{["1","2","3","4","5"].map((value) => <button key={value} type="button" className={draft.beds === value ? "is-selected" : ""} onClick={() => update("beds", value)}>{value === "5" ? "5+" : value} BHK</button>)}<button type="button" className={!draft.beds ? "is-selected" : ""} onClick={() => update("beds", "")}>Not applicable</button></div></fieldset>
              <label className="listing-field">Bathrooms<input type="number" min="0" value={draft.baths} onChange={(event) => update("baths", event.target.value)} placeholder="Number of bathrooms" /></label>
              <label className="listing-field listing-field-full">Property description<textarea rows={5} maxLength={3000} value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe the layout, condition, amenities, nearby facilities and anything a buyer or tenant should know." /><small>{draft.description.length}/3000 characters</small></label>
              <div className="listing-upload-panel listing-field-full"><div className="listing-upload-heading"><div><strong>Photos & floor plans</strong><small>Show the spaces clearly. You can upload up to 10 images.</small></div><span>{photos.length}/10</span></div>
                <label className="listing-dropzone"><span className="listing-upload-icon">＋</span><strong>{uploadingImages ? "Uploading your photos…" : "Add property photos"}</strong><small>JPEG, PNG, WebP or AVIF · Maximum 8 MB each</small><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploadingImages || photos.length >= 10} onChange={(event) => { void uploadPhotos(event.currentTarget.files); event.currentTarget.value = ""; }} /></label>
                {photos.length > 0 && <div className="listing-photo-grid">{photos.map((url, index) => <div className="listing-photo-item" key={url}><img src={url} alt={`Property photo ${index + 1}`} /><button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => update("photos", photos.filter((_, photoIndex) => photoIndex !== index).join("\n"))}>×</button></div>)}</div>}
                <small className="listing-upload-status">{uploadingImages ? "Uploading to your media storage…" : `${photos.length} photo(s) added. Add images you have permission to share.`}</small>
              </div>
              <div className="listing-field-group listing-field-full"><span className="listing-field-group-title">How can interested people reach you?</span><div className="listing-fields listing-fields-nested">
                <label className="listing-field">Contact name {!editingId && "*"}<input required={!editingId} value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" /></label>
                <label className="listing-field">Phone number {!editingId && "*"}<input required={!editingId} type="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" /></label>
                <p className="listing-privacy-note listing-field-full">Your email stays private. Buyers and tenants can call the number you provide or start a private chat on Apna Ghar.</p>
              </div></div>
            </div>}
            {step === 3 && <div className="listing-review">
              {photos[0] ? <img className="listing-review-cover" src={photos[0]} alt="First property photo" /> : <div className="listing-review-placeholder"><span>⌂</span><strong>No photos added yet</strong><small>You can go back and add property images.</small></div>}
              <div className="listing-review-meta"><span>{draft.purpose === "rent" ? "FOR RENT / LEASE" : "FOR SALE"}</span><span>{draft.type || "Property"}</span></div><h3>{draft.title || "Your property title"}</h3><p className="listing-review-location">{[draft.locality, draft.city, draft.state].filter(Boolean).join(", ")}</p><strong className="listing-review-price">{formattedPrice}</strong><div className="listing-review-facts"><span>{draft.area || "—"} sq ft</span><span>{draft.beds || "—"} bedrooms</span><span>{draft.baths || "—"} bathrooms</span><span>{photos.length} photos</span></div><p>{draft.description || "No description provided."}</p><div className="listing-review-contact"><strong>Contact details</strong><span>{draft.name || "—"} · {draft.phone || "—"}</span></div>
            </div>}
            {notice && <p role="status" className="form-notice">{notice}</p>}
            <div className="listing-actions listing-actions-redesign"><button className="button button-quiet" type="button" onClick={() => step > 1 ? setStep(step - 1) : window.location.assign("/")}>{step > 1 ? "← Back" : "Cancel"}</button><button className="button button-outline" type="button" onClick={saveDraft}>Save draft</button>{step < 3 ? <button className="button button-primary" type="submit">Continue to step {step + 1} ↗</button> : <button className="button button-primary" type="button" disabled={publishing || uploadingImages} onClick={publish}>{publishing ? "Publishing…" : editingId ? "Save listing changes ↗" : "Publish listing ↗"}</button>}</div>
          </div>
        </form>
        <aside className="listing-sidebar listing-sidebar-redesign"><div className="listing-sidebar-top"><span className="sidebar-icon">⌂</span><span className="listing-sidebar-kicker">A better listing starts here</span></div><h3>Help people picture their next home.</h3><p>Clear information makes it easier for the right people to understand your property.</p><ul><li><span>✓</span> Use an accurate title and current price.</li><li><span>✓</span> Describe the property honestly.</li><li><span>✓</span> Add bright, clear photos of each space.</li><li><span>✓</span> Only share photos you have permission to use.</li></ul><a href="/safety" className="text-link">Read listing safety tips ↗</a><div className="listing-sidebar-progress"><div><span>YOUR PROGRESS</span><strong>{step} / 3</strong></div><div className="listing-sidebar-progress-track"><i style={{ width: (step / 3 * 100) + "%" }} /></div><small>Save a draft any time. Your unfinished draft stays on this device.</small></div><div className="listing-price-preview"><span>EXPECTED PRICE</span><strong>{formattedPrice}</strong><small>{priceInWords}</small></div></aside>
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
