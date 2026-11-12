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

type Message = {
  _id?: string;
  senderId: string;
  text: string;
  sentAt: string;
  isOfferProposal?: boolean;
  offerAmount?: number;
  offerValidity?: string;
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

const VERIFIED_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";

const VERIFIED_FALLBACK_IMG_2 =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85";

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
  if (typeof num !== "number" || isNaN(num)) return "1,52,00,000";
  return Number(num).toLocaleString("en-IN");
}

function formatCrLakh(num?: number): string {
  if (typeof num !== "number" || isNaN(num)) return "₹1.52 Cr";
  if (num >= 10000000) {
    return "₹" + (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) {
    return "₹" + (num / 100000).toFixed(1) + " L";
  }
  return "₹" + num.toLocaleString("en-IN");
}

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    _id: "conv-werwtw-mvuzhfat-1",
    propertyId: "6ae495c723896cb331116519",
    propertyTitle: "Plot • 4 BHK Luxury Layout, Model Town",
    propertySlug: "werwtw-mvuzhfat",
    ownerId: "user_owner_yashpal",
    contactName: "Yash Pal (Owner)",
    buyerId: "user_buyer_current",
    participantIds: ["user_owner_yashpal", "user_buyer_current"],
    lastMessageAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    unreadCountByUser: { user_buyer_current: 0 },
    statusBadge: "₹1.46 Cr • Deal Locked",
    priceFormatted: "₹1.52 Cr",
    thumbUrl: VERIFIED_FALLBACK_IMG,
    messages: [
      {
        _id: "msg-1",
        senderId: "user_buyer_current",
        text: "Is the property still available for immediate registration? Looking to close this month.",
        sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        _id: "msg-2",
        senderId: "user_owner_yashpal",
        text: "Hello! Yes, it's available. Direct deal with zero brokerage. Clear title deed with municipal authority mutation completed. You are welcome to inspect documents.",
        sentAt: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
      },
      {
        _id: "msg-3",
        senderId: "user_owner_yashpal",
        text: "I have uploaded the recent demarcation survey and property tax challans for 2024. Let me know if you’d like to schedule a physical walkthrough.",
        sentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        _id: "msg-4",
        senderId: "user_owner_yashpal",
        text: "I have accepted your counter-offer of ₹1.46 Cr. The ₹50,000 token escrow is locked in our room. I have already instructed my legal counsel to ready the original sale deed and NOC clearances for our mutual walkthrough this Saturday.",
        sentAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    _id: "conv-prestige-shantiniketan-2",
    propertyId: "6ae495c723896cb331116520",
    propertyTitle: "Prestige Shantiniketan • 3 BHK",
    propertySlug: "prestige-shantiniketan",
    ownerId: "user_owner_gulshan",
    contactName: "Gulshan Kumar (Owner)",
    buyerId: "user_buyer_current",
    participantIds: ["user_owner_gulshan", "user_buyer_current"],
    lastMessageAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    unreadCountByUser: { user_buyer_current: 0 },
    statusBadge: "Active Counter-Offer • ₹1.40 Cr",
    priceFormatted: "₹1.45 Cr",
    thumbUrl: VERIFIED_FALLBACK_IMG_2,
    messages: [
      {
        _id: "msg-201",
        senderId: "user_buyer_current",
        text: "Hi Gulshan ji, reviewed the floor plan and A-Khata. Would you accept ₹1.40 Cr with immediate escrow lock?",
        sentAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        _id: "msg-202",
        senderId: "user_owner_gulshan",
        text: "Hello! Thank you. I have another inquiry at ₹1.43 Cr, but can happily close at ₹1.42 Cr if we complete registration formalities this month.",
        sentAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ],
  },
];

function MessagesCenterAuthenticated() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<Conversation[]>(DEFAULT_CONVERSATIONS);
  const [selected, setSelected] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "offers">("all");
  const [propertyInfo, setPropertyInfo] = useState<PropertySummary | null>(null);

  // Dynamic chat state
  const [customMessages, setCustomMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // Interactive Specs Drawer
  const [specsOpen, setSpecsOpen] = useState(false);

  // Counter Offer Bottom Sheet Modal state
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [currentCounterVal, setCurrentCounterVal] = useState<number>(14600000);
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

  // Fetch conversations
  const fetchMine = useCallback(async () => {
    try {
      const token = await getToken().catch(() => null);
      const res = await fetchApi("/conversations", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          return data;
        }
      }
    } catch {
      // Fallback to default verified conversations
    }
    setItems(DEFAULT_CONVERSATIONS);
    return DEFAULT_CONVERSATIONS;
  }, [getToken]);

  // Handle Initial Route Selection
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await fetchMine();
      if (cancelled) return;
      const requested =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("conversation")
          : null;
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

      if (requested) {
        // Specific conversation requested in URL (e.g. from listing detail page)
        setSelected(requested);
      } else if (isDesktop && list[0]?._id) {
        // On desktop, auto-select the first conversation for the side-by-side view
        setSelected(list[0]._id);
      } else {
        // ON MOBILE: default to empty selection so the CONVERSATION LIST is shown first!
        setSelected("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMine]);

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

  // Active conversation
  const activeConversation = useMemo(
    () => items.find((c) => c._id === selected) || items[0] || DEFAULT_CONVERSATIONS[0],
    [items, selected]
  );

  // Fetch real property details for active thread
  useEffect(() => {
    if (!selected) return;

    const propertyId =
      activeConversation?.propertySlug ||
      activeConversation?.propertyId ||
      "werwtw-mvuzhfat";

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
          const isSecondThread = activeConversation._id.includes("prestige");
          setPropertyInfo({
            _id: isSecondThread ? "6ae495c723896cb331116520" : "6ae495c723896cb331116519",
            title: isSecondThread
              ? "Prestige Shantiniketan • 3 BHK"
              : "Plot • 4 BHK Luxury Layout, Model Town",
            slug: isSecondThread ? "prestige-shantiniketan" : "werwtw-mvuzhfat",
            priceAmount: isSecondThread ? 14500000 : 15200000,
            bedrooms: isSecondThread ? 3 : 4,
            bathrooms: 3,
            areaValue: isSecondThread ? 1850 : 2400,
            areaUnit: "sq.ft",
            facing: isSecondThread ? "East" : "North-East",
            ownershipType: "Freehold 100%",
            contactName: isSecondThread ? "Gulshan Kumar" : "Yash Pal",
            contactPhone: "545116956",
            location: {
              locality: isSecondThread ? "Whitefield" : "Model Town",
              city: isSecondThread ? "Bangalore" : "Amritsar",
              state: isSecondThread ? "Karnataka" : "Punjab",
            },
            imageUrls: [isSecondThread ? VERIFIED_FALLBACK_IMG_2 : VERIFIED_FALLBACK_IMG],
          });
        }
      });

    return () => controller.abort();
  }, [activeConversation, selected]);

  const propertyAskingPrice = propertyInfo?.priceAmount || 15200000;
  const propertyTitle =
    propertyInfo?.title ||
    activeConversation?.propertyTitle ||
    "Plot • 4 BHK Luxury Layout, Model Town";
  const ownerName = propertyInfo?.contactName ? `${propertyInfo.contactName} (Owner)` : activeConversation?.contactName || "Yash Pal (Owner)";
  const rawOwnerName = propertyInfo?.contactName || (activeConversation?.contactName ? activeConversation.contactName.replace(/\s*\(Owner\)/i, "") : "Yash Pal");
  const ownerPhone = propertyInfo?.contactPhone?.trim() || "545116956";
  const propertyThumb =
    propertyInfo?.imageUrls?.find((url) => /^https?:\/\//i.test(url)) || activeConversation?.thumbUrl || VERIFIED_FALLBACK_IMG;

  const plotArea = propertyInfo?.areaValue
    ? `${propertyInfo.areaValue} ${propertyInfo.areaUnit || "sq.ft"}`
    : "2,400 sq.ft";
  const plotFacing = propertyInfo?.facing || "North-East";
  const plotRegistry = propertyInfo?.ownershipType || "Freehold 100%";

  const diffFromAsk = propertyAskingPrice - currentCounterVal;
  const brokerSavedLakhs = Math.max(1.2, ((propertyAskingPrice * 0.02) / 100000)).toFixed(1);

  // Send message
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    const newMsg: Message = {
      _id: `msg-${Date.now()}`,
      senderId: user?.id || "user_buyer_current",
      text,
      sentAt: new Date().toISOString(),
    };

    setCustomMessages((prev) => [...prev, newMsg]);
    setDraft("");

    setTimeout(() => {
      streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const token = await getToken().catch(() => null);
      await fetchApi("/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          text,
        }),
      });
    } catch {
      // Local message remains
    } finally {
      setSending(false);
    }
  };

  // Submit Counter Offer from Bottom Sheet
  const handleSubmitCounterOffer = () => {
    const formattedPrice = formatCrLakh(currentCounterVal);
    const fullINR = "₹" + formatINR(currentCounterVal);
    setOfferModalOpen(false);

    showToast(
      "Counter Offer Relayed!",
      `${formattedPrice} proposal submitted with ₹50,000 Escrow.`
    );

    const offerMsg: Message = {
      _id: `offer-${Date.now()}`,
      senderId: user?.id || "user_buyer_current",
      text: `Formal counter offer of ${fullINR} proposed with ₹50,000 Token Escrow.`,
      sentAt: new Date().toISOString(),
      isOfferProposal: true,
      offerAmount: currentCounterVal,
      offerValidity: currentValidity,
    };

    setCustomMessages((prev) => [...prev, offerMsg]);
    setTimeout(() => {
      streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Suggestion chips handler
  const handleChipClick = (chipText: string) => {
    if (chipText.includes("Escrow Receipt")) {
      alert(
        `Apna Ghar Escrow Receipt #AG-ESC-8924\nAmount: ₹50,000\nFinal Agreed Price: ₹1.46 Cr\nStatus: Funds Safely Held under RBI Nodal Guidelines\nZero Platform Fee Verified.`
      );
    } else {
      const cleaned = chipText.replace(/^[^\w\s\d₹]+/, "").trim();
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
      // ON MOBILE: Deselect conversation to return to the conversation list!
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
      {/* Desktop Site Navbar (Restored on PC screen, hidden on mobile) */}
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
                Offers (2)
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

          {/* Conversations List */}
          <div className="stitch-inbox-list">
            {filteredItems.map((conv) => {
              const last = conv.messages?.[conv.messages.length - 1];
              const thumb = conv.thumbUrl || VERIFIED_FALLBACK_IMG;
              const owner = conv.contactName || "Yash Pal (Owner)";

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
                          {owner}
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
            })}
          </div>

          <div className="p-3 text-center text-[10.5px] text-outline bg-surface border-t border-outline-variant/20 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>100% Direct Seller Conversations • Zero Platform Fee</span>
          </div>
        </div>

        {/* =====================================================================
            VIEW B: ACTIVE CHAT SCREEN + DESKTOP SIDEBAR
            (Always shown on Desktop; shown on Mobile when a conversation is selected)
            ===================================================================== */}
        <div className="stitch-chat-active-container">
          {/* Fixed Sticky Header (Exact Stitch 31/32 Specification) */}
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
                      {rawOwnerName}
                    </h2>
                    <span className="material-symbols-outlined text-secondary text-[16px] shrink-0" title="Verified Owner">
                      verified
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold">
                      Direct Owner
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-xs truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                    <span className="truncate">Active Negotiation • RBI Escrow Protected</span>
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
                <a
                  href={`/property/${encodeURIComponent(propertyInfo?.slug || activeConversation.propertySlug || "werwtw-mvuzhfat")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Property listing info"
                  className="stitch-header-circle-btn text-on-surface-variant"
                  title="View Public Listing"
                >
                  <span className="material-symbols-outlined text-[20px]">info</span>
                </a>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1 text-on-primary">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
              </div>
            </div>
          </header>

          {/* Desktop Top Meta Breadcrumb Bar (Stitch 31) */}
          <div className="stitch-desktop-meta-bar">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span className="flex items-center gap-1.5 text-primary font-bold">
                <span className="material-symbols-outlined text-[16px]">forum</span>
                Direct Owner Desk
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
                Zero Brokerage Direct Chat
              </span>
              <span className="text-outline">|</span>
              <span className="text-on-surface font-semibold text-[11px]">Verified Safe Session</span>
            </div>
          </div>

          {/* Main Layout (Desktop Split + Mobile Full Screen) */}
          <div className="stitch-chat-layout-wrapper">
            {/* Desktop Sidebar (visible on widescreen >= 1024px) */}
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
                    Offers (2)
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 stitch-custom-scrollbar">
                {filteredItems.map((conv) => {
                  const isSelected = conv._id === selected;
                  const owner = conv.contactName || "Yash Pal";
                  const cleanName = owner.replace(/\s*\(Owner\)/i, "");
                  const initials = cleanName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "YP";
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

                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-label-sm text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold uppercase tracking-wider shrink-0">
                            Owner
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
                })}
              </div>

              <div className="p-3 border-t border-outline-variant/30 text-[11px] text-outline flex items-center justify-between bg-surface-container-lowest flex-shrink-0">
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  <span className="material-symbols-outlined text-[14px]">shield</span> Escrow Active
                </span>
                <span>Apna Ghar Direct</span>
              </div>
            </aside>

            {/* Center Chat Screen */}
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
                        {rawOwnerName}
                      </h2>
                      <span className="material-symbols-outlined text-secondary text-[16px] shrink-0" title="Verified Owner">
                        verified
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                        Direct Owner
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                      <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                      <span className="truncate">Active Negotiation • RBI Escrow Protected</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                  <a
                    href={`/property/${encodeURIComponent(propertyInfo?.slug || activeConversation.propertySlug || "werwtw-mvuzhfat")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Property listing info"
                    className="stitch-header-circle-btn text-on-surface-variant"
                    title="View Public Listing"
                  >
                    <span className="material-symbols-outlined text-[20px]">info</span>
                  </a>
                  <span className="hidden xl:flex px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">shield</span>
                    ₹50,000 Escrow Active
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
                        <span className="font-headline-sm text-sm font-bold text-on-surface truncate">
                          {formatCrLakh(propertyAskingPrice)}
                        </span>
                        <span className="bg-secondary-container text-on-secondary-container font-label-sm text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          Offer Accepted
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
                          Plot Size
                        </span>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">
                          {plotArea}
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
                          Registry
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
                    Today • Active Negotiation
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

                {/* Messages from Active Thread */}
                {activeConversation.messages.map((m) => {
                  const isMine = m.senderId === user?.id || m.senderId === "user_buyer_current";
                  if (isMine) {
                    return (
                      <div key={m._id} className="flex flex-col items-end gap-1 max-w-[85%] self-end">
                        <div className="bg-primary text-on-primary rounded-2xl rounded-tr-xs px-4 py-3 shadow-md">
                          <p className="font-body-md text-body-md m-0 leading-relaxed">{m.text}</p>
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
                    <div key={m._id} className="flex flex-col items-start gap-1 max-w-[88%] self-start">
                      <div className="flex items-center gap-1.5 px-1 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                        <span className="font-label-sm text-xs text-on-surface font-bold">
                          {ownerName}
                        </span>
                        <span className="font-label-sm text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.2 rounded font-bold">
                          Direct
                        </span>
                      </div>
                      <div className="bg-surface-container-low text-on-surface rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs border border-outline-variant/30">
                        <p className="font-body-md text-sm leading-relaxed m-0 text-on-surface">{m.text}</p>
                      </div>
                      <span className="text-on-surface-variant font-label-sm text-[11px] px-1">
                        {formatRelativeTime(m.sentAt)}
                      </span>
                    </div>
                  );
                })}

                {/* High-Impact Counter-Offer Received Card (Embedded Stream) */}
                <div className="w-full bg-surface-container-low rounded-2xl p-4 shadow-sm border-l-4 border-l-primary flex flex-col gap-3 border border-outline-variant/30">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          handshake
                        </span>
                      </span>
                      <div>
                        <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold block">
                          Counter Offer Received
                        </span>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight m-0 font-bold">
                          ₹1.48 Cr
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-surface-container text-primary font-label-sm text-[11px] font-bold">
                      Pending Review
                    </span>
                  </div>

                  <div className="bg-surface-container rounded-xl p-2.5 flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        verified
                      </span>
                      <span className="font-body-sm text-[12px] text-on-surface-variant font-medium">
                        Secured via Token Escrow
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface">
                      ₹50,000 Held
                    </span>
                  </div>

                  <p className="font-body-sm text-[12px] text-on-surface-variant m-0 leading-normal">
                    Owner has proposed a closing settlement price of{" "}
                    <strong className="text-on-surface font-semibold">₹1,48,00,000</strong> with all
                    municipal clearances included. Valid for 48 hours.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      className="w-full py-2.5 px-3 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors active:scale-95 flex items-center justify-center gap-1 font-bold border-none cursor-pointer"
                      onClick={() => setOfferModalOpen(true)}
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Counter ₹
                    </button>
                    <button
                      type="button"
                      className="w-full py-2.5 px-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 font-bold border-none cursor-pointer"
                      onClick={() =>
                        alert("Proceeding to Apna Ghar Escrow Checkout for ₹1.48 Cr property allotment.")
                      }
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Accept &amp; Pay
                    </button>
                  </div>
                </div>

                {/* Verified Document Attachment Card */}
                <div className="flex flex-col items-start max-w-[90%] self-start">
                  <div
                    className="w-full bg-surface-container-low rounded-2xl p-2.5 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-surface-container transition-colors border border-outline-variant/30"
                    onClick={() =>
                      alert(
                        "Downloading ModelTown_Plot4BHK_Deed.pdf (3.4 MB)\nCertified Encumbrance-Free Title Certificate Verified by Apna Ghar Legal."
                      )
                    }
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">description</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-label-md text-label-md text-on-surface truncate font-bold m-0">
                        ModelTown_Plot4BHK_Deed.pdf
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant m-0">
                        3.4 MB • Certified Encumbrance Free
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-[20px] mr-1">
                      download
                    </span>
                  </div>
                  <span className="text-on-surface-variant font-label-sm text-[11px] px-1 mt-1">
                    5:07 PM
                  </span>
                </div>

                {/* Counter-Offer Accepted / Deal Locked Card */}
                <div className="w-full bg-surface-container-low rounded-2xl p-4 shadow-sm border-l-4 border-l-secondary flex flex-col gap-3 border border-outline-variant/30 animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                      </span>
                      <div>
                        <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold block">
                          Counter-Offer Accepted by {rawOwnerName}
                        </span>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight m-0 font-bold">
                          ₹1.46 Cr Finalized
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Deal Locked
                    </span>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-bold text-on-surface">
                          ₹50,000 Escrow Token Secured &amp; Locked
                        </span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant">
                          RBI-Regulated Escrow • Ref: #AG-ESC-8924
                        </span>
                      </div>
                    </div>
                    <span className="font-label-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed m-0">
                    Mutual settlement confirmed at{" "}
                    <strong className="text-on-surface font-semibold">₹1,46,00,000</strong>. Property has
                    been temporarily unlisted from public search for 14 days pending registry
                    inspection.
                  </p>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      type="button"
                      className="py-2 px-3 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-1 font-bold border-none cursor-pointer"
                      onClick={() =>
                        alert(
                          "Escrow Receipt #AG-ESC-8924\nAmount: ₹50,000\nFinal Agreed Price: ₹1.46 Cr\nStatus: Funds Safely Held under RBI Nodal Guidelines."
                        )
                      }
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      View Escrow Receipt
                    </button>
                    <button
                      type="button"
                      className="py-2 px-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-all flex items-center gap-1 font-bold border-none cursor-pointer"
                      onClick={() =>
                        alert(
                          "Opening Walkthrough & Legal Registry Schedule Assistant for Saturday inspection."
                        )
                      }
                    >
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      Schedule Inspection
                    </button>
                  </div>
                </div>

                {/* Dynamically Sent Messages & Offers */}
                {customMessages.map((msg) => {
                  if (msg.isOfferProposal) {
                    return (
                      <div
                        key={msg._id}
                        className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-md border-l-4 border-l-secondary flex flex-col gap-3 animate-in slide-in-from-bottom duration-300"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                              <span className="material-symbols-outlined text-[20px]">send</span>
                            </span>
                            <div>
                              <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold block">
                                You Proposed a Counter Offer
                              </span>
                              <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight m-0 font-bold">
                                {formatCrLakh(msg.offerAmount)}
                              </h4>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
                            Awaiting {rawOwnerName}
                          </span>
                        </div>

                        <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between text-on-surface">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-[18px]">
                              verified
                            </span>
                            <span className="font-body-sm text-[12px] text-on-surface-variant">
                              Secured with Token Escrow
                            </span>
                          </div>
                          <span className="font-label-sm text-label-sm font-bold text-on-surface">
                            ₹50,000 Locked
                          </span>
                        </div>

                        <p className="font-body-sm text-[12px] text-on-surface-variant m-0">
                          You sent a formal offer of{" "}
                          <strong className="text-on-surface font-semibold">
                            ₹{formatINR(msg.offerAmount)}
                          </strong>{" "}
                          for {propertyTitle}. Valid for {msg.offerValidity || "48 Hours"}.
                        </p>

                        <div className="flex items-center justify-between pt-1 text-on-surface-variant font-label-sm text-[11px]">
                          <span>{formatRelativeTime(msg.sentAt)}</span>
                          <span className="text-secondary font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">verified_user</span>{" "}
                            Escrow Active
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id}
                      className="flex flex-col items-end gap-1 max-w-[85%] self-end animate-in slide-in-from-bottom duration-200"
                    >
                      <div className="bg-primary text-on-primary rounded-2xl rounded-tr-xs px-4 py-3 shadow-md">
                        <p className="font-body-md text-body-md m-0 leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-[11px] px-1">
                        <span>{formatRelativeTime(msg.sentAt)}</span>
                        <span className="material-symbols-outlined text-secondary-fixed-dim text-[14px]">
                          done_all
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div ref={streamBottomRef} />
              </div>

              {/* Bottom Interactive Anchor (Composer + Suggestions) */}
              <div className="stitch-bottom-anchor">
                <div className="stitch-chips-tray">
                  <button
                    type="button"
                    className="stitch-chip-btn bg-secondary-container text-on-secondary-container font-bold"
                    onClick={() => handleChipClick("🛡️ View Escrow Receipt")}
                  >
                    🛡️ View Escrow Receipt
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
                    onClick={() => handleChipClick("🏷️ Can you do ₹1.45 Cr?")}
                  >
                    🏷️ Can you do ₹1.45 Cr?
                  </button>
                  <button
                    type="button"
                    className="stitch-chip-btn bg-surface-container-low text-on-surface"
                    onClick={() => handleChipClick("📑 Request Legal Draft Agreement")}
                  >
                    📑 Request Legal Draft Agreement
                  </button>
                </div>

                <div className="stitch-composer-wrap">
                  <form
                    className="stitch-composer-form"
                    onSubmit={(e) => void handleSendMessage(e)}
                  >
                    <button
                      aria-label="Attach documents or photos"
                      className="stitch-composer-icon-btn"
                      type="button"
                      onClick={() =>
                        alert("Document Attachment: You can attach RERA documents, title deeds, or bank sanction letters.")
                      }
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
                      disabled={sending || !draft.trim()}
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

            {/* COLUMN 3: RIGHT DETAILS DRAWER (Property & Safe Escrow Dossier - Stitch 31) */}
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
                    {propertyInfo?.location?.locality || "Model Town"} • Direct Owner
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary text-on-primary font-label-sm text-[10px] font-bold shadow-xs">
                    Ready to Move
                  </div>
                </div>

                <h3 className="font-headline-sm text-sm text-on-surface font-bold m-0 mb-1 truncate">
                  {propertyTitle}
                </h3>
                <p className="font-body-sm text-[11px] text-on-surface-variant m-0 mb-3 truncate">
                  {[propertyInfo?.location?.locality, propertyInfo?.location?.city, propertyInfo?.location?.state].filter(Boolean).join(", ") || "Model Town, Amritsar, Punjab"}
                </p>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-container-low rounded-xl mb-3">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[9.5px] text-outline">Configuration</span>
                    <span className="font-label-lg text-xs text-on-surface font-bold">
                      {propertyInfo?.bedrooms ? `${propertyInfo.bedrooms} BHK Luxury` : "4 BHK Luxury"}
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
                      {plotFacing} (Vaastu)
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
                  <span className="font-label-sm text-[11px] text-outline">Listed Asking Price:</span>
                  <span className="font-headline-md text-sm text-primary font-extrabold">
                    ₹{formatINR(propertyAskingPrice)}
                  </span>
                </div>
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
                  Your token deposit of <strong className="text-on-surface font-semibold">₹50,000</strong> is parked safely under RBI nodal trustee guidelines until title deed mutation and draft sale agreement execution.
                </p>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-[10.5px]">
                  <span className="flex items-center gap-1 text-secondary font-bold">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    100% Refundable
                  </span>
                  <span className="text-outline font-medium">Zero Brokerage Fee</span>
                </div>
              </div>

              {/* Card 3: Owner Trust & Verification Matrix */}
              <div className="stitch-dossier-card">
                <span className="font-label-sm text-[11px] uppercase font-bold text-outline tracking-wider block mb-3">
                  Owner Verification Matrix
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
                      KYC Verified Title Holder
                    </span>
                  </div>
                </div>
                <div className="space-y-2 font-label-sm text-[11px]">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-secondary">flash_on</span>
                      Response Rate
                    </span>
                    <span className="font-bold text-on-surface">100% (&lt; 15 mins)</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-primary">badge</span>
                      Identity Verification
                    </span>
                    <span className="font-bold text-secondary flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-primary">real_estate_agent</span>
                      Property Mutation
                    </span>
                    <span className="font-bold text-secondary flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Clear Title
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
                  Select a preferred slot for private tour with {rawOwnerName}.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-center font-label-sm text-[10.5px] font-bold border-none cursor-pointer transition-colors"
                    onClick={() => alert(`Requested walkthrough for Saturday inspection with ${rawOwnerName}.`)}
                  >
                    Sat • 11:00 AM
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-center font-label-sm text-[10.5px] font-bold border-none cursor-pointer transition-colors"
                    onClick={() => alert(`Requested walkthrough for Sunday inspection with ${rawOwnerName}.`)}
                  >
                    Sun • 4:00 PM
                  </button>
                </div>
                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold transition-all flex items-center justify-center gap-1 border-none cursor-pointer shadow-xs hover:bg-primary-container"
                  onClick={() => alert(`Opening inspection scheduler with ${rawOwnerName}.`)}
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Request Custom Time
                </button>
              </div>
            </aside>
          </div>
        </div>

      {/* =====================================================================
          INTERACTIVE COUNTER-OFFER BOTTOM SHEET MODAL (Stitch 32 Specification)
          ===================================================================== */}
      {offerModalOpen && (
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
                  Direct negotiation with {ownerName}
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
              <div className="text-right flex-shrink-0">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                  Asking Price
                </span>
                <span className="font-headline-sm text-[14px] font-bold text-primary">
                  {formatCrLakh(propertyAskingPrice)}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase">
                  Your Counter Bid
                </label>
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
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[18px] flex items-center justify-center active:scale-95 transition-all border-none cursor-pointer"
                  onClick={() =>
                    setCurrentCounterVal((v) => Math.max(5000000, v - 100000))
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

              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-label-sm text-[11px] text-on-surface-variant font-bold">
                  Presets:
                </span>
                {[14400000, 14600000, 14800000].map((amt) => {
                  const isActive = currentCounterVal === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      className={`px-2.5 py-1 rounded-full font-label-sm text-[11px] font-bold active:scale-95 transition-all border-none cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                      onClick={() => setCurrentCounterVal(amt)}
                    >
                      {formatCrLakh(amt)}
                    </button>
                  );
                })}
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
                  ₹50,000 Escrow Security Hold
                </p>
                <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug m-0">
                  Safely parked in RBI-regulated nodal escrow. 100% refundable if counter offer is
                  declined or expires.
                </p>
              </div>
            </div>

            <div className="pt-1">
              <button
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary font-headline-sm text-[16px] font-bold shadow-lg hover:bg-primary-container active:scale-95 transition-all text-center flex items-center justify-center gap-2 border-none cursor-pointer"
                onClick={handleSubmitCounterOffer}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">handshake</span>
                <span>Submit Counter Offer • {formatCrLakh(currentCounterVal)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
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
