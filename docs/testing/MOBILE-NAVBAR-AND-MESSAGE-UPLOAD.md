# Apna Ghar — Mobile Navbar & Messaging Attachment Verification Report

**Date:** November 12, 2026  
**Scope:** Mobile Navbar Responsiveness + Messages Attachment Upload Functionality  
**Branch:** `main`  
**Base Commit:** `20148e0`  

---

## 1. Executive Summary

All objectives specified in the **Mobile Navbar & Messaging Attachment Fix** plan have been successfully implemented, audited, verified with live browser testing across mobile viewports (360px, 390px, 430px) and desktop viewports (1366px, 1440px), and validated with full automated typechecking, unit tests, and production builds.

| Component | Reported Issue | Root Cause | Fix Applied | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Navbar Layout** | Broken/clipped controls at 360px–430px; competing CTA buttons. | Over-broad mobile hiding rules and competing desktop buttons in mobile header. | Streamlined mobile header row: logo on left, compact theme selector `[ ◐ ]` + hamburger `[ ☰ ]` on right. | **RESOLVED & VERIFIED** |
| **ThemePicker Dropdown** | Squeezed into a ~42px skinny strip with chopped text and misaligned checkmarks. | `[class*="theme"]{max-width:42px}` in `globals.css` matched `.theme-menu` & `.theme-option`. | Restricted `max-width: 38px` to `.theme-trigger` only; styled `.theme-menu` with `width: 230px`, `z-index: 1200`, `min-height: 42px` touch targets. | **RESOLVED & VERIFIED** |
| **Mobile Drawer Navigation** | Links did not close drawer on tap; redundant controls. | Anchor tags lacked `onClick` drawer close handlers. | Added `onClick={() => setMenuOpen(false)}` across all drawer links; kept appearance picker & auth actions clean. | **RESOLVED & VERIFIED** |
| **Message Attachment Button** | Clicking paperclip showed `alert("Document Attachment: ...")`. | Hardcoded alert in `MessagesCenter.tsx:1437`. | Replaced with real file picker (`input[type="file"]`), supporting images (JPG, PNG, WebP) and documents (PDF) up to 10MB. | **RESOLVED & VERIFIED** |
| **Attachment Preview & Send** | No preview before sending; send button disabled if text was empty. | Lack of attachment preview state in composer. | Added preview card with file icon/thumbnail, filename, formatted size, remove button `×`, and enabled send for attachments without text. | **RESOLVED & VERIFIED** |
| **Attachment Persistence & Display** | Backend and frontend lacked message attachment support. | Schemas only had `senderId`, `text`, `sentAt`. | Added `attachment` metadata to `Message` and `ConversationMessage` schemas, created `/api/v1/conversations/upload`, updated `POST /messages`. | **RESOLVED & VERIFIED** |
| **Conversations 401 Unauthorized** | Console showed duplicate 401 errors on `/api/v1/conversations`. | `fetchMine()` called auth endpoint without checking `isSignedIn`; `fetchApi` retried 401s upstream. | Checked `isSignedIn` before calling `/conversations`; prevented duplicate 401/403 retries in `fetchApi`. | **RESOLVED & VERIFIED** |

---

## 2. Root Cause Analysis & Detailed Fixes

### Part A: Mobile Navbar & ThemePicker

#### Problem 1: Theme Dropdown Squished to 42px
- **Root Cause:** In `apps/web/src/app/globals.css` line 3945, the CSS rule:
  ```css
  .agh-market-header-scope .agh-header-actions [class*="theme"] { max-width: 42px; }
  ```
  matched every child element whose class contained `"theme"`, including `.theme-menu`, `.theme-option`, `.theme-swatch`, and `.theme-check`. As a result, the entire dropdown menu was forced into a 42px-wide column, causing text to wrap vertically or clip.
- **Fix Applied:**
  1. Replaced the wildcard selector with an exact target for the trigger button:
     ```css
     .agh-market-header-scope .agh-header-actions .theme-trigger {
       width: 38px;
       height: 38px;
       min-height: 38px;
       max-width: 38px;
       padding: 0;
       justify-content: center;
       border-radius: 11px;
     }
     .agh-market-header-scope .agh-header-actions .theme-trigger-label,
     .agh-market-header-scope .agh-header-actions .theme-trigger > span:last-child {
       display: none !important;
     }
     ```
  2. Defined explicit, unconstrained dimensions and styling for `.theme-menu`:
     ```css
     .theme-menu {
       position: absolute !important;
       z-index: 1200 !important;
       top: calc(100% + 8px) !important;
       right: 0 !important;
       left: auto !important;
       width: 230px !important;
       min-width: 220px !important;
       max-width: calc(100vw - 24px) !important;
       padding: 10px !important;
       border-radius: 16px !important;
       background: var(--color-surface) !important;
       box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22) !important;
       box-sizing: border-box !important;
     }
     ```
  3. Ensured `.theme-option` items have a minimum 42px touch target, clean horizontal flex alignment, swatches, and green checkmark `✓` for the active theme.

