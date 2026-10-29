# Apna Ghar — Master Execution Checklist

**Repository:** `Yashpal568/apna-ghar`  
**Working branch:** `feat/m1-foundation-completion`  
**Last updated:** 2026-10-29  
**Purpose:** Single day-to-day source of truth. Update this file whenever work starts, finishes, is blocked, or changes scope. Do not restart from a different milestone without recording why.

## Rules for every work session

- [ ] Read this checklist and `docs/18-phase-wise-delivery-roadmap.md` before changing code.
- [ ] Continue from **Current checkpoint** below; do not silently jump to mobile, marketing extras, or another milestone.
- [ ] Keep the five themes (Light, Midnight, Graphite, Forest, AMOLED Black) and System default intact.
- [ ] Preserve existing working routes and features; inspect code and contracts before changing them.
- [ ] Do not call a feature complete until implementation, tests, and applicable browser/API verification support that claim.
- [ ] After each meaningful task, update this file with commit SHA, checks actually run, remaining blockers, and the next exact task.

## Current checkpoint — continue here

**Active milestone:** Web marketplace (M2 / roadmap Phase 1), after marketplace-first homepage/navigation and API deployment fixes.

**Last known completed work**
- [x] Reframed the homepage as a property marketplace rather than a generic agency/portfolio landing page.
- [x] Reordered primary navigation around Home, Buy, Rent, All properties, Saved, and My listings.
- [x] Added responsive marketplace-first homepage styles while preserving the existing global stylesheet and theme system.
- [x] Fixed production NestJS startup to resolve the compiled entrypoint.
- [x] Latest reported Render deployment is Live; latest reported GitHub CI and Quality Checks passed on commit `884b04b3d7aea6eb013a46ac6393a138902b5d00`.
- [x] User confirmed API health and readiness are ready (user confirmation; not independently re-run in this session).

**Immediate next task (do this before moving to another milestone)**
- [x] Fixed homepage Buy/Rent tabs to control the transaction value submitted by the search form.
- [x] Matched homepage property types (house, apartment, villa, plot, commercial) to the listing form's existing category values and added the missing commercial option to the search page.
- [x] Inspected API DTO/service and confirmed `categoryId` is a string filter and `listingType` accepts only `sale` / `rent`; the UI maps Buy to the API's `sale` value in the existing search-results component.
- [x] Vercel deployment check reports success for checklist commit `8d993abc571d4f174b4f0fc6e0a8f796ba2c8b5a` (the deployment includes the homepage search fixes). This confirms the deployment build gate, not browser-level functional QA.
- [ ] Verify the deployed search journey against real listings and inspect filters/pagination in the browser; runtime log access requires Vercel team authorization.

## Milestone status

### M0 — Product/technology decisions
- [x] React Native Community CLI selected for the eventual mobile app.
- [x] NestJS + TypeScript API selected.
- [x] Next.js web and dedicated admin selected.
- [x] Clerk selected; exact sign-in methods still need confirmation before auth implementation.
- [x] MongoDB selected; Cloudinary selected for intended listing media.
- [x] Free launch; payment collection remains disabled.

### M1 — Foundation and CI
- [x] Workspace and app scaffolding.
- [x] API health and MongoDB readiness routes.
- [x] CI and Quality Checks were reported green for the latest startup-fix commit.
- [x] Render API deployment reported Live.
- [ ] Verify the exact deployed health/readiness endpoints again if deployment/runtime changes.
- [ ] Confirm environment validation and setup docs remain complete.
- [ ] Do not mark the whole product production-ready based on CI or API liveness alone.

### M2 — Web marketplace experience (ACTIVE)
- [x] Marketplace-first homepage and primary navigation pass.
- [x] Responsive CSS pass for new homepage.
- [x] Homepage Buy/Rent tabs and search form state work together (implementation committed; browser QA pending).
- [x] Category/type values align with the existing listing form and string-based API filter (end-to-end data QA pending).
- [ ] Real API-backed search, filters, sort, pagination verified end-to-end (Vercel build/deploy check passed; live browser/API interaction still pending).
- [x] Property detail page uses live API data with loading and not-found/error states; error state now retains shared marketplace header/footer and navigation (deployment/browser QA pending).
- [x] Listing form has API-backed create/publish and a three-step preview; saved local drafts now restore into the form (commit `4015cc0`; build/browser QA pending).
- [ ] My Listings supports real user-owned listings and lifecycle actions.
- [ ] Saved properties behavior is defined and persistence requirements are met.
- [ ] Profile/account workflows are functional.
- [ ] All relevant routes tested at mobile, tablet, desktop.
- [ ] Compare implemented screens with approved Figma; do not claim parity before review.

