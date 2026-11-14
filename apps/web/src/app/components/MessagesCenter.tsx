"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { fetchApi } from "../utils/api";
import SiteHeader from "./SiteHeader";
import "./messages-workspace.css";

type MessageAttachment = {
  url: string;
  filename: string;
  contentType: string;
  sizeBytes?: number;
  publicId?: string;
};

type Message = {
  _id?: string;
  senderId: string;
  text: string;
  sentAt: string;
  isOfferProposal?: boolean;
  offerAmount?: number;
  offerValidity?: string;
  attachment?: MessageAttachment;
};

type Conversation = {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
  ownerId: string;
  contactName?: string;
  buyerId: string;
  participantIds: string[];
  messages: Message[];
  lastMessageAt: string;
  unreadCountByUser?: Record<string, number>;
  statusBadge?: string;
  priceFormatted?: string;
  thumbUrl?: string;
};

type PropertySummary = {
  _id?: string;
  title?: string;
  slug?: string;
  priceAmount?: number;
  imageUrls?: string[];
  location?: { locality?: string; city?: string; state?: string; addressText?: string };
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
  facing?: string;
  ownershipType?: string;
};

type PropertyOffer = {
  _id: string;
  conversationId: string;
  propertyId: string;
  buyerId: string;
  ownerId: string;
  senderId: string;
  recipientId: string;
  amount: number;
  askingPriceAtOffer: number;
  message?: string;
  status: "pending" | "countered" | "accepted" | "rejected" | "withdrawn";
  createdAt?: string;
  respondedAt?: string;
};

const DEFAULT_PROPERTY_THUMB =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";

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
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatINR(num?: number): string {
  if (typeof num !== "number" || isNaN(num) || num <= 0) return "0";
  return Number(num).toLocaleString("en-IN");
}

