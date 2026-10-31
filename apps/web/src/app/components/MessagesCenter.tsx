"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import PropertyNegotiationPanel from "./PropertyNegotiationPanel";
import "./messages-workspace.css";

type Message = {
  _id?: string;
  senderId: string;
  text: string;
  sentAt: string;
};

type Conversation = {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
  ownerId: string;
  buyerId: string;
  participantIds: string[];
  messages: Message[];
  lastMessageAt: string;
  unreadCountByUser?: Record<string, number>;
};

type ConversationDetail = {
  conversationId: string;
  propertyId: string;
  propertyTitle: string;
  messages: Message[];
  hasMore?: boolean;
  nextBefore?: string | null;
};

type PropertySummary = {
  title?: string;
  slug?: string;
  priceAmount?: number;
  imageUrls?: string[];
  location?: { locality?: string; city?: string; state?: string };
  listingType?: string;
  categoryId?: string;
  contactName?: string;
  contactPhone?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingCount?: number;
  status?: string;
  areaValue?: number;
  areaUnit?: string;
};

function mergeMessages(existing: Message[], incoming: Message[]) {
  const merged = new Map<string, Message>();
  for (const message of [...existing, ...incoming]) {
    merged.set(message._id || message.senderId + "-" + message.sentAt, message);
  }
  return [...merged.values()].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24 && date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatCalendarDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatINR(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Price on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const api = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://apna-ghar-api-j4fo.onrender.com/api/v1"
).replace(/\/$/, "");

function MessagesCenterAuthenticated() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("");
  const [searchText, setSearchText] = useState("");
  const [conversationView, setConversationView] = useState<"all" | "active">("all");
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [propertyInfo, setPropertyInfo] = useState<PropertySummary | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [mobileTab, setMobileTab] = useState<"chat" | "dossier">("chat");

  const streamBottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch list of user conversations
  const fetchMine = useCallback(
    async (signal?: AbortSignal) => {
      const token = await getToken();
      if (!token) throw new Error("Your sign-in session is not ready. Please sign in again.");
      const response = await fetch(api + "/conversations", {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        signal,
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session expired. Please sign in again."
            : "Couldn't load your conversations."
        );
      }
      const data = (await response.json()) as Conversation[];
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      return list;
    },
    [getToken]
  );

  // Initial load
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setError("Sign in to view and message property owners.");
      return;
    }
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const data = await fetchMine(controller.signal);
        if (cancelled) return;
        const requested = new URLSearchParams(window.location.search).get("conversation");
        setSelected(
          requested && data.some((c) => c._id === requested)
            ? requested
            : data[0]?._id || ""
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load messages.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fetchMine, isLoaded, isSignedIn]);

  // Polling for selected conversation messages every 5s
  useEffect(() => {
    if (!selected || !isSignedIn) return;
    let cancelled = false;
    const controller = new AbortController();

    async function refresh() {
      try {
        const token = await getToken();
        if (!token) return;
        const r = await fetch(api + "/conversations/" + encodeURIComponent(selected) + "/messages", {
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          signal: controller.signal,
        });
        if (!r.ok) {
          throw new Error(
            r.status === 403
              ? "You don't have access to this conversation."
              : "Couldn't refresh this conversation."
          );
        }
        const body = (await r.json()) as ConversationDetail;
        if (!cancelled) {
          setDetail((previous) => {
            if (previous?.conversationId !== body.conversationId) return body;
            const messages = mergeMessages(previous.messages, body.messages);
            return {
              ...body,
              messages,
              nextBefore: body.hasMore ? messages[0]?.sentAt || null : null,
            };
          });
        }
      } catch (e) {
        if (!cancelled && e instanceof Error && e.name !== "AbortError") {
          setError(e.message);
        }
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [selected, getToken, isSignedIn]);

  // Periodic inbox refresh when visible
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    const refreshInbox = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await fetchMine();
      } catch (e) {
        if (!cancelled && e instanceof Error && e.name !== "AbortError") setError(e.message);
      }
    };
    const timer = window.setInterval(() => void refreshInbox(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [fetchMine, isLoaded, isSignedIn]);

  // Mark as read when active
  useEffect(() => {
    if (!selected || !isSignedIn || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await fetch(
          api + "/conversations/" + encodeURIComponent(selected) + "/read",
          {
            method: "PATCH",
            headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          }
        );
        if (!response.ok) throw new Error("Could not update read status");
        if (!cancelled) {
          setItems((old) =>
            old.map((item) =>
              item._id === selected
                ? {
                    ...item,
                    unreadCountByUser: {
                      ...(item.unreadCountByUser || {}),
                      [user.id]: 0,
                    },
                  }
                : item
            )
          );
        }
      } catch {
        // Retry silently on next poll
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, isSignedIn, getToken, user?.id]);

  const current = useMemo(() => items.find((c) => c._id === selected), [items, selected]);

  // Fetch real property details for Column 3
  useEffect(() => {
    const propertyId = detail?.propertyId || current?.propertyId;
    if (!propertyId) {
      setPropertyInfo(null);
      return;
    }
    const controller = new AbortController();
    void fetch(api + "/properties/" + encodeURIComponent(propertyId), {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Property info unavailable");
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          const raw = data?.property || data?.result || data?.data || data;
          setPropertyInfo(raw && typeof raw === "object" ? raw : null);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setPropertyInfo(null);
      });

    return () => controller.abort();
  }, [detail?.propertyId, current?.propertyId]);

  // Auto-scroll stream to bottom on new messages
  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages?.length, selected]);

  const activeItems = useMemo(
    () => items.filter((c) => Boolean(c.lastMessageAt || c.messages?.length)),
    [items]
  );

  const visibleItems = conversationView === "active" ? activeItems : items;
  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return visibleItems;
    return visibleItems.filter((c) =>
      [c.propertyTitle, c.propertySlug, c.messages?.[c.messages.length - 1]?.text].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [visibleItems, searchText]);

  const totalUnread = useMemo(() => {
    if (!user?.id) return 0;
    return items.reduce((acc, c) => acc + (c.unreadCountByUser?.[user.id] || 0), 0);
  }, [items, user?.id]);

  function choose(id: string) {
    setSelected(id);
    setDetail(null);
    setPropertyInfo(null);
    setError("");
    setMobileTab("chat");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/messages?conversation=" + encodeURIComponent(id));
    }
  }

  async function send(e?: FormEvent) {
    if (e) e.preventDefault();
    const text = draft.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your sign-in session expired.");
      const r = await fetch(api + "/conversations/" + encodeURIComponent(selected) + "/messages", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof body.message === "string" ? body.message : "Message could not be sent.");

      setDraft("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Refresh immediately
      const token2 = await getToken();
      if (token2) {
        const refresh = await fetch(api + "/conversations/" + encodeURIComponent(selected) + "/messages", {
          headers: { Authorization: "Bearer " + token2, Accept: "application/json" },
        });
        if (refresh.ok) {
          const latest = (await refresh.json()) as ConversationDetail;
          setDetail((previous) => {
            if (previous?.conversationId !== latest.conversationId) return latest;
            const messages = mergeMessages(previous.messages, latest.messages);
            return {
              ...latest,
              messages,
              nextBefore: latest.hasMore ? messages[0]?.sentAt || null : null,
            };
          });
        }
      }
      void fetchMine().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  async function loadOlder() {
    if (!selected || !detail?.hasMore || !detail.nextBefore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Your sign-in session expired.");
      const url =
        api +
        "/conversations/" +
        encodeURIComponent(selected) +
        "/messages?limit=50&before=" +
        encodeURIComponent(detail.nextBefore);
      const response = await fetch(url, {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof body.message === "string" ? body.message : "Older messages could not be loaded."
        );
      }
      const page = body as ConversationDetail;
      setDetail((previous) =>
        previous?.conversationId === page.conversationId
          ? {
              ...previous,
              hasMore: page.hasMore,
              nextBefore: page.nextBefore,
              messages: mergeMessages(page.messages, previous.messages),
            }
          : page
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Older messages could not be loaded.");
    } finally {
      setLoadingOlder(false);
    }
  }

  // 1. Loading State
  if (!isLoaded || loading) {
    return (
      <main className="messages-workspace-shell">
        <SiteHeader active="messages" />
        <div className="messages-top-toolbar">
          <div className="messages-top-toolbar-left">
            <h1>Messages</h1>
            <span className="messages-top-toolbar-badge">
              <span className="status-dot" /> Loading inbox…
            </span>
          </div>
        </div>
        <div className="messages-empty-inbox-view">
          <div className="messages-empty-inbox-card">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <h2>Connecting to Messaging Desk</h2>
            <p>Fetching your direct buyer and owner conversations from secure storage…</p>
          </div>
        </div>
      <SiteFooter />
      </main>
    );
  }

  // 2. Unauthenticated State
  if (!isSignedIn) {
    return (
      <main className="messages-workspace-shell">
        <SiteHeader active="messages" />
        <div className="messages-top-toolbar">
          <div className="messages-top-toolbar-left">
            <h1>Messages</h1>
            <span className="messages-top-toolbar-badge">Authentication Required</span>
          </div>
        </div>
        <div className="messages-empty-inbox-view">
          <div className="messages-empty-inbox-card">
            <div className="messages-empty-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2>Sign In to View Messages</h2>
            <p>
              Connect directly with verified property owners and buyers. Manage enquiries, schedule
              visits, and negotiate offers with 100% zero brokerage.
            </p>
            <div className="messages-empty-features-grid">
              <div className="messages-empty-feature-item">
                <strong>1:1 Owner Direct</strong>
                <span>Chat privately without intermediary broker fees</span>
              </div>
              <div className="messages-empty-feature-item">
                <strong>Live Counter-Offers</strong>
                <span>Make and receive price proposals in real time</span>
              </div>
              <div className="messages-empty-feature-item">
                <strong>Verified Trust</strong>
                <span>All listings verified with direct contact details</span>
              </div>
            </div>
            <a
              className="messages-empty-cta-btn"
              href={"/sign-in?redirect_url=" + encodeURIComponent("/messages")}
            >
              Sign In to Apna Ghar →
            </a>
          </div>
        </div>
      <SiteFooter />
      </main>
    );
  }

  // Active messages list with date grouping
  const messagesList = detail?.messages || current?.messages || [];
  const propertyTitle = detail?.propertyTitle || current?.propertyTitle || "Property Discussion";
  const propertySlug = current?.propertySlug || detail?.propertyId || "";
  const ownerPhone = propertyInfo?.contactPhone?.trim() || "";
  const propertyImg = propertyInfo?.imageUrls?.find((url) => /^https?:\/\//i.test(url));
  const propertyLoc = [
    propertyInfo?.location?.locality,
    propertyInfo?.location?.city,
    propertyInfo?.location?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="messages-workspace-shell">
      <SiteHeader active="messages" />

      {/* Compact Workspace Top Toolbar */}
      <div className="messages-top-toolbar">
        <div className="messages-top-toolbar-left">
          <h1>Direct Owner Desk</h1>
          <span className="messages-top-toolbar-badge">
            <span className="status-dot" /> Live sync
          </span>
          {totalUnread > 0 && (
            <span className="messages-unread-pill">{totalUnread} new</span>
          )}
          <span className="messages-top-toolbar-desc">
            Private buyer &amp; seller negotiations
          </span>
        </div>
        <div className="messages-top-toolbar-right">
          <a className="messages-browse-btn" href="/search">
            <span>⌕</span> Browse listings
          </a>
        </div>
      </div>

      {error && (
        <div
          className="bg-error-container text-on-error-container px-4 py-2 text-xs flex items-center justify-between z-20"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            className="underline font-bold ml-2"
            onClick={() => {
              setError("");
              void fetchMine().catch((e) => setError(e.message));
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Full-width inbox and chat workspace. Empty states stay inside the same layout. */}
      <div
        className={`messages-main-grid ${selected ? "has-active-chat" : "is-empty"} ${
          mobileTab === "dossier" ? "show-mobile-dossier" : ""
        }`}
      >
          {/* =================================================================
              COLUMN 1: CONVERSATIONS SIDEBAR
              ================================================================= */}
          <aside className="messages-col-sidebar" aria-label="Conversations list">
            <div className="messages-sidebar-header">
              <div className="messages-sidebar-heading-copy">
                <h2>Conversations</h2>
                <span>{items.length} active threads</span>
              </div>
              <span className="messages-sidebar-count">{items.length}</span>
            </div>

            <div className="messages-sidebar-tabs" role="tablist" aria-label="Conversation filters">
              <button
                type="button"
                role="tab"
                aria-selected={conversationView === "all"}
                className={conversationView === "all" ? "is-active" : ""}
                onClick={() => setConversationView("all")}
              >
                <span className="messages-tab-dot is-muted" />
                {items.length} conversations
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={conversationView === "active"}
                className={conversationView === "active" ? "is-active" : ""}
                onClick={() => setConversationView("active")}
              >
                <span className="messages-tab-dot" />
                Active conversations
                <span className="messages-tab-count">{activeItems.length}</span>
              </button>
            </div>

            <div className="messages-sidebar-search-box">
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                className="messages-sidebar-search-input"
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search buyer, property or message…"
                aria-label="Search conversations"
              />
            </div>

            <div className="messages-threads-list">
              {items.length === 0 ? (
                <div className="messages-sidebar-empty">
                  <div className="messages-sidebar-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="10.8" cy="10.8" r="6.8" />
                      <path d="m16 16 4.2 4.2" />
                    </svg>
                  </div>
                  <h3>No conversations yet</h3>
                  <p>Open a property listing and choose <strong>Chat with owner</strong> to start a private conversation.</p>
                  <a href="/search">Explore listings <span aria-hidden="true">→</span></a>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="messages-sidebar-no-results">
                  <strong>No matching conversations</strong>
                  <span>Try another search or switch conversation filters.</span>
                  <button type="button" onClick={() => { setSearchText(""); setConversationView("all"); }}>Reset filters</button>
                </div>
              ) : (
                filteredItems.map((c) => {
                  const last = c.messages?.[c.messages.length - 1];
                  const isOwner = c.ownerId === user?.id;
                  const role = isOwner ? "Seller" : "Buyer";
                  const unread = c.unreadCountByUser?.[user?.id || ""] || 0;
                  const isActive = selected === c._id;

                  return (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() => choose(c._id)}
                      className={`messages-thread-card ${isActive ? "is-active" : ""} ${
                        unread > 0 ? "has-unread" : ""
                      }`}
                    >
                      <div className="messages-thread-avatar">
                        {(c.propertyTitle || "P").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="messages-thread-info">
                        <div className="messages-thread-top">
                          <span className="messages-thread-title">
                            {c.propertyTitle || "Property conversation"}
                          </span>
                          <time className="messages-thread-time">
                            {formatRelativeTime(last?.sentAt || c.lastMessageAt)}
                          </time>
                        </div>
                        <p className="messages-thread-snippet">
                          {last?.text || "Conversation started"}
                        </p>
                        <div className="messages-thread-bottom">
                          <span className="messages-role-pill">{role}</span>
                          {unread > 0 && (
                            <span className="messages-unread-pill">{unread}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* =================================================================
              COLUMN 2: CHAT WORKSPACE
              ================================================================= */}
          <section className="messages-col-chat" aria-label="Chat workspace">
            {!selected ? (
              <div className="messages-no-chat-selected">
                <div className="messages-no-chat-selected-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <h2>Select a conversation</h2>
                <p>
                  Choose a buyer or owner thread to view property details, chat history and proposals.
                </p>
                <a className="messages-no-chat-browse-link" href="/search">Browse properties <span aria-hidden="true">→</span></a>
                <span className="messages-no-chat-footnote">New conversations appear here automatically.</span>
              </div>
            ) : (
              <>
                {/* Chat Top Header */}
                <div className="messages-chat-top-header">
                  <div className="messages-chat-top-left">
                    <button
                      type="button"
                      className="messages-mobile-back-btn"
                      onClick={() => {
                        setSelected("");
                        setDetail(null);
                        setError("");
                        if (typeof window !== "undefined") {
                          window.history.replaceState(null, "", "/messages");
                        }
                      }}
                      aria-label="Back to conversations"
                    >
                      ←
                    </button>
                    <div className="messages-chat-user-avatar">
                      {propertyTitle.slice(0, 1).toUpperCase()}
                      <span className="online-indicator" />
                    </div>
                    <div className="messages-chat-user-meta">
                      <strong>{propertyTitle}</strong>
                      <small>
                        {current?.ownerId === user?.id ? "Buyer Enquiry" : "Direct Owner Chat"} ·
                        Refreshes live
                      </small>
                    </div>
                  </div>

                  <div className="messages-chat-top-actions">
                    {/* Mobile tab switcher between Chat & Dossier */}
                    <button
                      type="button"
                      className="messages-mobile-tab-toggle"
                      onClick={() =>
                        setMobileTab((prev) => (prev === "chat" ? "dossier" : "chat"))
                      }
                    >
                      {mobileTab === "chat" ? "🏷️ Offers & Details" : "💬 Back to Chat"}
                    </button>

                    {ownerPhone && (
                      <a
                        className="messages-call-btn"
                        href={"tel:" + ownerPhone.replace(/[^+0-9]/g, "")}
                      >
                        <span>☎</span> Call
                      </a>
                    )}
                    <a
                      className="messages-view-listing-btn"
                      href={"/property/" + encodeURIComponent(propertySlug)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Listing ↗
                    </a>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="messages-stream-container" aria-live="polite">
                  {detail?.hasMore && (
                    <button
                      type="button"
                      className="messages-load-older-btn"
                      onClick={() => void loadOlder()}
                      disabled={loadingOlder}
                    >
                      {loadingOlder ? "Loading older messages…" : "↑ Load older messages"}
                    </button>
                  )}

                  {messagesList.length === 0 ? (
                    <div className="messages-no-chat-selected">
                      <h2>Start the Conversation</h2>
                      <p>
                        Introduce yourself, ask about availability, property condition, or arranging
                        a site visit.
                      </p>
                    </div>
                  ) : (
                    messagesList.map((m, index) => {
                      const isMine = m.senderId === user?.id;
                      const currentDateLabel = formatCalendarDate(m.sentAt);
                      const prevDateLabel =
                        index > 0 ? formatCalendarDate(messagesList[index - 1].sentAt) : null;
                      const showDateDivider = currentDateLabel !== prevDateLabel;

                      return (
                        <div key={m._id || m.sentAt + index}>
                          {showDateDivider && (
                            <div className="messages-date-divider">
                              <span>{currentDateLabel}</span>
                            </div>
                          )}
                          <div
                            className={`messages-bubble-wrapper ${
                              isMine ? "is-mine" : "is-theirs"
                            }`}
                          >
                            {!isMine && (
                              <div className="messages-bubble-avatar-tiny" aria-hidden="true">
                                {current?.ownerId === m.senderId ? "O" : "B"}
                              </div>
                            )}
                            <div className="messages-bubble-content">
                              {!isMine && (
                                <span className="messages-bubble-sender-name">
                                  {current?.ownerId === m.senderId
                                    ? "Property Owner"
                                    : "Buyer"}
                                </span>
                              )}
                              <p className="messages-bubble-text">{m.text}</p>
                              <div className="messages-bubble-meta">
                                <time className="messages-bubble-time">
                                  {m.sentAt
                                    ? new Date(m.sentAt).toLocaleTimeString("en-IN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Sending…"}
                                </time>
                                {isMine && <span className="messages-read-check">✓✓</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={streamBottomRef} />
                </div>

                {/* Quick Prompts Bar */}
                <div className="messages-prompts-bar" aria-label="Suggested quick replies">
                  {[
                    "Is the property still available?",
                    "Can we arrange a site visit this week?",
                    "Is the price negotiable?",
                    "Please share the RERA approval copy.",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="messages-prompt-chip"
                      onClick={() => setDraft(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Bottom Composer */}
                <div className="messages-composer-container">
                  <form className="messages-composer-form" onSubmit={(e) => void send(e)}>
                    <div className="messages-textarea-wrap">
                      <label className="sr-only" htmlFor="message-draft-input">
                        Type a message
                      </label>
                      <textarea
                        ref={textareaRef}
                        id="message-draft-input"
                        className="messages-composer-textarea"
                        rows={1}
                        maxLength={4000}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message… (Press Enter to send, Shift+Enter for new line)"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="messages-send-btn"
                      disabled={sending || !draft.trim()}
                    >
                      {sending ? "Sending…" : "Send ↗"}
                    </button>
                  </form>
                  <div className="messages-composer-subtext">
                    <span>Press Enter to send · Shift+Enter for new line</span>
                    <span>100% Direct Zero Brokerage</span>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* =================================================================
              COLUMN 3: PROPERTY & NEGOTIATION PANEL
              ================================================================= */}
          {selected && current && (
            <aside className="messages-col-dossier" aria-label="Property & Negotiation Panel">
              {/* Property Details Card */}
              <div className="messages-dossier-card">
                {propertyImg ? (
                  <img
                    className="messages-dossier-image"
                    src={propertyImg}
                    alt={propertyTitle}
                  />
                ) : (
                  <div className="messages-dossier-placeholder">⌂</div>
                )}
                <div className="messages-dossier-body">
                  <h3 className="messages-dossier-title">{propertyTitle}</h3>
                  <p className="messages-dossier-price">
                    {formatINR(propertyInfo?.priceAmount)}
                  </p>
                  {propertyLoc && (
                    <span className="messages-dossier-location">📍 {propertyLoc}</span>
                  )}
                  <div className="messages-dossier-tags">
                    <span className="messages-dossier-tag">
                      {propertyInfo?.listingType === "rent" ? "For Rent" : "For Sale"}
                    </span>
                    {propertyInfo?.bedrooms ? (
                      <span className="messages-dossier-tag">
                        {propertyInfo.bedrooms} BHK
                      </span>
                    ) : null}
                    {propertyInfo?.areaValue ? (
                      <span className="messages-dossier-tag">
                        {propertyInfo.areaValue} {propertyInfo.areaUnit || "sqft"}
                      </span>
                    ) : null}
                  </div>
                  <a
                    className="messages-dossier-action-btn"
                    href={"/property/" + encodeURIComponent(propertySlug)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Full Property Listing ↗
                  </a>
                </div>
              </div>

              {/* Owner / Contact Dossier */}
              <div className="messages-owner-card">
                <div className="messages-owner-avatar-circle">
                  {(propertyInfo?.contactName || "O").slice(0, 1).toUpperCase()}
                </div>
                <div className="messages-owner-info">
                  <strong>{propertyInfo?.contactName || "Direct Property Owner"}</strong>
                  <small>
                    {ownerPhone ? `Verified Phone: ${ownerPhone}` : "Verified Direct Listing"}
                  </small>
                </div>
              </div>

              {/* Negotiation & Counter-Offer Module */}
              <PropertyNegotiationPanel
                conversationId={selected}
                buyerId={current.buyerId}
                ownerId={current.ownerId}
              />

              {/* Buyer Safety Tips */}
              <div className="messages-safety-card">
                <strong>🛡️ Safety &amp; Trust Guidelines</strong>
                <p>
                  Inspect property documents, title deed, and physical site independently before
                  making financial transfers. Apna Ghar does not charge brokerage.
                </p>
              </div>
            </aside>
          )}
      </div>
    </main>
  );
}

function MessagesCenterWithoutClerk() {
  return (
    <main className="messages-workspace-shell">
      <SiteHeader active="messages" />
      <div className="messages-top-toolbar">
        <div className="messages-top-toolbar-left">
          <h1>Messages</h1>
          <span className="messages-top-toolbar-badge">Sign In Required</span>
        </div>
      </div>
      <div className="messages-empty-inbox-view">
        <div className="messages-empty-inbox-card">
          <div className="messages-empty-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2>Sign In to Access Your Messages</h2>
          <p>
            Connect directly with verified property owners and buyers. Manage enquiries, schedule
            visits, and negotiate offers with 100% zero brokerage.
          </p>
          <a
            className="messages-empty-cta-btn"
            href={"/sign-in?redirect_url=" + encodeURIComponent("/messages")}
          >
            Sign In to Messages →
          </a>
        </div>
      </div>
    </main>
  );
}

export default function MessagesCenter() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <MessagesCenterAuthenticated />
  ) : (
    <MessagesCenterWithoutClerk />
  );
}