#### Problem 2: Mobile Header Actions Missing or Competing
- **Root Cause:** Lines 4813 and 4927 hid `.agh-header-actions` completely with `display: none!important`, removing the theme picker from the header on the homepage while showing broken states on other routes.
- **Fix Applied:**
  - Allowed `.agh-header-actions` to remain visible on mobile (`display: flex !important; align-items: center; gap: 7px; margin-left: auto;`).
  - Scoped `display: none !important` strictly to desktop-only actions (`.agh-post-btn`, `.agh-auth-guest-actions`, `.agh-auth-user-actions`, `.agh-my-listings`, `.agh-icon-link`, `.agh-account-btn`, `.agh-saved-icon`).
  - Preserved the compact ThemePicker icon trigger `[ ◐ ]` next to the Hamburger menu toggle `[ ☰ ]`.

---

### Part B: Message Attachment Upload & 401 Unauthorized

#### Problem 1: Attachment Button Alert
- **Root Cause:** `MessagesCenter.tsx:1437` had a hardcoded `alert("Document Attachment: You can attach RERA documents...")`.
- **Fix Applied:**
  1. Replaced the alert with a hidden `<input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,application/pdf" />`.
  2. Implemented `handleFileSelect` with strict client-side validation:
     - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
     - Maximum file size: 10 MB (`10 * 1024 * 1024` bytes).
     - Informative toast error messages for invalid formats or oversized files.
  3. Created an interactive Composer Attachment Preview card displaying:
     - Image thumbnail (for photos) or `📄` document icon (for PDFs).
     - Truncated filename and formatted human-readable size (`KB`/`MB`).
     - Remove `×` button that revokes object URLs and clears input state.
  4. Updated `handleSendMessage` to upload the file, construct message payload with attachment metadata, and render the attachment in the chat thread.

#### Problem 2: Backend & Web API Persistence
- **Fix Applied:**
  1. **API Schema:**
     - Updated `ConversationMessage` in `apps/api/src/conversations/schemas/conversation.schema.ts` to include optional `attachment?: { url: string; filename: string; contentType: string; sizeBytes?: number; publicId?: string }` and relaxed `text` to optional.
     - Updated `Message` in `apps/api/src/conversations/schemas/message.schema.ts` to store `attachment`.
  2. **API Controller:**
     - Added `MessageAttachmentDto` with `@ValidateNested()` in `SendMessageDto`.
     - In `sendMessage`, persisted `attachment` to both `conversations` and dedicated `messages` collections.
     - Added `@Post('upload')` endpoint accepting files up to 10MB via `FileInterceptor`.
  3. **Web API Route:**
     - Created `apps/web/src/app/api/v1/conversations/upload/route.ts` supporting direct signed Cloudinary uploads, API proxy uploads, and resilient base64 fallback.
     - Updated `apps/web/src/app/api/v1/conversations/route.ts` to forward `attachment` in message payloads.

#### Problem 3: 401 Unauthorized Red Console Errors
- **Root Cause:**
  1. Unauthenticated visitors opening `/messages` triggered `fetchMine()`, which sent an unauthenticated request to `/api/v1/conversations`.
  2. `fetchApi()` in `apps/web/src/app/utils/api.ts` treated any `!res.ok` (including 401) as a route failure and retried against the upstream URL, generating two consecutive 401 errors in the console.
- **Fix Applied:**
  1. In `MessagesCenter.tsx`, guarded `fetchMine()` with `if (!isSignedIn) return DEFAULT_CONVERSATIONS;`. Unauthenticated users now load preview conversations without firing unauthenticated requests to protected endpoints.
  2. In `apps/web/src/app/utils/api.ts`, updated `fetchApi()` to return immediately on `401` or `403` status codes without triggering duplicate upstream retries.

---

## 3. Live Browser Verification Results

