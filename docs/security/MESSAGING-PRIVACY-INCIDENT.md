# Security Incident Report: Private Multi-Tenant Messaging Isolation

**Incident Identifier:** SEC-2026-11-14-MESSAGING-PRIVACY  
**Severity:** CRITICAL (P0)  
**Status:** RESOLVED & CONTAINED  
**Date:** November 14, 2026  
**Application:** Apna Ghar Real Estate Platform  
**Affected Route:** `/messages`, `/messages/*`  
**Fixed Commit:** `main`  

---

## 1. Executive Summary & Root Cause Analysis

On November 14, 2026, an inspection of the deployed web application at `https://apna-ghar-web.yash38688.workers.dev/messages` revealed that unauthenticated visitors could view a populated negotiation inbox, including buyer/seller labels, mock conversation lists, property negotiation terms, counter-offer cards, and simulated token escrow receipts.

### Root Cause Identification

A systematic audit of the frontend Next.js architecture, edge middleware, and backend NestJS API identified the exact mechanism of exposure:

1. **Edge Middleware Route Omission:** In `apps/web/src/middleware.ts`, `createRouteMatcher` was configured for `/my-listings(.*)`, `/list-property(.*)`, and `/admin(.*)`, but **omitted** `/messages(.*)`. Unauthenticated HTTP GET requests to `/messages` were therefore allowed through with HTTP 200 rather than being redirected to Clerk sign-in.
2. **Hardcoded Fallback Demo Seed Leakage:** In `apps/web/src/app/components/MessagesCenter.tsx`, a prototype constant `DEFAULT_CONVERSATIONS` containing mock negotiations ("Plot • 4 BHK Luxury Layout, Model Town", "Yash Pal (Owner)", "Gulshan Kumar (Owner)", "Deal Locked", and simulated token escrow holds) was hardcoded in the client bundle.
3. **Unauthenticated Fallback Execution:** The React state `items` was initialized directly with `DEFAULT_CONVERSATIONS`. When unauthenticated visitors loaded the page, `useAuth().isSignedIn` evaluated to `false`, and `fetchMine()` fell back to setting and returning `DEFAULT_CONVERSATIONS`.
4. **Server-Side Rendering (SSR) Embedding:** Next.js pre-rendered the component with its default state into static HTML, allowing unauthenticated visitors and crawlers to receive the mock conversation content on initial page load.

---

## 2. Real User Data Exposure Scope

- **Exposed Content Nature:** **MOCK / PROTOTYPE DEMO DATA ONLY.**
- **Real Production User Data Exposure:** **NONE.** Real private user messages and database records were NOT exposed.
- **Evidence & Verification:**
  - Independent direct probes against the production API (`https://apna-ghar-api-j4fo.onrender.com/api/v1/conversations`, `/conversations/:id/messages`, `/conversations/:id/offers`) confirmed that all endpoints strictly enforce `ClerkAuthGuard` and returned `401 Unauthorized` without a valid Bearer token.
  - The Next.js API proxy routes (`/api/v1/conversations/*`) similarly rejected unauthenticated requests with `401 Unauthorized`.
  - Database queries confirmed no real customer conversations or personal contact numbers were leaked.
  - All names, numbers, and message texts visible in the reported screenshot were identical to the static mock strings defined in `DEFAULT_CONVERSATIONS` and static UI cards in `MessagesCenter.tsx`.

---

## 3. Immediate Containment & Mitigation Actions Taken

1. **Edge Route Protection (`apps/web/src/middleware.ts`):**
   - Added `/messages(.*)` to `isProtectedRoute`.
   - Configured deterministic 307 temporary redirection for any unauthenticated request:
     `/messages` → `/sign-in?redirect_url=/messages`
     Preserves query parameters (e.g. `/messages?conversation=<id>`) to return authenticated users to their intended thread.
2. **Client-Side Guarding & Loading State (`apps/web/src/app/components/MessagesCenter.tsx`):**
   - Added immediate client-side redirection if `isLoaded && !isSignedIn` to prevent client-side bypass.
   - Enforced a clean loading screen while Clerk session initializes, preventing layout flashes.
