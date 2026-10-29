# Apna Ghar — Master Execution Checklist

**Repository:** `Yashpal568/apna-ghar`  
**Working branch in this session:** `deploy/cloudflare-preview` (the existing mainline marketplace checkpoint is documented separately below; keep this preview branch isolated until runtime and CI are verified).  
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
- [x] Implemented My Listings edit entry point and form loading via protected `/properties/mine`; edit submits a PATCH to the owner-scoped API. Hide/publish/delete controls already exist. Browser/API lifecycle verification remains pending.
- [x] Implemented signed-in saved-home API sync from search/detail and migrated device-saved homes into the account on the Saved page; signed-out users retain local-only saves. Runtime verification remains pending.
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

| 2026-10-29 | Dynamic search smoke test on the deployed Worker returned HTTP 200 for `/search?transaction=buy&type=commercial`; client-side search reached the empty-results state rather than the API-unavailable/error state. Worker telemetry for version `76982847-875b-4adc-b5b1-2bb73eb14eb7` shows successful `/search` and `/icon.svg` requests; no Vercel Insights request appeared in that version's smoke-test events. The API currently returned zero matching published listings for this query, so price/sort/pagination with actual inventory and the authenticated publish/edit/hide/delete journey cannot be fully proven without a signed-in session and an active test listing. | `76982847-875b-4adc-b5b1-2bb73eb14eb7` | M2 implementation deployed; finish authenticated owner lifecycle QA with a test listing before marking M2 complete. |

| 2026-10-29 | Cloudflare build `c44f03e2-00fb-4dc9-aa97-2f76bbd0ee55` completed successfully and deployed Worker version `76982847-875b-4adc-b5b1-2bb73eb14eb7`. Browser Rendering smoke test for `/search?transaction=buy&type=commercial` returned HTTP 200, correct page title, search form and commercial filter, with no Clerk missing-secret/internal-server-error text. Homepage smoke test also returned HTTP 200 and includes the commercial type. Vercel preview deployments were disabled to pause Vercel previews while preserving production project settings. The Vercel analytics script is now gated to Vercel deployments, avoiding the Cloudflare-side 404. Dynamic API-result state and signed-in user journeys still need interactive verification; Browser Rendering has previously returned 429 on repeated calls. | `5680de83` (Cloudflare deployed version `76982847`) | Verify dynamic search/API response and authenticated saved/publish/edit lifecycle; keep M2 active until acceptance checks pass. |

| 2026-10-29 | Follow-up M2 fixes: added commercial property to homepage search; search now hydrates saved IDs from the signed-in account; property detail hydrates server-saved state and toggles from the displayed state. Cloudflare build `6831cef3-f332-4246-8e85-57c3f54d40ba` completed successfully and deployed Worker version `5323b16b-b67c-49fa-b861-6c2234347f71`; Browser Rendering smoke test returned homepage HTTP 200 and Clerk handshake completed (redirects then 200). `CLERK_SECRET_KEY` is present in runtime secrets. Latest build `dc63883a-ef0f-4387-93a6-04cbe877bdd5` is queued for these follow-up fixes; browser rendering requests then hit Cloudflare 429, so full route QA remains pending. No Vercel deployment/retry was triggered. | `df1b6cbb`, `b957f1a9`, `a9ad5438`, `a085fe6b` | Wait for latest Cloudflare build; verify search/saved/listing edit flows and live API, then decide M2 exit gate. |

| 2026-10-29 | M2 implementation: fixed duplicate Saved page export; made saved homes sync with authenticated API and migrate local saves; wired search/detail save and remove actions to `/saved-properties`; added owner listing edit route (`/list-property?edit=...`) that loads owner-scoped listing data and PATCHes changes; added Edit details action in My Listings. Cloudflare build queued for verification; Vercel deliberately not triggered due rate limit. | `109bdec2`, `748974f0`, `88895f1a`, `10b3aba4`, `3a7a8582`, `b94c5005` | Verify Cloudflare build and runtime; then exercise browse/search/save/publish/edit/hide/delete in browser with Clerk and live API. |

| 2026-10-29 | Audited all 38 Markdown documentation files on `deploy/cloudflare-preview`, including PRDs, milestone plans, master checklist, design/theme specs, and Cloudflare migration checklist. Added Google Fonts typography guide and applied typography to web CSS; aligned heading font to the approved Figma source (Manrope + Inter). Latest preview branch commit `ff2c151` has a Vercel status failure due to deployment rate limit, not a reported code compilation failure; Cloudflare build triggered as `b2b959fc-6a4c-46df-bbb5-ec9c53161c46`, status was queued at last check. | `9c737773` / `d30f09e3` / `ff2c151` (then typography alignment follow-up) | Recheck Cloudflare build outcome and run API-backed browser smoke tests; do not claim M2 or Cloudflare acceptance until verified. |


| Date | Change / evidence | Commit | Next exact task |
|---|---|---|---|
| 2026-10-29 | Improved property detail error layout (`2cd6305`), restored listing drafts (`4015cc0`), and fixed saved-home removal to match either slug or ID (`ef80954`). Vercel success was confirmed for `4015cc0`; no CI status has yet been returned for `ef80954`. | `ef80954` — code committed; CI/deployment/browser QA pending | Verify latest CI/deployment, then test live search and authenticated create/manage listing journey. |

## Blockers / decisions needed

- Confirm Clerk sign-in methods before auth wiring; do not assume OTP.
- Approved standalone logo assets are not present in the repo; do not replace the approved logo with an invented one.
- App Store/Play Store links must remain placeholders until official release URLs exist.
- Approved Figma inventory and frame-to-route comparison are not complete.


| 2026-10-29 | Fixed visible icon-font/ligature fallback styling, added responsive mobile bottom navigation (Home/Explore/Saved/My listings/Profile), added a Clerk sign-out action to the profile security card, and tightened mobile homepage hero/search spacing, category/footer grids, profile cards/forms, and tablet header reflow. Existing four-photo homepage carousel remains with accessible slide controls and automatic rotation. Cloudflare build `94286fe4-7e4d-421f-b692-aee7dd59b577` completed successfully; deployed version `6973da97-07e2-4ea9-9951-e85aa9d89daf`. Mobile browser scrape at 390×844 confirms bottom nav spans the viewport (390×66), profile hero/cards fit within 366px content width, and header menu button is present. Sign-out button is conditional on a signed-in Clerk session and was not visible in unauthenticated browser scrape. | PR #12 merged into `deploy/cloudflare-preview` | Verify with a real signed-in Clerk session; test 320/360/390/430px widths and tablet/desktop, confirm carousel auto-advance visually, and continue M2 acceptance before M3. |