### A. Mobile Viewports (Emulated in Chrome)

| Viewport | Element / Flow | Verification Check | Result |
| :--- | :--- | :--- | :--- |
| **360x800** | Header Layout | Logo on left, compact `[ ◐ ]` and `[ ☰ ]` on right | **PASS** — Zero horizontal overflow (`scrollWidth: 360, innerWidth: 360`) |
| **360x800** | Theme Dropdown | Tap `[ ◐ ]`, menu opens below trigger | **PASS** — Width 230px, fully visible, all 5 themes readable |
| **390x844** | Theme Dropdown | Tap `[ ◐ ]`, select AMOLED Black | **PASS** — Switched theme, dropdown auto-closed, active checkmark `✓` |
| **390x844** | Mobile Drawer | Tap `[ ☰ ]`, drawer slides in | **PASS** — "Explore Apna Ghar", Appearance selector, navigation links, Sign in / Sign up |
| **390x844** | Drawer Close | Tap `×` or navigation link | **PASS** — Drawer closed smoothly |
| **430x932** | Header Layout | Proportions & alignment | **PASS** — Zero horizontal overflow (`scrollWidth: 430, innerWidth: 430`) |

### B. Desktop Viewports (Regression Check)

| Viewport | Layout | Result |
| :--- | :--- | :--- |
| **1366x768** | Full Header | **PASS** — Logo, Search, Navigation links, Appearance dropdown, Sign in, Sign up |
| **1440x900** | Full Header | **PASS** — Pristine horizontal alignment, no overlapping, zero visual regression |

### C. Messages Attachment Flow

| Step | Action | Expected Behavior | Actual Browser Result |
| :--- | :--- | :--- | :--- |
| 1 | Visit `/messages` | No 401 errors in console | **PASS** — Zero 401 Unauthorized errors |
| 2 | Open conversation | Chat stream renders | **PASS** — Conversation with Yash Pal loaded |
| 3 | Tap Paperclip icon | File selection opens (no alert!) | **PASS** — Hidden file input triggered, no `alert()` pop-up |
| 4 | Select PDF document | Document preview appears in composer | **PASS** — `📄 test_agreement.pdf (32 B) • Ready to send` with remove button `×` |
| 5 | Tap Send | Send button active without draft text | **PASS** — Message sent with attachment |
| 6 | Render in thread | PDF document card in chat bubble | **PASS** — `📄 test_agreement.pdf (PDF Document • 32 B) [View ↗]` |
| 7 | Select image | Image thumbnail preview in composer | **PASS** — Thumbnail, filename, size, remove button `×` |
| 8 | Add text + Send | Send message with image + caption | **PASS** — Image preview + caption rendered in chat stream with `done_all` checkmarks |

---

## 4. Automated Test & Build Summary

- **API Unit Tests:**
  `npm run test:api`  
  **Result:** `14 passed, 14 total` — `83 passed, 83 total` (including new attachment storage and upload tests).
- **Web Typecheck:**
  `npm run typecheck:web`  
  **Result:** `npx tsc --noEmit -p apps/web/tsconfig.json` — **0 errors**.
- **API Typecheck:**
  `npm run typecheck:api`  
  **Result:** `npx tsc --noEmit -p apps/api/tsconfig.json` — **0 errors**.
- **Web Production Build:**
  `npm run build:web`  
  **Result:** `Compiled successfully` — all 27 static and dynamic routes compiled, including new `/api/v1/conversations/upload`.
- **API Production Build:**
  `npm run build:api`  
  **Result:** `nest build` — **Compiled successfully**.

---

## 5. Artifacts & Commits

- Commit: `fix(web): repair mobile navigation and message attachments`
- Files Modified:
  - `apps/web/src/app/globals.css`
  - `apps/web/src/app/components/MarketplaceHeader.tsx`
  - `apps/web/src/app/components/MessagesCenter.tsx`
  - `apps/web/src/app/utils/api.ts`
  - `apps/web/src/app/api/v1/conversations/route.ts`
  - `apps/web/src/app/api/v1/conversations/upload/route.ts`
  - `apps/api/src/conversations/schemas/conversation.schema.ts`
  - `apps/api/src/conversations/schemas/message.schema.ts`
  - `apps/api/src/conversations/conversations.controller.ts`
  - `apps/api/src/conversations/conversations.controller.spec.ts`
  - `docs/testing/MOBILE-NAVBAR-AND-MESSAGE-UPLOAD.md`
