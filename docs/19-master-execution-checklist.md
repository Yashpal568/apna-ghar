# Apna Ghar — Master Execution Checklist

**Repository:** `Yashpal568/apna-ghar`  
**Working branch:** `feat/m3-backend-identity` (PR #11 targets `deploy/cloudflare-preview`). This is the sole authoritative milestone status and handoff file.  
**Last updated:** 2026-10-30  
**Purpose:** Single day-to-day source of truth. Update this file whenever work starts, finishes, is blocked, or changes scope. Do not restart from a different milestone without recording why.

## Locked execution rules (single source of truth)

- This file is the sole authoritative project status and handoff record; other phase docs are references only.
- Every completed task requires a Git commit SHA, actual passing test evidence, and an updated checklist entry. No evidence means not complete.
- Record exact workflow/run IDs and outcomes. Pending, skipped, mocked, unavailable, or failed checks are never passes.
- Update this checklist after each meaningful implementation task with commit SHA, tests run, blockers, and next exact task.
- Read this checklist and inspect the current PR/head/latest CI before each session.
- Preserve approved branding and themes. No cosmetic redesign until functional milestones are accepted.
- Web-first order: M2, M3, M4 admin, M5 SEO, M6 security, M7 entitlements, M8 data/media, M9 release QA, then M10 mobile LAST.
- Free launch; payments stay disabled unless explicitly approved. Do not merge/deploy before CI and acceptance gates pass.

## Current checkpoint — continue here

**Active milestone:** M2 — Web marketplace acceptance (final gate). Latest PR #11 CI run `41032166812` and Quality Checks run `41032166802` both completed successfully on exact branch head `64586b968cd890ab36b1c1f7d74c7e1812f9d7ec`. This head adds restricted HTTPS CORS allowance for the Apna Ghar Cloudflare Worker production and preview hostnames. The Render-connected API branch `feat/m1-foundation-completion` was inspected and already contains a matching Cloudflare origin allowlist/pattern. Live Cloudflare-to-Render preflight could not be tested from the current execution environment because external DNS resolution failed; do not interpret that tool/network failure as a Render outage or a confirmed CORS failure. CI/build gates are green, but M2 is NOT accepted: authenticated live buyer/owner listing lifecycle, Cloudinary upload, saved-property account sync, profile persistence and two-account chat still lack live acceptance evidence. M3 backend/identity implementation exists in the branch, but milestone sequencing remains M2 until those marketplace acceptance gates are proven.

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

### M3 — Backend domain and identity (IMPLEMENTATION IN PROGRESS)
- [x] Versioned `/api/v1` prefix, global DTO whitelist/transform validation and consistent HTTP exception filter exist.
- [x] Clerk server-side JWT verification is enforced by authenticated API guards; admin access uses a server-side Clerk user-ID allowlist.
- [x] Added authenticated `GET /api/v1/users/me` to fetch canonical Clerk identity and sync name/email into the MongoDB profile without overwriting a user-customized display name.
- [x] Property/category, saved-property, contact/conversation, visit-request and report endpoints exist with owner/participant checks and paginated property search.
- [x] Listing owner display name now validates and persists with the property; listing forms send it and detail pages display it.
- [x] Added unit coverage for Clerk token guard, owner-scoped property updates, inventory filters/pagination, report ownership/duplicate prevention, Clerk identity sync and buyer/seller message authorization/delivery.
- [x] Full API/web/mobile typecheck, API unit tests, API HTTP e2e tests, API build and web build passed on CI validation branch feat/m3-end-to-end-validation at commit ae44459abc994ce46277fedfbc3d6fd4d24c02fa (CI run 40907781495; Quality Checks run 40907781485).
- [ ] Verify profile identity sync against the deployed Clerk secret and live MongoDB; run authenticated buyer/seller conversation flow in the browser.
- [ ] Verify Clerk profile sync and buyer/seller chat with two real signed-in accounts on the deployed environment; current automated tests use mocked identity/database services.
- [x] Added cursor-based message history pagination (`before` + bounded `limit`, default 50/max 100) with participant checks and server-side filtering.
- [x] Inbox previews now select only the latest message rather than returning each full embedded history.
- [x] Messages UI can load older pages and merges them with 5-second live refreshes without moving the cursor forward.
- [ ] Verify pagination with real MongoDB data and browser scrolling; CI for the latest pagination commits is still pending.
- [x] Added a MongoDB-backed per-user message send quota (20 messages per rolling minute) with TTL cleanup and HTTP 429 responses.
- [x] Message appends, unread increments and read resets now use atomic MongoDB updates to avoid stale document-save overwrites.
- [ ] Migrate unbounded embedded message arrays into a dedicated message collection before production sign-off.

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

| 2026-10-30 | Responsive listing UX: marketplace header now switches to a compact mobile top row with a full-width search row, hides desktop-only navigation/account links at narrow widths, retains drawer navigation, and uses a blue shadcn-style `Post` action instead of `Sell property`. Listing wizard now collapses to one column on tablet/mobile, constrains fields/media/previews to viewport width, and adapts step/action controls for narrow screens. Commits: ade49b5bcb981d4046cac6bfd55ee8f5c3f52af4, 907d7a1cfbf8003b0e2c37d79b798514bd283fde. No `components/ui/button` or ShadCN button package exists in this branch, so button styling is implemented with the existing anchor and CSS rather than claiming a library component was imported. Not yet verified: production build, actual 320/360/390/440px rendering, and Cloudflare deployment. | 907d7a1cfbf8003b0e2c37d79b798514bd283fde | Run the Cloudflare build, deploy through the existing Worker pipeline, then retest listing form at mobile widths before continuing M2 acceptance. |


| 2026-10-30 | Shared navigation correction: moved the homepage MarketplaceHeader into the root layout under ClerkProvider and made active navigation route-aware. Removed page-level SiteHeader/MarketplaceHeader instances from the home, listing, search, saved, messages, profile, property-detail, account and information pages to prevent duplicate/legacy headers. Commits: 961796f8ad205102c9e59c8cfc46944c407183b3, 42f532fcbeeac218d0172a361796fad701b6d42f, be35fd7cf8cbe4774123fa70026807dbce6786be, 6eda1f2d3245c3a33d105ad3d2bc5dad9af067ff, 7930d0a3d5cbf58fb430a25fdb9ac3d19c5e5360, 0740eecd7bbc0f6bfa4ea9d1ee856d6472100219, c37e1c71b247aa6ce336452ddc3e3a162a5d40cb, ebb4f70352cc1aa290967c7f75ce21eaeff067f8, d17004efbcd20e3d1921802a8a3d2e21e1f48f24, 37fe0a012ef9101cc7f1c548159de6baf2fe8642, 828a090606dcf83ebff92c54efffa228fa5ecbc5, e7d59c94415dc9c2a0487ba98756c9c527771747, 11b0475e1a1cd30c64bf0cdf7a8d4138eb8bbf48, 0da06f5a72ff6b48e4769815fc015399f9b9f0f1, 6cd3f1be77349c5ca64eb4bbd145805ab6315ea5. Not yet verified: CI/build and rendered desktop/mobile header. Live Worker is not updated by these branch commits; PR #11 remains unmerged against deploy/cloudflare-preview. | 6cd3f1be77349c5ca64eb4bbd145805ab6315ea5 | Run CI/build, inspect PR diff, then deploy only through approved merge/release path and verify navbar on desktop and mobile. |


| 2026-10-30 | M2 listing-form fix: added authenticated Cloudinary video upload endpoint (MP4/WebM/MOV, 100 MB cap), persisted video URLs on property documents, and extended the owner form to accept multiple photos plus one video with removable previews. Added a live listing-card preview in the right sidebar, state/UT and curated city selectors, editable locality suggestions, and listing-route header spacing rules. Commits: bf6b8fc78e6b9c9b3ea99e9351df351f97218333, c4bd21d236bafd0c7fbcdc713eebfdacd1bb8632, a423db14cf0247741aff23ff090bc2b8910013eb, d56ad740148772e953853442da08ca12d14d4fad, 5cdd40a48e5c199d53c025d04afb6d3d021b65be, 54482c610a1f7e76d5c048e03170bae15810c251, b9ea919e3f6c034c4591feceb23706893da4a025, 9bb823379129c3cb6086105f5522a11d1a2533a6. Not yet verified: CI/build, live image/video upload, Cloudinary video plan/limits, and real browser display. City options are curated rather than a complete nationwide locality database; exact locality remains editable. | 9bb823379129c3cb6086105f5522a11d1a2533a6 | Run CI/typecheck/build; fix any failures; then retest the listing form on the deployed Worker with real image/video uploads and confirm persisted media on the property detail page. |


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


| 2026-10-29 | Replaced homepage with Next.js `MarketplaceHome` based on the uploaded Stitch direct-owner marketplace reference. Added responsive horizontal brand/header, mobile search row and working hamburger drawer, category/filter rails, location/sort bar, seller CTA, property preview grid, trust strip and responsive footer. Example cards are explicitly marked as design previews so they are not misrepresented as live listings. Cloudflare build `1c3983ea-da15-4137-8df4-69f8d9af8c9e` succeeded; deployed to `https://apna-ghar-web.yash38688.workers.dev`. Browser-rendering scrape checks passed at 320×740, 390×844 and 1440×900: header controls and listing cards remain within viewport width, new markup is served, and old homepage header is absent from `/`. | Homepage redesign committed on `deploy/cloudflare-preview` | M2 remains active; continue functional and authenticated acceptance checks before M3. |

| 2026-10-29 | Restored the original blue/green BrandLogo on the Stitch marketplace, wired homepage listings and category rails to the live API, added responsive inspiration carousel and owner Call/Chat actions, made all five theme tokens apply across the new page and exposed theme selection inside the mobile drawer. Added authenticated /messages inbox UI with stored messages and 4–5 second refresh using the existing participant-protected conversation API. Restyled property posting and owner listing dashboard for mobile/tablet/desktop. Added Mongo-backed seeded category endpoint and conversation domain to Render branch; persisted/validated listing contact phone. Live GET /api/v1/categories returned the six seeded categories. API CI and Quality Checks passed on feat/m1-foundation-completion commit 14a4f107c3f6244cfbf4c61342a01246fe24914c. Cloudflare build `23c0dbc7-eafe-42fb-ae9b-68c67ca87f9d` succeeded on commit `24f4098e269f919d63d53014bc133b67cff96381`. Browser-rendered homepage smoke checks passed at 390px mobile and 1440px desktop: horizontal legacy logo, mobile drawer/search, dynamic category rail, zero-live-listings empty state and image carousel rendered without viewport overflow. Live GET /api/v1/categories returns six categories; GET /api/v1/conversations returns 401 Authentication is not configured, confirming Render's CLERK_SECRET_KEY is still missing/misconfigured. Authenticated buyer/seller chat acceptance remains blocked until Render auth config is corrected. | M2 visual and dynamic work advanced; M3 backend identity/domain integration in progress | Do not mark M3 complete until the final web build succeeds and authenticated buyer/seller chat is acceptance-tested. |

| 2026-10-29 | Restored the original blue/green roof mark and horizontal Apna Ghar wordmark; bridged the homepage UI to the existing five theme tokens (Light, Midnight, Graphite, Forest, AMOLED); added direct `tel:` call-owner and authenticated chat-owner actions to live property cards; initialized category/retry state for live API search. Cloudflare build for commit `24f4098e` completed successfully. | UI code committed and build passed | Browser Rendering smoke test was rate-limited, so visual re-verification after this exact build is still pending. Authenticated buyer/seller chat must be validated against real sessions before declaring M3 complete. |

| 2026-10-29 | Follow-up mobile verification: updated commit `b63797ca` prevents wordmark wrapping with `white-space: nowrap` and intrinsic width; Cloudflare build `4d993129-cbcd-43e0-90d2-f333f46870d4` succeeded and deployed Worker version `c1a99412-85bf-49de-9ee9-9130aca1d542`. Browser Rendering at 390×844 confirmed the header brand renders `Apna Ghar` on one line (111px brand width) and the hamburger remains in-bounds at x=339, width=39. | Logo wrap issue fixed in deployed preview | No published listing cards were returned in the smoke session, so call/chat card buttons were not present in that run; they render conditionally with real listing data. Authenticated buyer/seller chat still needs session-based acceptance. |

| 2026-10-29 | Post-deploy smoke: Browser Rendering confirms the 320px homepage brand remains one line (`Apna Ghar`, width 104px), hamburger stays within viewport (x=269..308), mobile search/category rails fit the 320px viewport, and `/messages` reaches the signed-out conversation gate after hydration with its mobile header in-bounds. | Worker version `c1a99412-85bf-49de-9ee9-9130aca1d542` live on workers.dev | No published listings exist in the sampled result set, so live listing contact actions and authenticated buyer/seller chat exchange cannot be exercised anonymously. |

| 2026-10-29 | Redesigned the existing Next.js buyer/seller inbox (not a static HTML embed): it now fetches the selected property's real contact phone and shows a `Call owner` action when provided, plus dynamic quick-message chips for availability, visits and price negotiation. Applied a global wordmark no-wrap rule to every page using `BrandLogo`. Cloudflare build `a1833169-fa94-4f79-8167-b72647298372` succeeded, Worker version `e014d2d2-ff6b-4208-a642-b8910613d8f1` deployed; mobile scrape at 390×844 confirms horizontal `Apna Ghar` wordmark and in-bounds hamburger. | Live Cloudflare preview updated | Signed-out `/messages` gate is verified; chat exchange remains blocked by Render's missing `CLERK_SECRET_KEY` until the service environment is configured. |


| 2026-10-29 | Restored the original horizontal blue-roof/green-sweep Apna Ghar logo lockup and replaced the newer generic cobalt/mint values with the legacy Apna Ghar blue `#064CC0` and green `#20E890` across all five themes (Light, Midnight, Graphite, Forest, AMOLED Black); System default remains supported. Polished the responsive listing wizard and chat layout. Added Clerk identity synchronization at `GET /api/v1/users/me`, preserving user-edited display names while synchronizing the canonical Clerk email. Added owner-name persistence to the property schema/DTO and listing flow. Added API unit tests for Clerk guard, property owner-scope/filtering, report ownership/deduplication and conversation message delivery/authorization. | `1144b6e`, `a968253`, `dea3526`, `e9fe653`, `d107396`, `50e6a76`, `7cb6a4b`, `7a071cf`, `80fcb53`, `34ed758`, `98d6aff`, `d7ce3ac`, `d132cde`, `6d576e6`, `6a4d58d`, `6c06e39` | Wait for the latest Cloudflare build; run API/web/mobile typecheck and all API tests on a CI-triggering branch/PR; browser-test the five themes, property post flow and two-account buyer/seller chat before M3 sign-off. M2 authenticated listing acceptance remains pending. |


| 2026-10-29 | Restored legacy brand palette across the five named themes and kept System default, restored the horizontal blue/green Apna Ghar logo, and polished responsive listing wizard/chat UI. Added a verified Clerk identity sync endpoint, listing owner-name persistence, inbox preview polling and API tests. Added HTTP integration tests for profile identity sync, authenticated profile updates, invalid DTO/email rejection and unauthenticated access. CI and Quality Checks both passed at ae44459abc994ce46277fedfbc3d6fd4d24c02fa: API/web/mobile typecheck, 24 API unit tests, API HTTP e2e tests, API build and Next.js build all succeeded. Cloudflare build 8e06c06a-b227-4456-9c8d-6cd861320f2f deployed Worker version 7f0c647d-5d65-4c7c-8684-3ba3f39d7dcd. Browser Rendering checks at 320×740, 390×844 and 1440×900 show the old logo remains horizontal, hamburger/search/seller CTA fit inside the viewport, listing empty state is driven by live API inventory, and /messages renders the signed-out state without a Clerk-provider crash. The API currently returns zero published listings, so live listing call/chat actions cannot be exercised from home; authenticated two-account chat/profile acceptance remains outstanding. | 1144b6e, a968253, e9fe653, d107396, 7cb6a4b, 80fcb53, 34ed758, 98d6aff, d7ce3ac, d132cde, 6d576e6, 3f05481, e7db2a0, 371e4fc, CI ae44459, Cloudflare version 7f0c647d | M3 implementation and CI gates pass. Keep M2 authenticated owner lifecycle and live two-account chat smoke tests open until a real signed-in session and at least one published listing are available. |

| 2026-10-29 | Final palette sweep removed remaining hard-coded cobalt/mint accents from shared CSS (commits 06d1f6c, 43a3b82, b93e939). Ported the new contactName field to the actual Render-connected API branch feat/m1-foundation-completion (schema commit eb77d9e, DTO commit fc38b77) so the live API accepts and persists the owner name sent by the redesigned listing form. Render-branch Quality Checks passed at fc38b778; CI passed typecheck, API unit/e2e suites, API build and web build. Live Render API health and public property search both return HTTP 200; current inventory reports total=0. | CSS: 06d1f6c, 43a3b82, b93e939; Render API: eb77d9e, fc38b77; CI: fc38b778 | Wait for latest Cloudflare build e26ee1b7 to finish, then smoke-test the final theme palette; keep authenticated owner lifecycle and two-account chat acceptance pending because no published listings or authenticated browser session are available. |

| 2026-10-29 | Final shared CSS palette cleanup deployed successfully to Cloudflare build e26ee1b7-6e87-413c-b2bd-296c62aede49, Worker version ddba3e10-8a65-4f6e-98dd-435f81f7cc9a. Latest color changes were CSS-only; prior DOM/layout smoke tests at 320×740, 390×844 and 1440×900 confirmed the horizontal original logo, mobile hamburger/search, seller CTA and responsive layout. A second scrape immediately after final deploy was rate-limited by Browser Rendering, so no new final-screenshot claim is made. Render-connected API branch CI at fc38b778 passed. | Cloudflare build e26ee1b7, version ddba3e10; Render CI fc38b778 | M3 implementation and CI gates are green; live authenticated buyer/seller acceptance is still pending because public inventory is empty and no signed-in browser session is available. |


| 2026-10-30 | Follow-through branch created from `deploy/cloudflare-preview` to avoid merging diverged M3 branches directly. Preserved the existing blue/green Apna Ghar mark and made SVG gradient IDs instance-safe; finished profile avatar display using the Clerk image, added a stable profile-details anchor and tightened 320–700px/tablet profile layout behavior while retaining theme tokens. Added per-participant unread message counts to conversation persistence, an authenticated `PATCH /api/v1/conversations/:conversationId/read` endpoint, unread count serialization for inbox JSON, and UI badges/read-state clearing. Added controller tests for unread increment and participant-only read reset. Code and tests committed on `feat/profile-theme-chat-finish`; CI has not yet run for this branch. Live Clerk/Render two-account verification remains blocked until the API Clerk secret is confirmed and a published test listing is available. Message pagination, rate limiting and concurrency-safe message writes remain open before production sign-off. | Branch head `62bfbc72314240873d7ca723f68ede65597bea46` (CI pending) | Run PR CI; fix any test/type/build failures; then validate profile persistence and two-account buyer/seller unread/read flow against the deployed API. |


| 2026-10-30 | Continued PR #13 after both workflows passed on the unread/read implementation. Added bounded cursor pagination to `GET /api/v1/conversations/:id/messages` (default 50, maximum 100), participant authorization, ISO cursor/page-size validation and aggregation-side message filtering. Inbox listing now projects only the most recent message for each conversation. Messages UI adds a Load older messages control and merges paginated history with periodic live refreshes while preserving the oldest loaded cursor. Added unit coverage for participant access, page bounds, cursor validation and hasMore/nextBefore behavior; CI has not yet been verified for these newest commits. | Latest code commit `a41238a1fc1bc25a729e730a39548c1a8aeebc6e`; prior green checks at `2406656435f3579b3d3463385120c0d3a1737e41` | Verify fresh CI for the pagination changes, then exercise cursor paging against MongoDB and the browser; implement a shared production-safe rate limiter and concurrency-safe message persistence before launch. |


| 2026-10-30 | Added a MongoDB-backed shared per-user send quota (20 messages/minute) with atomic counter updates, one-minute windows, TTL cleanup and HTTP 429 responses; applied the same quota to first-message property enquiries and subsequent replies. Added controller coverage for quota exhaustion. Corrected the MongoDB aggregation variable used by message cursor filtering. CI was green for the pagination implementation before the rate-limit additions; the latest rate-limit follow-up still requires fresh CI. | Rate-limit schema/controller/tests commits: `fa7704e`, `8d2cf68`, `50bd6dd`, `3b75505`, `8fc708c`, `11ca708` | Run both workflows on the latest head; if green, test 20/minute enforcement, TTL behavior and pagination against live MongoDB. Before production, migrate embedded message arrays to a dedicated collection and use atomic message/unread writes. |


| 2026-10-30 | Completed the follow-up rate-limit wiring across first-contact enquiries and replies; added explicit coverage that a first enquiry increments the owner's unread count and consumes the sender's shared quota. Strengthened the pagination test to assert the MongoDB aggregation uses the correct scoped `$$message.sentAt` cursor expression. The newest test/code commits are pushed to PR #13. Fresh CI for this final head has not yet been observed; do not merge until both workflows pass. | Latest test commit `3b922adc1a26d2f5de2ba1d1e4303f0c5a386ebb` | Confirm CI and run authenticated MongoDB-backed browser checks; then migrate embedded message arrays to a dedicated collection and make message/unread updates atomic before production. |


| 2026-10-30 | Replaced read-receipt and send-message document saves with atomic MongoDB updates. Message append + recipient unread increment now happen in one update; read reset touches only the signed-in participant's unread key. Initial enquiry messages use the same atomic write path and quota. Added assertions for atomic message/unread update payloads and first-enquiry persistence. This closes the stale full-document save race for those operations, but embedded array storage remains unbounded and still requires a dedicated message collection migration. Latest CI remains pending for this newest head. | Atomic update commits `34aa79a`, `1c3994b`, `96dd3b8`, `448daca` | Confirm both GitHub workflows pass, then test the MongoDB-backed rate limiter, cursor pagination, unread badges and two-account chat against the deployed API. |


| 2026-10-30 | Latest CI exposed an unsupported NestJS 10 exception import in the new rate limiter. Replaced it with `HttpException(..., HttpStatus.TOO_MANY_REQUESTS)` and updated the test to assert status 429. The previous CI failure was a real compile failure, not a flaky check; rerun both workflows on the new head before merging. | Fix commits `65438af8`, `37fc65af` | Confirm fresh API typecheck/build/unit/e2e and Next.js build; only then continue live MongoDB/Clerk verification. |


| 2026-10-30 | Locked execution governance and fixed the failing pagination unit-test assertion: the controller filters with MongoDB variable `$$message.sentAt`, and the test now asserts the same expression. Latest CI run `41028988316` passed: API/web/mobile typecheck, API unit suite, API HTTP e2e suite, API build, web build. Latest Quality Checks run `41028988364` passed: API build and Next.js web/admin build. Governance documentation committed at `da1b4c68cb12f1135bb30ea62626e5eb39a9adc4`; code fix committed at `7a92da4bbbf5386f0a6e797b43004d8041d5901c`. | `7a92da4`, `da1b4c6` | CI recovery gate is complete. Next: close M2 end-to-end authenticated listing lifecycle acceptance; do not claim M2 complete until a real signed-in owner can publish/edit/hide/delete and buyer search/save flows are verified against live API data. |

| 2026-10-30 | M2 acceptance started after approval. Added API service regression coverage for combined public marketplace keyword/category/transaction/price/bedroom/bathroom/furnishing filters, ascending/descending price sort, and regex metacharacter escaping. This is automated service-level coverage only; it does not prove browser or live MongoDB acceptance. Quality Checks run `41030015741` is running on this exact commit; no pass claim until completion. | Code/test commit `a705d1430bc012302acd69b41ea6b84f3eff0a6f` | Await CI result; then address any failures and continue authenticated live acceptance for search, saved properties, profile and full owner listing lifecycle. Live credentials, test accounts and a published test listing remain unverified prerequisites. |


| 2026-10-30 | Continued M2 end-to-end audit. Both CI and Quality Checks passed on checklist head `f152ebce02d99a821378fd01fec9d8da5e86ddf5` (CI runs `41030066407` and `41030057693`; Quality Checks runs `41030066675` and `41030057813`). Found and fixed a production-critical API base URL fallback: ten web marketplace/account/admin components previously defaulted to localhost outside local development; they now fall back to the deployed Render API URL while still honoring `NEXT_PUBLIC_API_BASE_URL`. Individual file commits: `ed666b4`, `566f566`, `ffde13a`, `2fb72cc`, `1abcd68`, `a2b4035`, `6e68263`, `00985d8`, `5b60ce6`, `c8f15aa`. These are implementation commits; CI for the resulting latest head is pending. Authenticated owner/buyer browser acceptance remains unverified; public inventory and live Clerk/Cloudinary configuration must be checked before any acceptance claim. | API fallback fixes: `c8f15aa244b58bdebdaf18a32e61ff928fc3b9b6` (latest code commit at time of update); prior green CI/Quality run IDs above | Run both workflows on the resulting head, inspect live API health/search and configured auth/media prerequisites, fix remaining M2 issues, then perform signed-in two-account acceptance. Do not close M2 until the live marketplace journey is verified. |


| 2026-10-30 | Verified final PR #11 CI run `41031045132` completed with conclusion `success` on exact branch head `bf3390d283983fcd22141240893702ee02a361a1` (`feat/m3-backend-identity`). Quality Checks run `41031044941` also passed on the same head. CI and build gates are green; this does not substitute for live authenticated marketplace acceptance. M2 remains open pending real Clerk buyer/owner sessions, MongoDB-backed test listing lifecycle, Cloudinary photo upload, saved-property sync, profile persistence and two-account chat. | Verified head `bf3390d283983fcd22141240893702ee02a361a1` | Complete and evidence the authenticated live M2 acceptance journey; then record M2 sign-off and proceed to M3. |


| 2026-10-30 | Added restricted HTTPS CORS allowance for `apna-ghar-web.yash38688.workers.dev` and this project's versioned Worker preview hostnames on PR #11. CI run `41032166812` and Quality Checks run `41032166802` both passed on exact commit `64586b968cd890ab36b1c1f7d74c7e1812f9d7ec`. Inspected Render-connected API branch `feat/m1-foundation-completion`: it already contains an explicit Cloudflare production origin and constrained Worker preview hostname pattern. User confirmed the exact Cloudflare origin was added to Render CORS configuration. A live browser OPTIONS/GET test is still unverified: external DNS resolution failed from the direct runner and Cloudflare Browser Rendering subsequently returned HTTP 429, so neither result is treated as an application failure or a passing CORS test. | `64586b968cd890ab36b1c1f7d74c7e1812f9d7ec`; CI `41032166812`; Quality `41032166802` | Verify deployed Render API responds with `Access-Control-Allow-Origin: https://apna-ghar-web.yash38688.workers.dev` to OPTIONS and GET from the Cloudflare site, then continue M2 authenticated buyer/owner acceptance. |
