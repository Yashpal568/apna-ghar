"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

type Offer = {
  _id: string;
  amount: number;
  askingPriceAtOffer: number;
  senderId: string;
  recipientId: string;
  status: "pending" | "countered" | "accepted" | "rejected" | "withdrawn";
  message?: string;
  createdAt?: string;
};
type Props = { conversationId: string; buyerId: string; ownerId: string };
const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://apna-ghar-api-j4fo.onrender.com/api/v1").replace(/\/$/, "");
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function PropertyNegotiationPanel({ conversationId, buyerId, ownerId }: Props) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const userId = user?.id || "";
  const latest = offers[offers.length - 1];
  const isBuyer = userId === buyerId;
  const canRespond = Boolean(latest && latest.status === "pending" && latest.recipientId === userId);
  const canStart = isBuyer && (!latest || latest.status === "rejected" || latest.status === "withdrawn");

  const refresh = useCallback(async () => {
    if (!isSignedIn || !conversationId) return;
    const token = await getToken();
    if (!token) return;
    const response = await fetch(API + "/conversations/" + encodeURIComponent(conversationId) + "/offers", {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(response.status === 403 ? "You cannot view these proposals." : "Could not load property proposals.");
    const data = await response.json();
    setOffers(Array.isArray(data) ? data : []);
  }, [conversationId, getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    setLoading(true);
    setOffers([]);
    setError("");
    const load = async () => {
      try { await refresh(); if (active) setError(""); }
      catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not load proposals."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh().catch(() => undefined); }, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isLoaded, isSignedIn, refresh]);

  const submit = async (event: FormEvent, offerId?: string) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || submitting) return;
    setSubmitting(true); setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your sign-in session expired. Please sign in again.");
      const url = API + "/conversations/" + encodeURIComponent(conversationId) + "/offers" + (offerId ? "/" + encodeURIComponent(offerId) + "/counter" : "");
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ amount: numericAmount, message: message.trim() || undefined }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Proposal could not be sent.");
      setAmount(""); setMessage(""); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Proposal could not be sent."); }
    finally { setSubmitting(false); }
  };

  const respond = async (action: "accept" | "reject") => {
    if (!latest || !canRespond || submitting) return;
    setSubmitting(true); setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your sign-in session expired.");
      const response = await fetch(API + "/conversations/" + encodeURIComponent(conversationId) + "/offers/" + encodeURIComponent(latest._id) + "/respond", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Could not update proposal.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update proposal."); }
    finally { setSubmitting(false); }
  };

  const statusLabel = useMemo(() => ({ pending: "Awaiting response", countered: "Countered", accepted: "Accepted", rejected: "Rejected", withdrawn: "Withdrawn" }), []);

  if (loading) return <section className="negotiation-panel"><div className="negotiation-panel-heading"><strong>Property proposals</strong><span>Loading…</span></div></section>;

  return (
    <section className="negotiation-panel">
      <button type="button" className="negotiation-panel-heading" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
        <span><strong>Property proposals</strong><small>Negotiate directly with the owner</small></span>
        <span>{offers.length ? offers.length + " offer" + (offers.length === 1 ? "" : "s") : "Make an offer"}　{expanded ? "−" : "+"}</span>
      </button>
      {expanded && <>
        {offers.length > 0 && <div className="negotiation-history">
          {offers.map((offer, index) => {
            const mine = offer.senderId === userId;
            return <article className={"negotiation-offer " + (mine ? "is-mine" : "")} key={offer._id}>
              <div className="negotiation-offer-top"><span>{mine ? "Your proposal" : "Received proposal"} · #{index + 1}</span><span className={"negotiation-status status-" + offer.status}>{statusLabel[offer.status]}</span></div>
              <strong className="negotiation-amount">{money(offer.amount)}</strong><small className="negotiation-asking-price">Asking price at proposal: {money(offer.askingPriceAtOffer)}</small>
              {offer.message && <p>{offer.message}</p>}
              <time>{offer.createdAt ? new Date(offer.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</time>
              {canRespond && latest?._id === offer._id && <div className="negotiation-actions">
                <button type="button" onClick={() => void respond("accept")} disabled={submitting}>Accept</button>
                <button type="button" className="is-secondary" onClick={() => setAmount(String(Math.round(offer.amount)))} disabled={submitting}>Counter</button>
                <button type="button" className="is-danger" onClick={() => void respond("reject")} disabled={submitting}>Reject</button>
              </div>}
            </article>;
          })}
        </div>}
        {canStart && <form className="negotiation-form" onSubmit={event => void submit(event)}>
          <label htmlFor={"proposal-amount-" + conversationId}>Your offer amount (INR)</label>
          <div className="negotiation-amount-input"><span>₹</span><input id={"proposal-amount-" + conversationId} type="number" min="1" max="1000000000000" step="1" required value={amount} onChange={event => setAmount(event.target.value)} placeholder="Enter your proposed price"/></div>
          <textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={1000} rows={2} placeholder="Add a message or proposed terms (optional)"/>
          <button type="submit" disabled={submitting || !amount.trim()}>{submitting ? "Sending…" : offers.length ? "Send new proposal" : "Send proposal"}</button>
        </form>}
        {canRespond && <form className="negotiation-form" onSubmit={event => void submit(event, latest?._id)}>
          <label htmlFor={"counter-amount-" + conversationId}>Make a counter-offer (INR)</label>
          <div className="negotiation-amount-input"><span>₹</span><input id={"counter-amount-" + conversationId} type="number" min="1" max="1000000000000" step="1" required value={amount} onChange={event => setAmount(event.target.value)} placeholder="Enter counter-offer"/></div>
          <textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={1000} rows={2} placeholder="Add a note (optional)"/>
          <button type="submit" disabled={submitting || !amount.trim()}> {submitting ? "Sending…" : "Send counter-offer"} </button>
        </form>}
        {latest?.status === "accepted" && <p className="negotiation-complete" role="status">Proposal accepted. You can now coordinate the next steps directly. This is not a completed property sale or payment.</p>}
        {error && <p className="negotiation-error" role="alert">{error}</p>}
        {!offers.length && !isBuyer && <p className="negotiation-hint">The buyer can submit a proposal here. You will be able to accept, reject or counter it.</p>}
        {latest?.status === "pending" && latest.senderId === userId && <p className="negotiation-hint">Your proposal has been sent. You will see the owner’s response here.</p>}
      </>}
    </section>
  );
}