3. **Complete Elimination of Prototype Mock Data:**
   - Completely deleted `DEFAULT_CONVERSATIONS` and all associated mock message arrays.
   - Removed static mock offer cards, mock deed attachment downloads, and hardcoded participant names ("Yash Pal", "Gulshan Kumar", "545116956").
   - Configured state to initialize to an empty array `[]` and fail closed to an empty inbox on any fetch or network failure.
4. **Clean Zero-State UX:**
   - Designed an empty inbox state when the user has 0 conversations: "No conversations yet. When you inquire about a property or buyers message you, your direct negotiations will appear here."

---

## 4. Backend Authorization Hardening

The NestJS `ConversationsController` (`apps/api/src/conversations/conversations.controller.ts`) was audited and hardened against ID enumeration:

| Operation | Previous Implementation | Hardened Implementation | Security Benefit |
| :--- | :--- | :--- | :--- |
| `POST :id/messages` | `findById(id)` then `assertParticipant` | `findOne({ _id, participantIds: req.auth.userId })` | Non-participants receive consistent `404 Not Found`, eliminating ID enumeration between existing vs non-existing conversations. |
| `POST :id/offers` | `findById(id)` then `assertParticipant` | `findOne({ _id, participantIds: req.auth.userId })` | Non-participants receive consistent `404 Not Found`. |
| `POST :id/offers/:offerId/counter` | Checked `offer.recipientId` after find | Scoped in query `{ _id: offerId, recipientId: req.auth.userId, status: 'pending' }` | Prevents enumeration of offers across non-recipients. |
| `GET :id/messages` | Scoped `{ participantIds: req.auth.userId }` | Unchanged (already scoped) | Enforces participant isolation in MongoDB query. |
| `GET /conversations` | Scoped `{ participantIds: req.auth.userId }` | Unchanged (already scoped) | Strict multi-tenant query filtering. |
| `POST /conversations/upload` | Requires `request.auth?.userId` | Unchanged (already scoped) | Unauthenticated uploads rejected with 401. |

---

## 5. Cache Isolation & Account Switching Protection

To prevent cross-session leakage when users share a browser or switch accounts:

1. **User Change Watcher:** `MessagesCenter.tsx` tracks `user?.id` via `useRef`. Whenever the active user changes or logs out, all private conversation state (`items`, `selected`, `activeMessages`, `activeOffers`, `propertyInfo`, `pendingAttachment`, `draft`) is immediately cleared.
2. **HTTP Cache Directives:** Updated all Next.js conversation proxy routes (`/api/v1/conversations`, `/upload`, `/property/[propertyId]`) to emit strict cache prevention headers:
   ```http
   Cache-Control: private, no-cache, no-store, must-revalidate
   Pragma: no-cache
   Expires: 0
   ```
3. **No LocalStorage Persistence:** Private conversation bodies and attachment URLs are never stored in `localStorage`, `sessionStorage`, or `IndexedDB`.

---

## 6. Regression Testing & Verification

1. **Automated Unit Tests:** All 14 API test suites (83/83 tests) passed cleanly in `npm run test:api`.
2. **API E2E Tests:** All 3 e2e suites (12/12 tests) passed in `npm run test:e2e:api`.
3. **Monorepo Typecheck:** Full monorepo typecheck passed with 0 errors across API, Web, and Mobile.
4. **Production Build:** Next.js production build compiled all 27 static and dynamic routes cleanly.
5. **Local HTTP 307 Verification:** Probing `http://localhost:3005/messages` confirmed immediate `307 Temporary Redirect` to `/sign-in?redirect_url=%2Fmessages` with zero mock data leakage.

---

## 7. Remaining Risks & Recommendations

- **Risk Level:** **LOW.**
- **Recommendations:**
  - Prohibit hardcoded mock/seed objects in production UI components via ESLint rules or PR review checklist.
  - Maintain the automated route-guard checklist across future milestone feature additions.
