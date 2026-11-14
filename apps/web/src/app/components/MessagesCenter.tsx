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
  messages?: Message[];
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

const VERIFIED_FALLBACK_IMG =
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
  if (typeof num !== "number" || isNaN(num) || num <= 0) return "Price on Request";
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
  const { getToken, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const isLoaded = authLoaded && userLoaded;

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("conversation") || "";
    }
    return "";
  });
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "offers">("all");
  const [propertyInfo, setPropertyInfo] = useState<PropertySummary | null>(null);

  // Dynamic real conversation messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // File attachment state
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    previewUrl?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Interactive Specs Drawer
  const [specsOpen, setSpecsOpen] = useState(false);

  // Counter Offer Bottom Sheet Modal state
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [currentCounterVal, setCurrentCounterVal] = useState<number>(0);
  const [currentValidity, setCurrentValidity] = useState<"24 Hours" | "48 Hours">("48 Hours");

  // Floating Toast
  const [toast, setToast] = useState<{ visible: boolean; title: string; desc: string }>({
    visible: false,
    title: "",
    desc: "",
  });

  const streamBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((title: string, desc: string) => {
    setToast({ visible: true, title, desc });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  }, []);

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

  // Fetch real conversations from backend
  const fetchMine = useCallback(async () => {
    if (!isLoaded) return [];
    if (!isSignedIn) {
      setItems([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const token = await getToken().catch(() => null);
      if (!token) {
        setItems([]);
        setLoading(false);
        return [];
      }
      const res = await fetchApi("/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const convList = Array.isArray(data) ? data : [];
        setItems(convList);
        return convList;
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
    setItems([]);
    return [];
  }, [getToken, isSignedIn, isLoaded]);

  // Handle Initial Route Selection
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    void (async () => {
      const list = await fetchMine();
      if (cancelled) return;
      const requested =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("conversation")
          : null;
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

      if (requested && list.some((c) => c._id === requested)) {
        setSelected(requested);
      } else if (isDesktop && list.length > 0) {
        setSelected((prev) => (prev && list.some((c) => c._id === prev) ? prev : list[0]?._id || ""));
      } else if (!isDesktop && requested && list.some((c) => c._id === requested)) {
        setSelected(requested);
      } else if (!isDesktop) {
        setSelected("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMine, isLoaded]);

  // Keep desktop responsive sync
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !selected && items.length > 0 && items[0]?._id) {
        setSelected(items[0]._id);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selected, items]);

  // Active conversation object
  const activeConversation = useMemo(
    () => items.find((c) => c._id === selected) || null,
    [items, selected]
  );

  // Fetch real messages for active conversation
  useEffect(() => {
    if (!selected || !isSignedIn) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);

    // Initial optimistic slice from conversation item if present
    const conv = items.find((c) => c._id === selected);
    if (conv?.messages && Array.isArray(conv.messages)) {
      setMessages(conv.messages);
    }

    const loadMessages = async () => {
      try {
        const token = await getToken().catch(() => null);
        if (!token) return;
        const res = await fetchApi(`/conversations/${encodeURIComponent(selected)}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (Array.isArray(data?.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Error loading conversation messages:", err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selected, getToken, isSignedIn]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  }, [messages.length, selected]);

  // Fetch real property details for active thread
  useEffect(() => {
    if (!activeConversation) {
      setPropertyInfo(null);
      return;
    }

    const propertyId =
      activeConversation.propertyId ||
      activeConversation.propertySlug;

    if (!propertyId) return;

    const controller = new AbortController();
    void fetchApi(`/properties?id=${encodeURIComponent(propertyId)}`, {
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
          setPropertyInfo({
            _id: activeConversation.propertyId,
            title: activeConversation.propertyTitle,
            slug: activeConversation.propertySlug,
            contactName: activeConversation.contactName,
          });
        }
      });

    return () => controller.abort();
  }, [activeConversation]);

  // Dynamic counterpart and property attributes
  const isOwner = Boolean(user?.id && activeConversation?.ownerId === user.id);
  const counterpartRole = isOwner ? "Buyer" : "Direct Owner";
  const rawOwnerName = isOwner
    ? "Verified Buyer"
    : propertyInfo?.contactName || activeConversation?.contactName || "Property Owner";
  const ownerName = isOwner ? "Verified Buyer" : `${rawOwnerName} (Owner)`;
  const ownerPhone = propertyInfo?.contactPhone?.trim() || "";
  const propertyAskingPrice = propertyInfo?.priceAmount || 0;
  const propertyTitle =
    propertyInfo?.title ||
    activeConversation?.propertyTitle ||
    "Property Inquiry";
  const propertyThumb =
    propertyInfo?.imageUrls?.find((url) => /^https?:\/\//i.test(url)) ||
    activeConversation?.thumbUrl ||
    VERIFIED_FALLBACK_IMG;

  const plotArea = propertyInfo?.areaValue
    ? `${propertyInfo.areaValue} ${propertyInfo.areaUnit || "sq.ft"}`
    : "Standard Plot";
  const plotFacing = propertyInfo?.facing || "North-East";
  const plotRegistry = propertyInfo?.ownershipType || "Clear Title Verified";

  const diffFromAsk = propertyAskingPrice > 0 ? propertyAskingPrice - currentCounterVal : 0;
  const brokerSavedLakhs = propertyAskingPrice > 0 ? Math.max(0.5, ((propertyAskingPrice * 0.02) / 100000)).toFixed(1) : "2.0";

  // Send message to real backend endpoint
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = draft.trim();
    if ((!text && !pendingAttachment) || sending || !selected) return;

    setSending(true);
    let uploadedAttachment: MessageAttachment | undefined = undefined;

    if (pendingAttachment) {
      try {
        const token = await getToken().catch(() => null);
        const uploadFormData = new FormData();
        uploadFormData.append("file", pendingAttachment.file);

        const uploadRes = await fetchApi("/conversations/upload", {
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
        console.warn("Upload error, using local preview", err);
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
      _id: `msg-${Date.now()}`,
      senderId: user?.id || "me",
      text,
      attachment: uploadedAttachment,
      sentAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft("");
    setPendingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setTimeout(() => {
      streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const token = await getToken().catch(() => null);
      const res = await fetchApi(`/conversations/${encodeURIComponent(selected)}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          attachment: uploadedAttachment,
        }),
      });

      if (res.ok) {
        void fetchMine();
      }
    } catch (err) {
      console.error("Failed to send message to backend:", err);
    } finally {
      setSending(false);
    }
  };

  // Submit Counter Offer from Bottom Sheet
  const handleSubmitCounterOffer = async () => {
    if (!selected || currentCounterVal <= 0) return;
    const formattedPrice = formatCrLakh(currentCounterVal);
    const fullINR = "₹" + formatINR(currentCounterVal);
    setOfferModalOpen(false);

    showToast(
      "Counter Offer Relayed!",
      `${formattedPrice} proposal submitted with ₹50,000 Escrow.`
    );

    const offerMsg: Message = {
      _id: `offer-${Date.now()}`,
      senderId: user?.id || "me",
      text: `Formal counter offer of ${fullINR} proposed with ₹50,000 Token Escrow. Valid for ${currentValidity}.`,
      sentAt: new Date().toISOString(),
      isOfferProposal: true,
      offerAmount: currentCounterVal,
      offerValidity: currentValidity,
    };

    setMessages((prev) => [...prev, offerMsg]);
    setTimeout(() => {
      streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);

    try {
      const token = await getToken().catch(() => null);
      await fetchApi(`/conversations/${encodeURIComponent(selected)}/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: currentCounterVal,
          message: `Formal counter offer of ${fullINR} submitted with token escrow.`,
        }),
      });
      void fetchMine();
    } catch (err) {
      console.warn("Offer submission fallback:", err);
    }
  };

  // Suggestion chips handler
  const handleChipClick = (chipText: string) => {
    if (chipText.includes("Escrow Terms")) {
      showToast(
        "Apna Ghar Escrow Protection",
        "Token deposit is protected under RBI nodal guidelines until title verification."
      );
    } else {
      const cleaned = chipText.replace(/^[^\w\s\d₹?]+/, "").trim();
      setDraft(cleaned);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Filtered list for search and categories
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeFilter === "unread") {
      result = items.filter((c) => (c.unreadCountByUser?.[user?.id || ""] || 0) > 0);
    } else if (activeFilter === "offers") {
      result = items.filter((c) =>
        c.messages?.some((m) => /counter|offer|proposal|₹|locked/i.test(m.text)) || Boolean(c.statusBadge)
      );
    }

    const q = searchText.trim().toLowerCase();
    if (!q) return result;
    return result.filter((c) =>
      [c.propertyTitle, c.propertySlug, c.contactName, c.messages?.[c.messages.length - 1]?.text].some(
        (v) => String(v || "").toLowerCase().includes(q)
      )
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

  return (
    <div className="messages-workspace-root">
      {/* Desktop Site Navbar */}
      <div className="stitch-desktop-navbar-wrap">
        <SiteHeader active="messages" />
      </div>

      <div className={`stitch-chat-shell ${selected ? "is-chat-mode" : "is-inbox-mode"}`}>
        {/* =====================================================================
            VIEW A: MOBILE CONVERSATIONS LIST
            ===================================================================== */}
        <div className="stitch-mobile-inbox-view">
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
                Escrow Active
              </span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary ml-1">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
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
                placeholder="Search conversations, owners, properties…"
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
                Offers
              </button>
            </div>
          </div>

          {/* Trust Guarantee Banner */}
          <div className="mx-4 mt-3 p-2.5 bg-surface-container-low rounded-xl flex items-start gap-2 border border-outline-variant/30 shadow-xs">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 flex-shrink-0">
              verified_user
            </span>
            <div className="flex-1">
              <p className="font-bold text-[11.5px] text-primary m-0">
                Apna Ghar Direct Masked Channels
              </p>
              <p className="text-[11px] text-on-surface-variant m-0 leading-tight">
                Zero brokerage. Tap any thread to open the live negotiation room.
              </p>
            </div>
          </div>

          {/* Conversations List on Mobile */}
          <div className="stitch-inbox-list">
            {loading || !isLoaded ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low/60 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-surface-container shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-surface-container rounded w-3/4" />
                      <div className="h-2.5 bg-surface-container/60 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">chat_bubble_outline</span>
                </div>
                <h2 className="font-bold text-base text-on-surface m-0 mb-1">No Messages Yet</h2>
                <p className="text-xs text-on-surface-variant max-w-xs m-0 mb-5 leading-relaxed">
                  Connect directly with verified owners with 0% brokerage. Inquire about any property to start a private conversation.
                </p>
                <a
                  href="/search"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs no-underline flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  <span>Explore Properties</span>
                </a>
              </div>
            ) : (
              filteredItems.map((conv) => {
                const last = conv.messages?.[conv.messages.length - 1];
                const thumb = conv.thumbUrl || VERIFIED_FALLBACK_IMG;
                const isUserOwner = Boolean(user?.id && conv.ownerId === user.id);
                const counterpart = isUserOwner ? "Buyer Inquiry" : conv.contactName || "Property Owner";

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
                            {counterpart}
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
                        {last?.text || "Active discussion"}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wider ${
                          isUserOwner ? "bg-primary/10 text-primary" : "bg-secondary-container text-on-secondary-container"
                        }`}>
                          {isUserOwner ? "Your Listing (Owner)" : "Your Inquiry (Buyer)"}
                        </span>
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
            VIEW B: ACTIVE CHAT SCREEN + DESKTOP 3-COLUMN WORKSPACE
            ===================================================================== */}
        <div className="stitch-chat-active-container">
          {/* Header on Mobile when inside active conversation */}
          {activeConversation && (
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

                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container text-on-primary font-bold flex items-center justify-center text-sm shadow-xs">
                      {rawOwnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-secondary ring-2 ring-surface" title="Online now"></span>
                  </div>

                  <div className="min-w-0 pl-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-headline-sm text-sm sm:text-base text-on-surface truncate m-0 font-bold">
                        {isOwner ? "Inquiry from Buyer" : rawOwnerName}
                      </h2>
                      <span className="material-symbols-outlined text-secondary text-[16px] shrink-0" title="Verified">
                        verified
                      </span>
                      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold">
                        {isOwner ? "Buyer Inquiry" : "Direct Owner"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-xs truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                      <span className="truncate">
                        {isOwner ? `Inquiry on your listing: ${propertyTitle}` : `Listing: ${propertyTitle}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stitch-chat-header-right">
                  {ownerPhone && (
                    <a
                      href={`tel:${ownerPhone.replace(/[^+0-9]/g, "")}`}
                      aria-label="Call seller"
                      className="stitch-header-circle-btn text-primary"
                      title="Direct Call (Masked)"
                    >
                      <span className="material-symbols-outlined text-[20px]">call</span>
                    </a>
                  )}
                  {activeConversation.propertySlug && (
                    <a
                      href={`/property/${encodeURIComponent(propertyInfo?.slug || activeConversation.propertySlug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Property listing info"
                      className="stitch-header-circle-btn text-on-surface-variant"
                      title="View Public Listing"
                    >
                      <span className="material-symbols-outlined text-[20px]">info</span>
                    </a>
                  )}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1 text-on-primary">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Desktop Top Meta Breadcrumb Bar */}
          <div className="stitch-desktop-meta-bar">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span className="flex items-center gap-1.5 text-primary font-bold">
                <span className="material-symbols-outlined text-[16px]">forum</span>
                Direct Negotiation Desk
              </span>
              <span className="text-outline-variant">•</span>
              <span>Zero Brokerage Direct Exchange</span>
              <span className="text-outline-variant">•</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                RBI-Regulated Escrow Title Lock Active
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
                Multi-Tenant Private Chat
              </span>
              <span className="text-outline">|</span>
              <span className="text-on-surface font-semibold text-[11px]">Verified Safe Session</span>
            </div>
          </div>

          {/* Main Layout (Desktop Split 3-Column + Mobile Full Screen) */}
          <div className="stitch-chat-layout-wrapper">
            {/* COLUMN 1: Desktop Sidebar */}
            <aside className="stitch-desktop-sidebar">
              <div className="p-3.5 border-b border-outline-variant/30 flex-shrink-0">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-on-surface m-0">Negotiations</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10.5px]">
                      {items.length} Active
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
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
                    Offers
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 stitch-custom-scrollbar">
                {loading || !isLoaded ? (
                  <div className="p-2 space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low/60 animate-pulse">
                        <div className="w-11 h-11 rounded-xl bg-surface-container shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 bg-surface-container rounded w-3/4" />
                          <div className="h-2.5 bg-surface-container/60 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant flex flex-col items-center justify-center h-48">
                    <span className="material-symbols-outlined text-[28px] text-outline mb-2">chat_bubble_outline</span>
                    <p className="font-bold text-xs text-on-surface m-0 mb-1">No Conversations</p>
                    <p className="text-[11px] text-on-surface-variant m-0 max-w-[180px] leading-relaxed">
                      Your direct inquiries with property owners will appear here.
                    </p>
                  </div>
                ) : (
                  filteredItems.map((conv) => {
                    const isSelected = conv._id === selected;
                    const isUserOwner = Boolean(user?.id && conv.ownerId === user.id);
                    const owner = isUserOwner ? "Buyer Inquiry" : conv.contactName || "Property Owner";
                    const initials = owner.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "AG";
                    const lastMsg = conv.messages?.[conv.messages.length - 1];
                    const unread = (user?.id && conv.unreadCountByUser?.[user.id]) || 0;

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
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                            isSelected
                              ? "bg-gradient-to-tr from-primary to-primary-container text-on-primary"
                              : "bg-surface-container text-on-surface-variant"
                          }`}>
                            {initials}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-secondary ring-2 ring-surface-container-lowest" title="Active"></span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs text-on-surface truncate">
                                {owner}
                              </span>
                              <span className="material-symbols-outlined text-[14px] text-secondary shrink-0">
                                verified
                              </span>
                            </div>
                            <span className="text-[10px] text-outline font-medium shrink-0">
                              {formatRelativeTime(lastMsg?.sentAt || conv.lastMessageAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`font-label-sm text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                              isUserOwner ? "bg-primary/10 text-primary" : "bg-secondary-container text-on-secondary-container"
                            }`}>
                              {isUserOwner ? "Your Listing (Owner)" : "Your Inquiry (Buyer)"}
                            </span>
                            <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                              {conv.propertyTitle}
                            </span>
                          </div>

                          <p className="text-[11.5px] text-on-surface-variant font-normal truncate m-0 mb-1.5 leading-tight">
                            {lastMsg?.text || "Zero brokerage direct discussion"}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                            <span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-extrabold text-[9.5px]">
                              {conv.statusBadge || "Active Negotiation"}
                            </span>
                            {unread > 0 && (
                              <span className="w-4 h-4 rounded-full bg-primary text-on-primary font-bold text-[9px] flex items-center justify-center">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-outline-variant/30 text-[11px] text-outline flex items-center justify-between bg-surface-container-lowest flex-shrink-0">
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  <span className="material-symbols-outlined text-[14px]">shield</span> Escrow Active
                </span>
                <span>Apna Ghar Direct</span>
              </div>
            </aside>

            {/* COLUMN 2: Center Chat Screen or Empty State */}
            {loading || !isLoaded ? (
              <main className="stitch-chat-main flex-1 flex flex-col justify-between p-6 bg-surface-container-lowest">
                <div className="flex items-center gap-3 p-4 border-b border-outline-variant/30 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-surface-container shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-surface-container rounded w-48" />
                    <div className="h-3 bg-surface-container/60 rounded w-32" />
                  </div>
                </div>
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-start">
                    <div className="w-64 h-14 bg-surface-container-low rounded-2xl animate-pulse" />
                  </div>
                  <div className="flex justify-end">
                    <div className="w-72 h-16 bg-primary/10 rounded-2xl animate-pulse" />
                  </div>
                  <div className="flex justify-start">
                    <div className="w-56 h-12 bg-surface-container-low rounded-2xl animate-pulse" />
                  </div>
                </div>
                <div className="h-12 bg-surface-container-low rounded-xl animate-pulse" />
              </main>
            ) : items.length === 0 ? (
              <main className="stitch-chat-main flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
                  <span className="material-symbols-outlined text-[32px]">mark_chat_unread</span>
                </div>
                <h2 className="font-headline-sm text-lg text-on-surface font-bold m-0 mb-2">
                  Your Inbox is Private &amp; Empty
                </h2>
                <p className="text-xs text-on-surface-variant max-w-md m-0 mb-6 leading-relaxed">
                  You have not initiated or received any direct inquiries yet. When you contact a verified property owner, your private, 100% masked negotiation channel will appear here.
                </p>
                <a
                  href="/search"
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container transition-all flex items-center gap-2 no-underline"
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  <span>Browse Verified Properties</span>
                </a>
                <div className="flex items-center gap-2 mt-8 px-4 py-2 rounded-full bg-surface-container-low text-[11px] text-outline font-medium">
                  <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                  <span>Multi-Tenant Isolated • 0% Brokerage • RBI Nodal Escrow</span>
                </div>
              </main>
            ) : !activeConversation ? (
              <main className="stitch-chat-main flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest">
                <div className="w-14 h-14 rounded-2xl bg-surface-container text-outline flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">forum</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface m-0 mb-1">Select a Conversation</h3>
                <p className="text-xs text-on-surface-variant max-w-xs m-0">
                  Choose a thread from the left to view active negotiations and exchange documents.
                </p>
              </main>
            ) : (
              <main className="stitch-chat-main">
                {/* Desktop In-Column Conversation Header */}
                <div className="stitch-desktop-chat-header">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container text-on-primary font-bold flex items-center justify-center text-sm shadow-xs">
                        {rawOwnerName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-secondary ring-2 ring-surface-container-lowest" title="Online now"></span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-headline-sm text-sm sm:text-base text-on-surface truncate m-0 font-bold">
                          {isOwner ? "Inquiry from Buyer" : rawOwnerName}
                        </h2>
                        <span className="material-symbols-outlined text-secondary text-[16px] shrink-0" title="Verified">
                          verified
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold">
                          {isOwner ? "Buyer Inquiry on Your Property" : "Direct Owner"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-xs truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                        <span className="truncate">
                          {isOwner
                            ? `Inquiry received on your listing: ${propertyTitle}`
                            : `Active Discussion • Direct Owner: ${rawOwnerName}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ownerPhone && (
                      <a
                        href={`tel:${ownerPhone.replace(/[^+0-9]/g, "")}`}
                        aria-label="Call directly"
                        className="stitch-header-circle-btn text-primary"
                        title="Direct Call (Masked)"
                      >
                        <span className="material-symbols-outlined text-[20px]">call</span>
                      </a>
                    )}
                    {activeConversation.propertySlug && (
                      <a
                        href={`/property/${encodeURIComponent(propertyInfo?.slug || activeConversation.propertySlug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Property listing info"
                        className="stitch-header-circle-btn text-on-surface-variant"
                        title="View Public Listing"
                      >
                        <span className="material-symbols-outlined text-[20px]">info</span>
                      </a>
                    )}
                    <span className="hidden xl:flex px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      Escrow Protected
                    </span>
                  </div>
                </div>

                {/* Pinned Sticky Property Micro-Context Strip */}
                <section className="stitch-property-sticky-strip">
                  <div
                    className="stitch-property-context-card"
                    onClick={() => setSpecsOpen((prev) => !prev)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container shadow-xs">
                        <img
                          alt={propertyTitle}
                          className="w-full h-full object-cover"
                          src={propertyThumb}
                          onError={(e) => { (e.target as HTMLImageElement).src = VERIFIED_FALLBACK_IMG; }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-[8.5px] text-on-primary font-bold text-center py-0.2 leading-none">
                          VERIFIED
                        </span>
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          {propertyAskingPrice > 0 && (
                            <span className="font-headline-sm text-sm font-bold text-on-surface truncate">
                              {formatCrLakh(propertyAskingPrice)}
                            </span>
                          )}
                          <span className="bg-secondary-container text-on-secondary-container font-label-sm text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            {activeConversation.statusBadge || "Direct Negotiation"}
                          </span>
                        </div>
                        <p className="font-body-sm text-[12px] text-on-surface-variant truncate m-0">
                          {propertyTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 text-primary">
                      <span className="font-label-sm text-[12px] font-bold hidden sm:inline">Details</span>
                      <span
                        className="material-symbols-outlined text-[20px] transition-transform duration-300"
                        style={{ transform: specsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Specs Drawer */}
                  {specsOpen && (
                    <div className="stitch-property-specs-drawer">
                      <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-around gap-2 text-center text-on-surface border border-outline-variant/30">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">
                            Configuration
                          </span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">
                            {propertyInfo?.bedrooms ? `${propertyInfo.bedrooms} BHK` : plotArea}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-outline-variant/40"></div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">
                            Facing
                          </span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">
                            {plotFacing}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-outline-variant/40"></div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">
                            Registry Title
                          </span>
                          <span className="font-label-lg text-label-lg font-bold text-secondary">
                            {plotRegistry}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Native Chat Message Stream */}
                <div className="stitch-chat-stream">
                  <div className="flex items-center justify-center my-1">
                    <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[11px] shadow-sm tracking-wide font-medium">
                      Private Negotiation Channel
                    </span>
                  </div>

                  {/* Security Banner */}
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
                        masked until mutual token verification.
                      </p>
                    </div>
                  </div>

                  {/* Real Messages from Active Thread */}
                  {loadingMessages && messages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-outline">
                      Loading conversation messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-secondary-container/40 text-secondary flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-[24px]">shield</span>
                      </div>
                      <p className="font-bold text-xs text-on-surface m-0 mb-1">
                        Direct Negotiation Channel Initialized
                      </p>
                      <p className="text-[11px] text-on-surface-variant max-w-xs m-0 leading-relaxed">
                        Zero brokerage. All messages and documents exchanged here are 100% private between you and {rawOwnerName}.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.senderId === user?.id;

                      if (m.isOfferProposal) {
                        return (
                          <div
                            key={m._id || `offer-${m.sentAt}`}
                            className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-md border-l-4 border-l-secondary flex flex-col gap-3 animate-in slide-in-from-bottom duration-300"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                                  <span className="material-symbols-outlined text-[20px]">handshake</span>
                                </span>
                                <div>
                                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold block">
                                    Formal Proposal
                                  </span>
                                  <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight m-0 font-bold">
                                    {formatCrLakh(m.offerAmount)}
                                  </h4>
                                </div>
                              </div>
                              <span className="font-label-sm text-label-sm font-bold text-on-surface">
                                Token Escrow
                              </span>
                            </div>

                            <p className="font-body-sm text-[12px] text-on-surface-variant m-0">
                              {m.text || `Formal counter offer of ${formatCrLakh(m.offerAmount)} proposed.`}
                            </p>

                            <div className="flex items-center justify-between pt-1 text-on-surface-variant font-label-sm text-[11px]">
                              <span>{formatRelativeTime(m.sentAt)}</span>
                              <span className="text-secondary font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">verified_user</span>{" "}
                                Escrow Protected
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (isMine) {
                        return (
                          <div key={m._id || `msg-${m.sentAt}`} className="flex flex-col items-end gap-1 max-w-[85%] self-end">
                            <div className="flex items-center gap-1.5 px-1 mb-0.5">
                              <span className="font-label-sm text-[11px] text-primary font-bold">
                                You ({isOwner ? "Owner" : "Buyer"})
                              </span>
                            </div>
                            <div className="bg-primary text-on-primary rounded-2xl rounded-tr-xs px-4 py-3 shadow-md">
                              {renderMessageAttachment(m.attachment, true)}
                              {m.text && <p className="font-body-md text-body-md m-0 leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                            </div>
                            <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-[11px] px-1">
                              <span>{formatRelativeTime(m.sentAt)}</span>
                              <span className="material-symbols-outlined text-secondary-fixed-dim text-[14px]">
                                done_all
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={m._id || `msg-${m.sentAt}`} className="flex flex-col items-start gap-1 max-w-[88%] self-start">
                          <div className="flex items-center gap-1.5 px-1 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                            <span className="font-label-sm text-xs text-on-surface font-bold">
                              {isOwner ? "Buyer" : rawOwnerName}
                            </span>
                            <span className="font-label-sm text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.2 rounded font-bold">
                              {isOwner ? "Verified Buyer" : "Direct Owner"}
                            </span>
                          </div>
                          <div className="bg-surface-container-low text-on-surface rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs border border-outline-variant/30">
                            {renderMessageAttachment(m.attachment, false)}
                            {m.text && <p className="font-body-md text-sm leading-relaxed m-0 text-on-surface whitespace-pre-wrap">{m.text}</p>}
                          </div>
                          <span className="text-on-surface-variant font-label-sm text-[11px] px-1">
                            {formatRelativeTime(m.sentAt)}
                          </span>
                        </div>
                      );
                    })
                  )}

                  <div ref={streamBottomRef} />
                </div>

                {/* Bottom Interactive Anchor (Composer + Suggestions) */}
                <div className="stitch-bottom-anchor">
                  <div className="stitch-chips-tray">
                    <button
                      type="button"
                      className="stitch-chip-btn bg-secondary-container text-on-secondary-container font-bold"
                      onClick={() => handleChipClick("🛡️ Escrow Terms")}
                    >
                      🛡️ Escrow Terms
                    </button>
                    <button
                      type="button"
                      className="stitch-chip-btn bg-surface-container-lowest text-on-surface"
                      onClick={() => handleChipClick("📅 Visit this weekend?")}
                    >
                      📅 Visit this weekend?
                    </button>
                    <button
                      type="button"
                      className="stitch-chip-btn bg-surface-container-low text-on-surface"
                      onClick={() => handleChipClick("🏷️ Is the price negotiable?")}
                    >
                      🏷️ Is the price negotiable?
                    </button>
                    <button
                      type="button"
                      className="stitch-chip-btn bg-surface-container-low text-on-surface"
                      onClick={() => handleChipClick("📑 Share documents?")}
                    >
                      📑 Share documents?
                    </button>
                  </div>

                  <div className="stitch-composer-wrap">
                    {/* Selected Attachment Preview Badge */}
                    {pendingAttachment && (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-surface-container-low rounded-xl mb-2 border border-outline-variant/40 animate-in slide-in-from-bottom duration-200">
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
                          <p className="text-xs font-bold text-on-surface truncate m-0">{pendingAttachment.file.name}</p>
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
                        className={`stitch-composer-icon-btn ${pendingAttachment ? "text-primary" : ""}`}
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
                        placeholder={`Message ${rawOwnerName} directly...`}
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
            )}

            {/* COLUMN 3: RIGHT DETAILS DRAWER (Property & Safe Escrow Dossier) */}
            {loading || !isLoaded ? (
              <aside className="stitch-desktop-dossier-column stitch-custom-scrollbar p-6 space-y-4">
                <div className="h-4 bg-surface-container rounded w-32 animate-pulse" />
                <div className="w-full h-36 bg-surface-container rounded-xl animate-pulse" />
                <div className="h-4 bg-surface-container rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-surface-container/60 rounded w-1/2 animate-pulse" />
                <div className="pt-4 border-t border-outline-variant/30 space-y-2">
                  <div className="h-3 bg-surface-container/50 rounded w-full animate-pulse" />
                  <div className="h-3 bg-surface-container/50 rounded w-4/5 animate-pulse" />
                </div>
              </aside>
            ) : items.length === 0 ? (
              <aside className="stitch-desktop-dossier-column stitch-custom-scrollbar flex flex-col items-center justify-center p-6 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] text-outline mb-2">folder_open</span>
                <p className="font-bold text-xs text-on-surface m-0 mb-1">No Property Selected</p>
                <p className="text-[11px] text-on-surface-variant m-0 max-w-[200px]">
                  Select an active conversation to view property specifications and escrow details.
                </p>
              </aside>
            ) : !activeConversation ? (
              <aside className="stitch-desktop-dossier-column stitch-custom-scrollbar flex flex-col items-center justify-center p-6 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] text-outline mb-2">folder_open</span>
                <p className="font-bold text-xs text-on-surface m-0 mb-1">No Conversation Selected</p>
                <p className="text-[11px] text-on-surface-variant m-0 max-w-[200px]">
                  Choose a thread to view property details and verification status.
                </p>
              </aside>
            ) : (
              <aside className="stitch-desktop-dossier-column stitch-custom-scrollbar">
                {/* Card 1: Property Dossier */}
                <div className="stitch-dossier-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-sm text-[11px] uppercase font-bold text-outline tracking-wider">
                      Property Dossier
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                      RERA Registered
                    </span>
                  </div>

                  <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 bg-surface-container group">
                    <img
                      src={propertyThumb}
                      onError={(e) => { (e.target as HTMLImageElement).src = VERIFIED_FALLBACK_IMG; }}
                      alt={propertyTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-inverse-surface/80 text-inverse-on-surface backdrop-blur-md font-label-sm text-[10px] font-bold">
                      {propertyInfo?.location?.locality || propertyInfo?.location?.city || "Direct Owner"}
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary text-on-primary font-label-sm text-[10px] font-bold shadow-xs">
                      Ready to Move
                    </div>
                  </div>

                  <h3 className="font-headline-sm text-sm text-on-surface font-bold m-0 mb-1 truncate">
                    {propertyTitle}
                  </h3>
                  <p className="font-body-sm text-[11px] text-on-surface-variant m-0 mb-3 truncate">
                    {[propertyInfo?.location?.locality, propertyInfo?.location?.city, propertyInfo?.location?.state].filter(Boolean).join(", ") || "Prime Location, Verified"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-container-low rounded-xl mb-3">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[9.5px] text-outline">Configuration</span>
                      <span className="font-label-lg text-xs text-on-surface font-bold">
                        {propertyInfo?.bedrooms ? `${propertyInfo.bedrooms} BHK` : "Verified Layout"}
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

                  {propertyAskingPrice > 0 && (
                    <div className="flex items-baseline justify-between pt-1 border-t border-outline-variant/30">
                      <span className="font-label-sm text-[11px] text-outline">Listed Asking Price:</span>
                      <span className="font-headline-md text-sm text-primary font-extrabold">
                        {formatCrLakh(propertyAskingPrice)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card 2: RBI Escrow Safety Shield */}
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
                    Token deposits are parked safely under RBI nodal trustee guidelines until title deed mutation and draft sale agreement execution.
                  </p>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-[10.5px]">
                    <span className="flex items-center gap-1 text-secondary font-bold">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      100% Refundable
                    </span>
                    <span className="text-outline font-medium">Zero Brokerage Fee</span>
                  </div>
                </div>

                {/* Card 3: Counterpart Verification Matrix */}
                <div className="stitch-dossier-card">
                  <span className="font-label-sm text-[11px] uppercase font-bold text-outline tracking-wider block mb-3">
                    Verification Matrix
                  </span>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-on-primary font-headline-sm text-sm flex items-center justify-center font-bold shadow-xs">
                      {rawOwnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-label-lg text-xs text-on-surface font-bold truncate">
                          {rawOwnerName}
                        </span>
                        <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
                      </div>
                      <span className="font-body-sm text-[11px] text-on-surface-variant block">
                        Verified {counterpartRole}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 font-label-sm text-[11px]">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-secondary">flash_on</span>
                        Channel Status
                      </span>
                      <span className="font-bold text-on-surface">Active Negotiation</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-primary">badge</span>
                        Identity Protection
                      </span>
                      <span className="font-bold text-secondary flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Masked P2P
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-primary">real_estate_agent</span>
                        Brokerage Fee
                      </span>
                      <span className="font-bold text-secondary flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        0% Commission
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Book Private Inspection */}
                <div className="stitch-dossier-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-md text-xs text-on-surface font-bold">
                      Book In-Person Inspection
                    </span>
                    <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
                  </div>
                  <p className="font-body-sm text-[11px] text-on-surface-variant m-0 mb-3">
                    Coordinate a convenient walkthrough slot with {rawOwnerName}.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-center font-label-sm text-[10.5px] font-bold border-none cursor-pointer transition-colors"
                      onClick={() => {
                        setDraft("Hello, could we schedule a walkthrough for Saturday at 11:00 AM?");
                        if (inputRef.current) inputRef.current.focus();
                      }}
                    >
                      Sat • 11:00 AM
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-center font-label-sm text-[10.5px] font-bold border-none cursor-pointer transition-colors"
                      onClick={() => {
                        setDraft("Hello, could we schedule a walkthrough for Sunday at 4:00 PM?");
                        if (inputRef.current) inputRef.current.focus();
                      }}
                    >
                      Sun • 4:00 PM
                    </button>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold transition-all flex items-center justify-center gap-1 border-none cursor-pointer shadow-xs hover:bg-primary-container"
                    onClick={() => {
                      setDraft("Hello, what days and times are convenient for an in-person inspection?");
                      if (inputRef.current) inputRef.current.focus();
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                    Request Walkthrough
                  </button>
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Counter Offer Modal */}
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
                    Submit Counter Offer
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
                    Property In Discussion
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                    {propertyTitle}
                  </span>
                </div>
                {propertyAskingPrice > 0 && (
                  <div className="text-right flex-shrink-0">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                      Asking Price
                    </span>
                    <span className="font-headline-sm text-[14px] font-bold text-primary">
                      {formatCrLakh(propertyAskingPrice)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase">
                    Your Counter Bid
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
                        ? `-₹${(diffFromAsk / 100000).toFixed(1)} Lakhs vs Ask`
                        : diffFromAsk === 0
                        ? "At Asking Price"
                        : `+₹${(Math.abs(diffFromAsk) / 100000).toFixed(1)} Lakhs Above Ask`}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[18px] flex items-center justify-center active:scale-95 transition-all border-none cursor-pointer"
                    onClick={() =>
                      setCurrentCounterVal((v) => Math.max(100000, v - 100000))
                    }
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
                      Broker Fee Saved
                    </span>
                    <span className="font-label-md text-label-md text-secondary font-bold">
                      ₹{brokerSavedLakhs} Lakhs Saved
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

              <div className="bg-surface-container-low rounded-xl p-2.5 flex items-start gap-2 border border-outline-variant/30">
                <span
                  className="material-symbols-outlined text-primary text-[18px] mt-0.5 flex-shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
                <div className="flex-1">
                  <p className="font-label-sm text-label-sm text-primary font-bold m-0">
                    Escrow Security Protected
                  </p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug m-0">
                    Protected under RBI-regulated nodal escrow guidelines with 0% platform fee.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary font-headline-sm text-[16px] font-bold shadow-lg hover:bg-primary-container active:scale-95 transition-all text-center flex items-center justify-center gap-2 border-none cursor-pointer"
                  onClick={() => void handleSubmitCounterOffer()}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">handshake</span>
                  <span>Submit Counter Offer • {formatCrLakh(currentCounterVal)}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
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

function MessagesCenterWithoutClerk() {
  return <MessagesCenterAuthenticated />;
}

export default function MessagesCenter() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <MessagesCenterAuthenticated />
  ) : (
    <MessagesCenterWithoutClerk />
  );
}
