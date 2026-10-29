"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const api = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
type Message = { _id?: string; senderId: string; text: string; sentAt: string };
type Conversation = { _id: string; propertyId: string; propertyTitle: string; propertySlug: string; ownerId: string; buyerId: string; participantIds: string[]; messages: Message[]; lastMessageAt: string };

export default function MessagesPage() {
  const { isSignedIn, getToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedId(params.get("conversation") || "");
  }, []);

  const loadConversations = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const response = await fetch(api + "/conversations", { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : "Could not load your conversations.");
    const data = await response.json() as Conversation[];
    setConversations(data);
    setUserId((id) => id || data[0]?.participantIds?.find((participant) => participant !== "") || "");
    if (!selectedId && data[0]?._id) setSelectedId(data[0]._id);
  }, [getToken, selectedId]);

  const loadMessages = useCallback(async (conversationId: string, quiet = false) => {
    if (!conversationId) return;
    const token = await getToken();
    if (!token) return;
    const response = await fetch(api + "/conversations/" + encodeURIComponent(conversationId) + "/messages", { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) {
      if (!quiet) setStatus(response.status === 403 ? "You do not have access to this conversation." : "Could not load messages.");
      return;
    }
    const data = await response.json() as { messages: Message[] };
    setMessages(data.messages || []);
    setStatus("");
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn) return;
    void loadConversations().catch((error) => setStatus(error instanceof Error ? error.message : "Could not load conversations."));
  }, [isSignedIn, loadConversations]);

  useEffect(() => {
    if (!isSignedIn || !selectedId) return;
    void loadMessages(selectedId);
    const timer = window.setInterval(() => { void loadMessages(selectedId, true); }, 4000);
    return () => window.clearInterval(timer);
  }, [isSignedIn, selectedId, loadMessages]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId || busy) return;
    setBusy(true); setStatus("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Sign in again.");
      const response = await fetch(api + "/conversations/" + encodeURIComponent(selectedId) + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, Accept: "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Message could not be sent.");
      setDraft("");
      await loadMessages(selectedId, true);
      await loadConversations();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Message could not be sent.");
    } finally { setBusy(false); }
  }

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !isSignedIn) {
    return <main className="page-shell interior-page"><SiteHeader active="account" /><section className="search-empty"><h1>Your property conversations</h1><p>Sign in to message property owners and reply to buyers.</p><a className="button button-primary" href={"/sign-in?redirect_url=" + encodeURIComponent("/messages")}>Sign in to continue</a></section><SiteFooter /></main>;
  }

  const selected = conversations.find((conversation) => conversation._id === selectedId);
  return <main className="page-shell interior-page"><SiteHeader active="account" />
    <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>Messages</span></div>
    <section className="messages-page">
      <header className="messages-heading"><div><p className="eyebrow">BUYER ↔ OWNER</p><h1>Your messages</h1><p>Chat directly about a property. New messages refresh automatically.</p></div><a className="button button-outline" href="/search">Find properties</a></header>
      <div className="messages-layout">
        <aside className="messages-sidebar"><h2>Conversations</h2>
          {conversations.length ? conversations.map((conversation) => <button type="button" key={conversation._id} className={"conversation-row " + (conversation._id === selectedId ? "is-selected" : "")} onClick={() => { setSelectedId(conversation._id); window.history.replaceState(null, "", "/messages?conversation=" + encodeURIComponent(conversation._id)); }}>
            <span className="conversation-avatar">⌂</span><span className="conversation-summary"><strong>{conversation.propertyTitle}</strong><small>{conversation.messages?.at(-1)?.text || "Conversation started"}</small></span><small>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleDateString() : ""}</small>
          </button>) : <div className="messages-empty"><strong>No conversations yet</strong><p>Open a property and select Chat with owner to start a conversation.</p><a href="/search">Browse properties ↗</a></div>}
        </aside>
        <section className="messages-chat" aria-label="Chat messages">
          {selected ? <><header className="messages-chat-header"><div><strong>{selected.propertyTitle}</strong><small>Property conversation</small></div><a href={"/property/" + encodeURIComponent(selected.propertySlug || selected.propertyId)}>View property ↗</a></header>
            <div className="messages-thread" aria-live="polite">{messages.length ? messages.map((message, index) => <div key={message._id || message.sentAt + index} className={"message-bubble " + (message.senderId === userId ? "message-mine" : "message-theirs")}><p>{message.text}</p><time>{new Date(message.sentAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</time></div>) : <div className="messages-empty"><strong>Say hello</strong><p>Ask about availability, price or a time to visit. Keep payments and OTPs private.</p></div>}</div>
            <form className="messages-compose" onSubmit={send}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={2} placeholder="Write a message…" aria-label="Write a message" required /><button className="button button-primary" disabled={busy || !draft.trim()}>{busy ? "Sending…" : "Send ↗"}</button></form>
          </> : <div className="messages-empty messages-select-empty"><span>↔</span><h2>Select a conversation</h2><p>Choose a property conversation on the left, or start one from a listing.</p></div>}
          {status && <p className="form-notice" role="status">{status}</p>}
        </section>
      </div>
    </section><SiteFooter />
  </main>;
}