function formatCrLakh(num?: number): string {
  if (typeof num !== "number" || isNaN(num) || num <= 0) return "₹0";
  if (num >= 10000000) {
    return "₹" + (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) {
    return "₹" + (num / 100000).toFixed(1) + " L";
  }
  return "₹" + num.toLocaleString("en-IN");
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderMessageAttachment(att?: MessageAttachment, isMine = false) {
  if (!att) return null;
  const isImg = att.contentType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.url);
  if (isImg) {
    return (
      <div className="mb-2 max-w-[280px] overflow-hidden rounded-xl border border-white/20 bg-black/15">
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
          <img
            src={att.url}
            alt={att.filename || "Attachment"}
            className="w-full max-h-56 object-cover hover:opacity-90 transition-opacity"
          />
        </a>
        <div className={`flex items-center justify-between px-2.5 py-1.5 text-[11px] ${isMine ? "bg-black/25 text-white" : "bg-black/10 text-on-surface"}`}>
          <span className="truncate max-w-[170px] font-medium">{att.filename}</span>
          {att.sizeBytes ? <span>{formatFileSize(att.sizeBytes)}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-2 flex items-center gap-2.5 p-2.5 rounded-xl border border-white/20 max-w-[300px] ${isMine ? "bg-black/25 text-white" : "bg-black/5 text-on-surface"}`}>
      <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-lg shrink-0">
        📄
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="m-0 text-xs font-semibold truncate">{att.filename}</p>
        <p className="m-0 text-[10px] opacity-75">
          PDF Document {att.sizeBytes ? `• ${formatFileSize(att.sizeBytes)}` : ""}
        </p>
      </div>
      <a
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        download={att.filename}
        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors shrink-0 ${isMine ? "bg-white/20 hover:bg-white/30 text-white" : "bg-primary text-on-primary hover:bg-primary-container"}`}
      >
        View ↗
      </a>
    </div>
  );
}

function MessagesCenterAuthenticated() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Multi-tenant private inbox state
  const [items, setItems] = useState<Conversation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "offers">("all");
  const [propertyInfo, setPropertyInfo] = useState<PropertySummary | null>(null);

  // Dynamic conversation message stream
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeOffers, setActiveOffers] = useState<PropertyOffer[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // File attachment state
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    previewUrl?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Counter Offer Modal state
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [currentCounterVal, setCurrentCounterVal] = useState<number>(5000000);
  const [currentValidity, setCurrentValidity] = useState<"24 Hours" | "48 Hours">("48 Hours");

  // Floating Toast
  const [toast, setToast] = useState<{ visible: boolean; title: string; desc: string }>({
    visible: false,
    title: "",
    desc: "",
  });

  const streamBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  const showToast = useCallback((title: string, desc: string) => {
    setToast({ visible: true, title, desc });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  }, []);

  // FRONTEND ROUTE PROTECTION: Redirect unauthenticated visitors immediately
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const current =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/messages";
      window.location.replace(`/sign-in?redirect_url=${encodeURIComponent(current)}`);
    }
  }, [isLoaded, isSignedIn]);

  // CLIENT-SIDE SESSION AND CACHE ISOLATION:
  // Flush all private messaging caches and state upon logout or account change.
  useEffect(() => {
    if (previousUserIdRef.current !== undefined && previousUserIdRef.current !== user?.id) {
      setItems([]);
      setSelected("");
      setActiveMessages([]);
      setActiveOffers([]);
      setPropertyInfo(null);
      setPendingAttachment(null);
      setDraft("");
      setInitialLoading(true);
    }
    previousUserIdRef.current = user?.id;
  }, [user?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Invalid File Type", "Please choose a JPG, PNG, WebP image or PDF document.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("File Too Large", "Attachment size must be under 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const isImg = file.type.startsWith("image/");
    setPendingAttachment({
      file,
      previewUrl: isImg ? URL.createObjectURL(file) : undefined,
    });
    showToast("File Ready", `${file.name} attached.`);
  };

  const handleRemoveAttachment = () => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Fetch only authenticated user's conversations
  const fetchMine = useCallback(async () => {
    if (!isSignedIn) {
      setItems([]);
      return [];
    }
    try {
      const token = await getToken().catch(() => null);
      if (!token) {
        setItems([]);
        return [];
      }
      const res = await fetchApi("/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
          return data;
        }
      }
    } catch {
      // Network error - fail closed with empty state
    }
    setItems([]);
    return [];
  }, [getToken, isSignedIn]);

  // Handle Initial Route Selection and Auto-Select on Desktop
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    void (async () => {
      setInitialLoading(true);
      const list = await fetchMine();
      if (cancelled) return;
      setInitialLoading(false);

      const requested =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("conversation")
          : null;
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

      if (requested && list.some((c) => c._id === requested)) {
        setSelected(requested);
      } else if (isDesktop && list[0]?._id) {
        setSelected(list[0]._id);
      } else {
        setSelected("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchMine, isLoaded, isSignedIn]);

  // Keep desktop responsive sync
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !selected && items[0]?._id) {
        setSelected(items[0]._id);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selected, items]);

  // Active conversation - derived strictly from items
  const activeConversation = useMemo(
    () => (selected ? items.find((c) => c._id === selected) || null : null),
    [items, selected]
  );

  // Fetch verified message history and offers for the selected conversation
  useEffect(() => {
    if (!activeConversation?._id || !isSignedIn) {
      setActiveMessages([]);
      setActiveOffers([]);
      return;
    }

    let cancelled = false;
    setLoadingDetails(true);

    void (async () => {
      try {
        const token = await getToken().catch(() => null);
        if (!token) return;

        // Fetch paginated messages
        const msgRes = await fetchApi(
          `/conversations?id=${encodeURIComponent(activeConversation._id)}&action=messages&limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (msgRes.ok && !cancelled) {
          const msgData = await msgRes.json();
          if (Array.isArray(msgData?.messages)) {
            setActiveMessages(msgData.messages);
          }
        }

        // Fetch associated offers
        const offerRes = await fetchApi(
          `/conversations?id=${encodeURIComponent(activeConversation._id)}&action=offers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (offerRes.ok && !cancelled) {
          const offerData = await offerRes.json();
          if (Array.isArray(offerData)) {
            setActiveOffers(offerData);
          }
        }

        // Mark conversation as read
        void fetchApi("/conversations", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: activeConversation._id,
            action: "read",
          }),
        }).catch(() => null);
      } catch (err) {
        console.warn("Failed to load conversation details:", err);
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConversation?._id, getToken, isSignedIn]);

  // Fetch real property details for active thread
  useEffect(() => {
    if (!activeConversation) {
      setPropertyInfo(null);
      return;
    }

    const targetProperty = activeConversation.propertyId || activeConversation.propertySlug;
    if (!targetProperty) return;

    const controller = new AbortController();
    void fetchApi(`/properties?id=${encodeURIComponent(targetProperty)}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Property info unavailable");
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          const item =
            data?.items?.[0] || data?.property || data?.result || data?.data || data;
          if (item && typeof item === "object") {
            setPropertyInfo(item);
            if (item.priceAmount && typeof item.priceAmount === "number") {
              setCurrentCounterVal(Math.round(item.priceAmount * 0.96));
            }
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPropertyInfo(null);
        }
      });

    return () => controller.abort();
  }, [activeConversation]);

  // Dynamic property details derived strictly from API
  const propertyAskingPrice = propertyInfo?.priceAmount || 0;
  const propertyTitle =
    propertyInfo?.title || activeConversation?.propertyTitle || "Property Discussion";
  const otherPartyName = useMemo(() => {
    if (!activeConversation) return "Owner";
    if (activeConversation.contactName) return activeConversation.contactName;
    if (user?.id === activeConversation.ownerId) {
      return "Buyer Inquiry";
    }
    return propertyInfo?.contactName ? `${propertyInfo.contactName} (Owner)` : "Property Owner";
  }, [activeConversation, user?.id, propertyInfo?.contactName]);

  const rawOwnerName = otherPartyName.replace(/\s*\(Owner\)/i, "");
  const ownerPhone = propertyInfo?.contactPhone?.trim() || "";
  const propertyThumb =
    propertyInfo?.imageUrls?.find((url) => /^https?:\/\//i.test(url)) ||
    activeConversation?.thumbUrl ||
    DEFAULT_PROPERTY_THUMB;

  const plotArea = propertyInfo?.areaValue
    ? `${propertyInfo.areaValue} ${propertyInfo.areaUnit || "sq.ft"}`
    : "Spacious Layout";
  const plotFacing = propertyInfo?.facing || "North-East";
  const plotRegistry = propertyInfo?.ownershipType || "Clear Title";

  const diffFromAsk = propertyAskingPrice > 0 ? propertyAskingPrice - currentCounterVal : 0;
  const brokerSavedLakhs =
    propertyAskingPrice > 0
      ? Math.max(1.0, (propertyAskingPrice * 0.02) / 100000).toFixed(1)
      : "1.5";

  // Send message
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation) return;

    const text = draft.trim();
    if ((!text && !pendingAttachment) || sending) return;

    setSending(true);
    let uploadedAttachment: MessageAttachment | undefined = undefined;

    if (pendingAttachment) {
      try {
        const token = await getToken().catch(() => null);
        const uploadFormData = new FormData();
        uploadFormData.append("file", pendingAttachment.file);

        const uploadRes = await fetch("/api/v1/conversations/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData?.url) {
            uploadedAttachment = {
              url: uploadData.url,
              filename: uploadData.filename || pendingAttachment.file.name,
              contentType: uploadData.contentType || pendingAttachment.file.type,
              sizeBytes: uploadData.sizeBytes || pendingAttachment.file.size,
              publicId: uploadData.publicId,
            };
          }
        }
      } catch (err) {
        console.warn("Upload error:", err);
      }

      if (!uploadedAttachment && pendingAttachment) {
        uploadedAttachment = {
          url: pendingAttachment.previewUrl || URL.createObjectURL(pendingAttachment.file),
          filename: pendingAttachment.file.name,
          contentType: pendingAttachment.file.type,
          sizeBytes: pendingAttachment.file.size,
        };
      }
    }

    const optimisticMsg: Message = {
      _id: `temp-${Date.now()}`,
      senderId: user?.id || "",
      text,
      attachment: uploadedAttachment,
      sentAt: new Date().toISOString(),
    };

    setActiveMessages((prev) => [...prev, optimisticMsg]);
    setDraft("");
    setPendingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setTimeout(() => {
      streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const token = await getToken().catch(() => null);
      const res = await fetchApi("/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          text,
          attachment: uploadedAttachment,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload?.message) {
          setActiveMessages((prev) =>
            prev.map((m) => (m._id === optimisticMsg._id ? payload.message : m))
          );
        }
      }
    } catch {
      // Local optimistic message remains visible
    } finally {
      setSending(false);
    }
  };

  // Submit Offer / Counter Offer
  const handleSubmitCounterOffer = async () => {
    if (!activeConversation) return;
    const formattedPrice = formatCrLakh(currentCounterVal);
    const fullINR = "₹" + formatINR(currentCounterVal);
    setOfferModalOpen(false);

    showToast(
      "Offer Relayed!",
      `${formattedPrice} proposal submitted with ₹50,000 Token Escrow.`
    );

    const pendingOffer = activeOffers.find((o) => o.status === "pending");
    try {
      const token = await getToken().catch(() => null);
      if (pendingOffer && pendingOffer.recipientId === user?.id) {
        // Counter existing pending offer
        const res = await fetchApi("/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            conversationId: activeConversation._id,
            action: "counter",
            offerId: pendingOffer._id,
            amount: currentCounterVal,
            message: `Formal counter offer of ${fullINR} proposed with ₹50,000 Token Escrow. Valid for ${currentValidity}.`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.offer) {
            setActiveOffers((prev) => [
              ...prev.map((o) => (o._id === pendingOffer._id ? { ...o, status: "countered" as const } : o)),
              data.offer,
            ]);
          }
        }
      } else {
        // Create initial proposal
        const res = await fetchApi("/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            conversationId: activeConversation._id,
            action: "offer",
            amount: currentCounterVal,
            message: `Formal offer of ${fullINR} proposed with ₹50,000 Token Escrow. Valid for ${currentValidity}.`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.offer) {
            setActiveOffers((prev) => [...prev, data.offer]);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to submit offer:", err);
    }
  };

  // Filtered list for search and categories
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeFilter === "unread") {
      result = items.filter((c) => (c.unreadCountByUser?.[user?.id || ""] || 0) > 0);
    } else if (activeFilter === "offers") {
      result = items.filter(
        (c) =>
          c.messages?.some((m) => /counter|offer|proposal|₹|locked/i.test(m.text)) ||
          Boolean(c.statusBadge)
      );
    }

    const q = searchText.trim().toLowerCase();
    if (!q) return result;
    return result.filter((c) =>
      [
        c.propertyTitle,
        c.propertySlug,
        c.contactName,
        c.messages?.[c.messages.length - 1]?.text,
      ].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [items, activeFilter, searchText, user?.id]);

  // Open conversation handler
  const handleOpenConversation = (convId: string) => {
    setSelected(convId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/messages?conversation=${encodeURIComponent(convId)}`);
    }
  };

  // Back button inside Chat Room
  const handleChatBack = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    if (isMobile) {
      setSelected("");
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("conversation");
        window.history.replaceState(null, "", url.pathname);
      }
    } else {
      if (typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/search";
      }
    }
  };

  // Back button on Mobile Inbox header
  const handleInboxBack = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/search";
      }
    }
  };

  // Unauthenticated Visitor State: Render clean redirecting state
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="messages-workspace-root">
        <div className="stitch-desktop-navbar-wrap">
          <SiteHeader active="messages" />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-on-surface m-0">
            {isLoaded ? "Redirecting to sign in…" : "Loading secure messaging workspace…"}
          </p>
          <p className="text-xs text-outline mt-1 m-0">
            {isLoaded
              ? "Private messaging requires an active session."
              : "Verifying your security credentials…"}
          </p>
        </div>
      </div>
    );
  }

  // Initial loading state while fetching verified inbox
  if (initialLoading) {
    return (
      <div className="messages-workspace-root">
        <div className="stitch-desktop-navbar-wrap">
          <SiteHeader active="messages" />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-on-surface m-0">Loading your inbox…</p>
          <p className="text-xs text-outline mt-1 m-0">Retrieving authorized buyer and owner negotiations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-workspace-root">
      {/* Desktop Site Navbar */}
      <div className="stitch-desktop-navbar-wrap">
        <SiteHeader active="messages" />
      </div>

      <div className={`stitch-chat-shell ${selected ? "is-chat-mode" : "is-inbox-mode"}`}>
        {/* =====================================================================
            VIEW A: MOBILE CONVERSATIONS LIST (Shown on Mobile when no conversation is selected)
            ===================================================================== */}
        <div className="stitch-mobile-inbox-view">
          {/* Mobile Inbox Header */}
          <header className="stitch-inbox-header">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="stitch-header-back-btn"
                onClick={handleInboxBack}
                aria-label="Back to explore"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-[18px] font-bold text-on-surface m-0">
                  Messages
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                  {items.length} Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[11px] font-bold text-secondary bg-secondary-container/40 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[13px] text-secondary">shield</span>
                Escrow Protected
              </span>
            </div>
          </header>

          {/* Search Box & Filters */}
          <div className="stitch-inbox-search-filter">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search conversations, properties…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low text-xs text-on-surface placeholder:text-outline border border-transparent focus:border-primary/40 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border-none cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("unread")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border-none cursor-pointer ${
                  activeFilter === "unread"
                    ? "bg-primary text-on-primary shadow-xs font-bold"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("offers")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border-none cursor-pointer ${
                  activeFilter === "offers"
                    ? "bg-primary text-on-primary shadow-xs font-bold"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                Offers ({items.filter((c) => Boolean(c.statusBadge)).length})
              </button>
            </div>
          </div>

          {/* Conversations List / Empty State */}
          <div className="stitch-inbox-list">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
                  <span className="material-symbols-outlined text-[28px]">chat_bubble_outline</span>
                </div>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface m-0 mb-1">
                  No conversations yet
                </h3>
                <p className="text-xs text-on-surface-variant max-w-[240px] m-0 mb-4 leading-relaxed">
                  When you inquire about a property or buyers message you, your direct negotiations will appear here.
                </p>
                <a
                  href="/search"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container transition-all"
                >
                  Explore Properties
                </a>
              </div>
            ) : (
              filteredItems.map((conv) => {
                const last = conv.messages?.[conv.messages.length - 1];
                const thumb = conv.thumbUrl || DEFAULT_PROPERTY_THUMB;
                const contact = conv.contactName || "Property Owner";

                return (
                  <div
                    key={conv._id}
                    onClick={() => handleOpenConversation(conv._id)}
                    role="button"
                    tabIndex={0}
                    className="stitch-inbox-card active:scale-[0.98] transition-all"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container shadow-xs">
                      <img src={thumb} alt={conv.propertyTitle} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-[8.5px] text-on-primary font-bold text-center py-0.2 leading-none">
                        VERIFIED
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-bold text-xs text-on-surface truncate">
                            {contact}
                          </span>
                          <span className="material-symbols-outlined text-[13px] text-secondary shrink-0">
                            verified
                          </span>
                        </div>
                        <span className="text-[10px] text-outline font-medium shrink-0">
                          {formatRelativeTime(last?.sentAt || conv.lastMessageAt)}
                        </span>
                      </div>

                      <p className="text-[11.5px] font-semibold text-on-surface truncate m-0 mb-0.5">
                        {conv.propertyTitle}
                      </p>

                      <p className="text-[11px] text-on-surface-variant truncate m-0 leading-tight">
                        {last?.text || "Direct inquiry"}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        {conv.statusBadge && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-extrabold text-[9.5px]">
                            {conv.statusBadge}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded-md bg-surface-container text-outline font-medium text-[9.5px]">
                          Zero Brokerage
                        </span>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-[18px] text-outline-variant shrink-0">
                      chevron_right
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 text-center text-[10.5px] text-outline bg-surface border-t border-outline-variant/20 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>100% Direct Seller Conversations • Zero Platform Fee</span>
          </div>
        </div>

        {/* =====================================================================
            VIEW B: ACTIVE CHAT SCREEN + DESKTOP SIDEBAR
            ===================================================================== */}
        <div className="stitch-chat-active-container">
          {/* Header */}
          <header className="stitch-chat-header">
            <div className="stitch-chat-header-inner">
              <div className="stitch-chat-header-left">
                <button
                  aria-label="Go back to messages list"
                  className="stitch-header-back-btn"
                  onClick={handleChatBack}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>

                {activeConversation && (
                  <div className="stitch-avatar-group">
                    <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-xs">
                      {rawOwnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="stitch-status-pip bg-secondary" title="Active"></span>
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-headline-sm text-sm text-on-surface m-0 truncate font-bold">
                      {activeConversation ? otherPartyName : "Negotiations"}
                    </h2>
                    {activeConversation && (
                      <span className="material-symbols-outlined text-[15px] text-secondary">
                        verified
                      </span>
                    )}
                  </div>
                  <p className="font-body-sm text-[11px] text-on-surface-variant m-0 truncate">
                    {activeConversation
                      ? `${propertyTitle} • Zero Brokerage`
                      : "Direct Buyer-Owner Channels"}
                  </p>
                </div>
              </div>

              {activeConversation && (
                <div className="flex items-center gap-2">
                  {ownerPhone && (
                    <a
                      href={`tel:${ownerPhone}`}
                      className="stitch-header-circle-btn text-on-surface"
                      aria-label="Direct owner phone"
                      title="Direct owner phone"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                    </a>
                  )}
                  <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-secondary bg-secondary-container/40 px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[13px] text-secondary">shield</span>
                    Escrow Protected
                  </span>
                </div>
              )}
            </div>
          </header>

          <div className="stitch-chat-layout-body">
            {/* COLUMN 1: DESKTOP INBOX SIDEBAR */}
            <aside className="stitch-desktop-sidebar-column">
              <div className="p-3 border-b border-outline-variant/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-outline m-0">
                    Negotiations ({items.length})
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary-container/30 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px] text-secondary">shield</span>
                    Escrow
                  </span>
                </div>
                <div className="relative w-full mb-2">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-outline pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search conversations…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container-low text-xs text-on-surface placeholder:text-outline border border-outline-variant/30 focus:border-primary/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors ${
                      activeFilter === "all"
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    All ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("unread")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-colors ${
                      activeFilter === "unread"
                        ? "bg-primary text-on-primary shadow-xs font-bold"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    Unread
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("offers")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-colors ${
                      activeFilter === "offers"
                        ? "bg-primary text-on-primary shadow-xs font-bold"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    Offers ({items.filter((c) => Boolean(c.statusBadge)).length})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 stitch-custom-scrollbar">
                {filteredItems.length === 0 ? (
                  <div className="p-6 text-center text-outline">
                    <span className="material-symbols-outlined text-[24px] mb-1">chat</span>
                    <p className="text-xs m-0">No conversations</p>
                  </div>
                ) : (
                  filteredItems.map((conv) => {
                    const isSelected = conv._id === selected;
                    const contact = conv.contactName || "Property Owner";
                    const cleanName = contact.replace(/\s*\(Owner\)/i, "");
                    const initials =
                      cleanName
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "PO";
                    const lastMsg = conv.messages?.[conv.messages.length - 1];

                    return (
                      <button
                        key={conv._id}
                        type="button"
                        onClick={() => handleOpenConversation(conv._id)}
                        className={`w-full p-3 rounded-2xl text-left flex items-start gap-3 transition-all border-none cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-l-4 border-l-primary shadow-xs ring-1 ring-primary/20"
                            : "hover:bg-surface-container-low/70 bg-transparent"
                        }`}
                      >
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                              isSelected
                                ? "bg-gradient-to-tr from-primary to-primary-container text-on-primary"
                                : "bg-surface-container text-on-surface-variant"
                            }`}
                          >
                            {initials}
                          </div>
                          <span
                            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-secondary ring-2 ring-surface-container-lowest"
                            title="Active"
                          ></span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs text-on-surface truncate">
                                {cleanName}
                              </span>
                              <span className="material-symbols-outlined text-[14px] text-secondary shrink-0">
                                verified
                              </span>
                            </div>
                            <span className="text-[10px] text-outline font-medium shrink-0">
                              {formatRelativeTime(lastMsg?.sentAt || conv.lastMessageAt)}
                            </span>
                          </div>

                          <p className="font-semibold text-xs text-on-surface truncate m-0 mb-1">
                            {conv.propertyTitle}
                          </p>

                          <p className="text-[11px] text-on-surface-variant truncate m-0 leading-tight">
                            {lastMsg?.text || "Direct discussion"}
                          </p>

                          {conv.statusBadge && (
                            <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-extrabold text-[9px]">
                              {conv.statusBadge}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* COLUMN 2: CENTRAL MESSAGING PANE */}
            {activeConversation ? (
              <main className="stitch-chat-main-column">
                {/* Property Context Strip */}
                <section className="stitch-property-summary-bar">
                  <div className="stitch-property-card-compact">
                    <div className="stitch-property-thumb-wrap">
                      <img
                        src={propertyThumb}
                        alt={propertyTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-headline-sm text-sm text-primary font-extrabold">
                          {propertyAskingPrice > 0 ? formatCrLakh(propertyAskingPrice) : "Price on Request"}
                        </span>
                        <span className="font-label-sm text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                          Direct Deal
                        </span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface font-semibold truncate m-0">
                        {propertyTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setOfferModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary-container transition-all border-none cursor-pointer"
                      >
                        Make Offer
                      </button>
                    </div>
                  </div>
                </section>

                {/* Message Stream */}
                <div className="stitch-chat-stream">
                  <div className="flex items-center justify-center my-1">
                    <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[11px] shadow-sm tracking-wide font-medium">
                      Today • Private Negotiation
                    </span>
                  </div>

                  {/* Security Notice */}
                  <div className="w-full bg-surface-container-low rounded-xl p-3 flex items-start gap-2.5 shadow-sm border border-outline-variant/20">
                    <span
                      className="material-symbols-outlined text-primary text-[18px] mt-0.5 flex-shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                    <div className="flex-1">
                      <p className="font-label-sm text-label-sm text-primary font-bold m-0 mb-0.5">
                        Apna Ghar Escrow &amp; Masked Direct Connect
                      </p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant leading-snug m-0">
                        Private P2P chat room. Direct deals with zero commission. Phone numbers remain
                        masked until mutual verification.
                      </p>
                    </div>
                  </div>

                  {/* Loading indicator for detailed messages */}
                  {loadingDetails && (
                    <div className="text-center py-4 text-xs text-outline">
                      Loading conversation history…
                    </div>
                  )}

                  {/* Real Messages Stream */}
                  {activeMessages.map((m, idx) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div
                        key={m._id || `msg-${idx}`}
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          isMine ? "items-end self-end" : "items-start self-start"
                        }`}
                      >
                        {!isMine && (
                          <div className="flex items-center gap-1.5 px-1 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                            <span className="font-label-sm text-xs text-on-surface font-bold">
                              {rawOwnerName}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-xs ${
                            isMine
                              ? "bg-primary text-on-primary rounded-tr-xs shadow-md"
                              : "bg-surface-container-low text-on-surface rounded-tl-xs border border-outline-variant/30"
                          }`}
                        >
                          {renderMessageAttachment(m.attachment, isMine)}
                          {m.text && (
                            <p className="font-body-md text-sm leading-relaxed m-0 whitespace-pre-wrap">
                              {m.text}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-[11px] px-1">
                          <span>{formatRelativeTime(m.sentAt)}</span>
                          {isMine && (
                            <span className="material-symbols-outlined text-secondary-fixed-dim text-[14px]">
                              done_all
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Real Verified Offers Stream */}
                  {activeOffers.map((offer) => {
                    const isMyOffer = offer.senderId === user?.id;
                    return (
                      <div
                        key={offer._id}
                        className={`w-full bg-surface-container-low rounded-2xl p-4 shadow-sm border-l-4 ${
                          offer.status === "accepted"
                            ? "border-l-secondary"
                            : "border-l-primary"
                        } flex flex-col gap-3 border border-outline-variant/30`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                              <span className="material-symbols-outlined text-[20px]">
                                handshake
                              </span>
                            </span>
                            <div>
                              <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold block">
                                {isMyOffer ? "You Submitted an Offer" : "Offer Received"}
                              </span>
                              <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight m-0 font-bold">
                                {formatCrLakh(offer.amount)}
                              </h4>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-surface-container text-primary font-label-sm text-[11px] font-bold capitalize">
                            {offer.status}
                          </span>
                        </div>
                        {offer.message && (
                          <p className="font-body-sm text-[12px] text-on-surface-variant m-0 leading-normal">
                            {offer.message}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <div ref={streamBottomRef} />
                </div>

                {/* Composer + Suggestions */}
                <div className="stitch-bottom-anchor">
                  <div className="stitch-chips-tray">
                    <button
                      type="button"
                      className="stitch-chip-btn bg-surface-container-lowest text-on-surface"
                      onClick={() => setDraft("Visit this weekend?")}
                    >
                      📅 Visit this weekend?
                    </button>
                    <button
                      type="button"
                      className="stitch-chip-btn bg-surface-container-low text-on-surface"
                      onClick={() => setDraft("Is the price negotiable?")}
                    >
                      🏷️ Is the price negotiable?
                    </button>
                    <button
                      type="button"
                      className="stitch-chip-btn bg-surface-container-low text-on-surface"
                      onClick={() => setDraft("Can you share draft legal documents?")}
                    >
                      📑 Share documents?
                    </button>
                  </div>

                  <div className="stitch-composer-wrap">
                    {pendingAttachment && (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-surface-container-low rounded-xl mb-2 border border-outline-variant/40">
                        {pendingAttachment.previewUrl ? (
                          <img
                            src={pendingAttachment.previewUrl}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-outline-variant/30 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold text-lg shrink-0">
                            📄
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold text-on-surface truncate m-0">
                            {pendingAttachment.file.name}
                          </p>
                          <p className="text-[11px] text-on-surface-variant m-0">
                            {formatFileSize(pendingAttachment.file.size)} • Ready to send
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-red-500 hover:bg-surface-container transition-colors cursor-pointer border-0 bg-transparent"
                          aria-label="Remove attachment"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    )}

                    <form
                      className="stitch-composer-form"
                      onSubmit={(e) => void handleSendMessage(e)}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                      />

                      <button
                        aria-label="Attach documents or photos"
                        className={`stitch-composer-icon-btn ${
                          pendingAttachment ? "text-primary" : ""
                        }`}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach photo (JPG, PNG, WebP) or document (PDF)"
                      >
                        <span className="material-symbols-outlined text-[20px]">attach_file</span>
                      </button>

                      <input
                        ref={inputRef}
                        autoComplete="off"
                        className="stitch-composer-input"
                        placeholder={`Message ${rawOwnerName} directly…`}
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleSendMessage();
                          }
                        }}
                      />

                      <button
                        aria-label="Send message"
                        className="stitch-composer-send-btn"
                        type="submit"
                        disabled={sending || (!draft.trim() && !pendingAttachment)}
                      >
                        <span className="material-symbols-outlined text-[20px]">send</span>
                      </button>
                    </form>

                    <div className="flex items-center justify-center gap-1.5 pt-1.5 pb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span className="font-label-sm text-[10.5px] text-on-surface-variant tracking-wide font-medium">
                        100% Direct Seller Conversation • Zero Platform Fee • RBI-Regulated Escrow
                      </span>
                    </div>
                  </div>
                </div>
              </main>
            ) : (
              <main className="stitch-chat-main-column flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest/30">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-3">
                  <span className="material-symbols-outlined text-[32px]">forum</span>
                </div>
                <h2 className="font-headline-sm text-base font-bold text-on-surface m-0 mb-1">
                  {items.length === 0 ? "Your Private Inbox is Empty" : "Select a conversation"}
                </h2>
                <p className="text-xs text-on-surface-variant max-w-sm m-0 mb-4 leading-relaxed">
                  {items.length === 0
                    ? "When you enquire about a property, your direct negotiation, counter-offers, and escrow receipts will appear here."
                    : "Choose a conversation from the list to view messages and negotiate directly with the owner."}
                </p>
                {items.length === 0 && (
                  <a
                    href="/search"
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container transition-all"
                  >
                    Browse Verified Homes
                  </a>
                )}
              </main>
            )}

            {/* COLUMN 3: RIGHT DETAILS DRAWER */}
            <aside className="stitch-desktop-dossier-column stitch-custom-scrollbar">
              {activeConversation ? (
                <>
                  <div className="stitch-dossier-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-sm text-[11px] uppercase font-bold text-outline tracking-wider">
                        Property Dossier
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                        Verified Listing
                      </span>
                    </div>

                    <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 bg-surface-container group">
                      <img
                        src={propertyThumb}
                        alt={propertyTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <h3 className="font-headline-sm text-sm text-on-surface font-bold m-0 mb-1 truncate">
                      {propertyTitle}
                    </h3>
                    <p className="font-body-sm text-[11px] text-on-surface-variant m-0 mb-3 truncate">
                      {[
                        propertyInfo?.location?.locality,
                        propertyInfo?.location?.city,
                        propertyInfo?.location?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "India"}
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-container-low rounded-xl mb-3">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[9.5px] text-outline">Configuration</span>
                        <span className="font-label-lg text-xs text-on-surface font-bold">
                          {propertyInfo?.bedrooms ? `${propertyInfo.bedrooms} BHK` : "Residential"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[9.5px] text-outline">Super Built-up</span>
                        <span className="font-label-lg text-xs text-on-surface font-bold">
                          {plotArea}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[9.5px] text-outline">Orientation</span>
                        <span className="font-label-lg text-xs text-on-surface font-bold">
                          {plotFacing}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[9.5px] text-outline">Ownership Title</span>
                        <span className="font-label-lg text-xs text-on-surface font-bold truncate">
                          {plotRegistry}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-outline-variant/30">
                      <span className="font-label-sm text-[11px] text-outline">Asking Price:</span>
                      <span className="font-headline-md text-sm text-primary font-extrabold">
                        {propertyAskingPrice > 0 ? formatCrLakh(propertyAskingPrice) : "Price on Request"}
                      </span>
                    </div>
                  </div>

                  <div className="stitch-dossier-card bg-gradient-to-br from-surface-container-lowest to-surface-container-low border-l-4 border-l-secondary">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[16px]">shield</span>
                      </div>
                      <span className="font-label-md text-xs text-on-surface font-bold">
                        Apna Ghar Escrow Shield
                      </span>
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant m-0 mb-3 leading-relaxed">
                      Token deposits are parked safely under RBI nodal trustee guidelines until title deed
                      mutation and mutual agreement execution.
                    </p>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-[10.5px]">
                      <span className="flex items-center gap-1 text-secondary font-bold">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        100% Refundable
                      </span>
                      <span className="text-outline font-medium">Zero Brokerage Fee</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="stitch-dossier-card text-center p-6 text-outline">
                  <span className="material-symbols-outlined text-[28px] mb-2">apartment</span>
                  <p className="text-xs font-bold text-on-surface m-0 mb-1">Property Dossier</p>
                  <p className="text-[11px] m-0">
                    Select an active conversation to view property specifications and seller verification.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* Counter-Offer Modal */}
        {offerModalOpen && activeConversation && (
          <div
            className="stitch-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOfferModalOpen(false);
            }}
          >
            <div className="stitch-bottom-sheet animate-in slide-in-from-bottom">
              <div className="w-12 h-1.5 rounded-full bg-outline-variant/60 mx-auto -mt-1 mb-1"></div>

              <div className="flex items-center justify-between pb-1 border-b border-outline-variant/30">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 font-bold">
                    Submit Offer / Counter Bid
                  </h3>
                  <p className="font-body-sm text-[12px] text-on-surface-variant m-0">
                    Direct negotiation with {rawOwnerName}
                  </p>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors border-none cursor-pointer"
                  onClick={() => setOfferModalOpen(false)}
                  type="button"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between text-on-surface border border-outline-variant/30">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-bold truncate">
                    Property
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                    {propertyTitle}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                    Asking Price
                  </span>
                  <span className="font-headline-sm text-[14px] font-bold text-primary">
                    {propertyAskingPrice > 0 ? formatCrLakh(propertyAskingPrice) : "Open"}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase">
                    Your Proposed Price
                  </label>
                  {propertyAskingPrice > 0 && (
                    <span
                      className={`font-label-sm text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        diffFromAsk > 0
                          ? "text-secondary bg-secondary-container"
                          : diffFromAsk === 0
                          ? "text-primary bg-primary/10"
                          : "text-on-surface bg-surface-container"
                      }`}
                    >
                      {diffFromAsk > 0
                        ? `-₹${(diffFromAsk / 100000).toFixed(1)} L vs Ask`
                        : diffFromAsk === 0
                        ? "At Asking Price"
                        : `+₹${(Math.abs(diffFromAsk) / 100000).toFixed(1)} L Above Ask`}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[18px] flex items-center justify-center active:scale-95 transition-all border-none cursor-pointer"
                    onClick={() => setCurrentCounterVal((v) => Math.max(100000, v - 100000))}
                    type="button"
                  >
                    -1L
                  </button>
                  <div className="flex-1 flex items-center justify-center bg-surface-container-lowest rounded-xl py-2 px-3 border border-outline-variant/40">
                    <span className="font-headline-lg-mobile text-[22px] text-primary font-bold mr-1">
                      ₹
                    </span>
                    <input
                      className="w-full bg-transparent font-headline-lg-mobile text-[22px] font-bold text-on-surface text-center outline-none tracking-tight border-none"
                      type="text"
                      value={formatINR(currentCounterVal)}
                      onChange={(e) => {
                        const cleaned = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                        if (!isNaN(cleaned)) setCurrentCounterVal(cleaned);
                      }}
                    />
                  </div>
                  <button
                    className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[18px] flex items-center justify-center active:scale-95 transition-all border-none cursor-pointer"
                    onClick={() => setCurrentCounterVal((v) => v + 100000)}
                    type="button"
                  >
                    +1L
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0">
                    savings
                  </span>
                  <div className="min-w-0">
                    <span className="font-label-sm text-[10px] text-on-surface-variant block uppercase font-bold">
                      Zero Brokerage
                    </span>
                    <span className="font-label-md text-label-md text-secondary font-bold">
                      ₹{brokerSavedLakhs} L Saved
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col justify-center">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                    Validity Period
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className={`flex-1 py-1 rounded-lg font-label-sm text-[11px] font-bold transition-all border-none cursor-pointer ${
                        currentValidity === "24 Hours"
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                      onClick={() => setCurrentValidity("24 Hours")}
                      type="button"
                    >
                      24h
                    </button>
                    <button
                      className={`flex-1 py-1 rounded-lg font-label-sm text-[11px] font-bold transition-all border-none cursor-pointer ${
                        currentValidity === "48 Hours"
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                      onClick={() => setCurrentValidity("48 Hours")}
                      type="button"
                    >
                      48h
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary font-headline-sm text-[16px] font-bold shadow-lg hover:bg-primary-container active:scale-95 transition-all text-center flex items-center justify-center gap-2 border-none cursor-pointer"
                  onClick={handleSubmitCounterOffer}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">handshake</span>
                  <span>Submit Offer • {formatCrLakh(currentCounterVal)}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Toast */}
        {toast.visible && (
          <div className="stitch-floating-toast animate-in slide-in-from-top">
            <span className="material-symbols-outlined text-secondary-fixed text-[22px]">
              check_circle
            </span>
            <div className="flex-1 text-left">
              <p className="font-label-md text-label-md font-bold text-inverse-on-surface m-0">
                {toast.title}
              </p>
              <p className="font-body-sm text-[11px] text-inverse-on-surface/80 m-0">
                {toast.desc}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesCenter() {
  return <MessagesCenterAuthenticated />;
}