### M3 — Backend domain and identity
- [ ] Inspect/confirm domain APIs, DTO validation, consistent error/pagination contracts.
- [ ] Clerk token verification and user/profile sync.
- [ ] Server-side roles/permissions and ownership checks.
- [ ] Property/category/user/favorite/contact/report domains implemented and tested.
- [ ] Integration tests cover success, validation failure, unauthorized access, and ownership denial.

### M4 — Admin and moderation
- [ ] Server-protect admin routes and every privileged API.
- [ ] Users, listings, categories, reports, moderation, configuration, audit trail.
- [ ] Verify non-admin access is denied server-side.
- [ ] Destructive actions have confirmation and audit reason.

### M5 — SEO
- [ ] Titles/descriptions/canonicals/social metadata.
- [ ] Sitemap, robots, accurate structured data, breadcrumbs, clean shareable property URLs.
- [ ] Public routes indexable; private/account/admin routes excluded.
- [ ] Performance and Search Console readiness.

### M6 — Security/reliability
- [ ] DTO/upload validation, secure headers, CORS allowlist, rate limits, abuse protection.
- [ ] IDOR/BOLA, role escalation, mass assignment, injection, upload abuse tests.
- [ ] Secrets hygiene, redacted logs, request IDs, monitoring, backup/restore.
- [ ] Privacy/terms/safety copy reviewed before launch.

### M7 — SaaS entitlements
- [ ] Configurable plans, feature keys, quotas and server-side enforcement.
- [ ] All users assigned Free at launch.
- [ ] Payment collection remains disabled unless explicitly approved.

### M8 — MongoDB/Cloudinary integration
- [ ] Schemas/indexes and repository integration verified against real MongoDB.
- [ ] Cloudinary uploads use server-authorized flow; validate type, size, ownership, cleanup.
- [ ] Integration tests cover unavailable DB, upload failure, duplicates and cleanup.
- [ ] Readiness reflects database connection, not only HTTP process liveness.

### M9 — Release QA
- [ ] End-to-end buyer, owner/broker, and admin journeys pass.
- [ ] Accessibility, theme, responsive, SEO, performance, privacy and security review.
- [ ] Staging smoke test, monitoring, backups, rollback plan.
- [ ] Production readiness signed off only with evidence.

### M10 — Native mobile (LAST)
- [ ] Start only after web, backend, admin, SEO, security, entitlements, and media/data integration gates are accepted.
- [ ] Complete React Native Community CLI Android/iOS projects and core marketplace journeys.
- [ ] Verify five themes plus System and device/emulator behavior.

## Session log

| Date | Change / evidence | Commit | Next exact task |
|---|---|---|---|
| 2026-10-29 | Improved property detail error layout (`2cd6305`), restored listing drafts (`4015cc0`), and fixed saved-home removal to match either slug or ID (`ef80954`). Vercel success was confirmed for `4015cc0`; no CI status has yet been returned for `ef80954`. | `ef80954` — code committed; CI/deployment/browser QA pending | Verify latest CI/deployment, then test live search and authenticated create/manage listing journey. |

## Blockers / decisions needed

- Confirm Clerk sign-in methods before auth wiring; do not assume OTP.
- Approved standalone logo assets are not present in the repo; do not replace the approved logo with an invented one.
- App Store/Play Store links must remain placeholders until official release URLs exist.
- Approved Figma inventory and frame-to-route comparison are not complete.

| 2026-10-29 | M3 implementation pass: initial user profile creation now seeds only from fields available in the server-verified Clerk token; added conversation-controller tests for listing scope, owner self-contact prevention, conversation creation, participant authorization, inactive properties and malformed conversation IDs. Added ObjectId validation before message reads/sends. | API branch commits `6e37cb66`, `a8c8a315`, `7bd91a01`, `1b037b41`, `42efdd9b`, `1f0b323d`, `7a28921c` | Initial CI run caught a test mismatch where the test conversation ID validator used an invalid hex pattern; corrected to `[a-f0-9]`. Latest CI run `40879921474` passed typecheck, API unit tests, API HTTP end-to-end tests, API build and web build. Authenticated buyer/seller live-session validation and Render runtime confirmation remain outstanding; M3 is not marked complete yet. |

| 2026-10-29 | Live API smoke via Cloudflare Browser Rendering: `GET https://apna-ghar-api-j4fo.onrender.com/api/v1/categories` returned HTTP 200 with six real category records from Render. CI run `40880331438` and Quality Checks run `40880331447` both succeeded on the M3 branch after the profile-sync and chat-auth tests. | Public category endpoint verified; all CI stages green | Protected conversations and profile routes still require a real Clerk session; a two-account buyer/seller exchange cannot be honestly marked live-verified without authenticated sessions. M3 implementation is ready for that acceptance test. |
