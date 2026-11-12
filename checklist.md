# Apna Ghar — End-to-End Acceptance Checklist

This checklist tracks verified repository automation separately from manual environment and browser acceptance. Do not mark a manual item complete from a successful build alone.

## Repository and CI baseline

- [x] Latest inspected `main` commit: `af61807` (`docs: add end-to-end acceptance checklist`).
- [x] CI workflow passed on `main`: typecheck API/web/mobile, API unit tests, API HTTP e2e tests, API build, web build, and Cloudflare production artifact build.
- [x] Quality Checks workflow passed on `main`: API build and Next.js web/admin build.
- [x] Cloudflare production deployment verified for web worker.
- [x] M2 Web Experience implementation & local verification:
  - [x] Restored desktop sticky navbar (`SiteHeader` / `MarketplaceHeader`) across all interior routes (`/search`, `/saved`, `/my-listings`, `/list-property`, `/about`, `/terms`, `/contact`, `/services`, `/appearance`).
  - [x] Synchronized category schema and keys between homepage (`MarketplaceHome.tsx`), search form (`search/page.tsx`), and search results (`PropertySearchResults.tsx`) for `apartment`, `house`, `plot`, `commercial`, `pg`, `villa`.
  - [x] Added pagination auto-reset on search filter updates in `PropertySearchResults.tsx`.
  - [x] Added dedicated legal & support route handlers in `[slug]/page.tsx` for `/terms` and `/contact`.
  - [x] Implemented rich dynamic metadata, canonical links, and OpenGraph/Twitter cards for property detail pages (`property/[id]/page.tsx`).
  - [x] Implemented data-driven city and category landing routes in `[slug]/page.tsx` for Mumbai, Bengaluru, Delhi, Hyderabad, Pune, Amritsar, and all categories.
  - [x] Added Next.js same-origin conversation proxy handler `POST /api/v1/conversations/property/[propertyId]` to eliminate CORS failures during buyer-seller conversation creation.
  - [x] Hardened media URL parser in `list-property/page.tsx` to handle any valid HTTPS image/video references alongside Cloudinary uploads.
  - [x] Verified full monorepo typecheck (`npm run typecheck`: API, web, mobile passed with 0 errors).
  - [x] Verified unit and contract test suites (`npm test`: 9 passed, 53 passed).
  - [x] Verified API e2e health and domain test suites (`npm run test:e2e:api`: 3 passed, 12 passed).
  - [x] Verified production build (`npm run build:web`: 21/21 routes compiled and optimized).
  - [x] Verified local server HTTP 200 and navbar presence across all 12 core marketplace routes.
- [x] M3 Backend Domain & Identity implementation & local verification:
  - [x] Clerk server-side token verification with `@clerk/backend` in `ClerkAuthGuard` and `PropertyAuthGuard`, deriving identity from verified subject `claims.sub`.
  - [x] User profile domain synchronization in `UsersService` & `UsersController` with fields: `id`, `name`, `email`, `phone`, `city`, `about`, `imageUrl`, `role`, `accountStatus`, `lastActiveAt`, and timestamps.
  - [x] Backend role system with `UserRole` enum (`USER`, `OWNER`, `ADMIN`), `@Roles` decorator, and `RolesGuard`. Role tampering prevented through DTO whitelisting.
  - [x] Automatic elevation from `USER` to `OWNER` on successful property creation in `PropertiesService.create()`.
  - [x] Strict property ownership integrity: update, hide/restore, delete (soft-delete) strictly scoped to `ownerId: request.authUserId`. Added `GET /api/v1/properties/mine/:slugOrId`.
  - [x] Saved properties isolation with compound unique index `{ userId, propertyId }`. Implemented guest favorites migration endpoint `POST /api/v1/saved-properties/sync`.
  - [x] Conversation and messaging domain authorization: buyer != owner validation, participant isolation, rate limiting, and added `GET /api/v1/conversations/:conversationId`.
  - [x] Visit requests validation: prevented owners from requesting visits on their own listings; added received visits endpoint `GET /api/v1/visit-requests/received`.
  - [x] Database integrity: added non-speculative compound indexes to Mongoose schemas for `user_profiles`, `properties`, `saved_properties`, `conversations`, and `property_offers`.
  - [x] Automated test suite: 12/12 unit test suites passed (71/71 tests), 3/3 API e2e test suites passed (12/12 tests).
  - [x] Full monorepo typecheck passed (API, web, mobile with 0 errors).
  - [x] Web production build passed (21/21 routes compiled and optimized).
- [x] M4 Dedicated Admin & Moderation implementation & local verification:
  - [x] Server-side admin authorization: Enforced `AdminAuthGuard` (supporting allowlist & MongoDB `UserRole.ADMIN`) and `RolesGuard` on all privileged routes. Ordinary users/owners rejected with 401/403.
  - [x] Real Admin Dashboard Overview: Live MongoDB aggregations for total users (active/suspended), total properties, active listings, hidden listings, removed/moderated listings, pending reports, recent registrations, recent property activity, and audit logs.
  - [x] User Management (`/admin/users`): Paginated user listing with search, role and status filters, view details & user listings, suspend and reactivate accounts with mandatory reasons; self-suspension guard prevents admins from suspending themselves.
  - [x] Account Suspension Enforcement: `PropertyAuthGuard` blocks all mutations (create, edit, delete, media upload) with 403 Forbidden if user accountStatus is `suspended`.
  - [x] Property Moderation (`/admin/listings`): Paginated property listing with search, status filters, property inspection modal, and hide/restore/remove actions with mandatory reasons. Valid listings continue to publish immediately (no mandatory approval queue).
  - [x] Safety Reports Management (`/admin/reports`): Paginated reports triage, status filter, resolution notes modal, dismiss/resolve actions, and linked property moderation.
  - [x] Moderation Audit Logs (`/admin/audit-logs`): Dedicated MongoDB collection `audit_logs` tracking `adminUserId`, `action`, `targetType`, `targetId`, `reason`, `details`, and timestamp, with compound indexes.
  - [x] Category Administration (`/admin/categories`): List all categories, active/inactive toggle buttons without breaking existing listings, edit dialog (label, icon, sortOrder).
  - [x] Responsive Frontend: Dedicated admin UI pages (`/admin`, `/admin/users`, `/admin/listings`, `/admin/reports`, `/admin/categories`, `/admin/audit-logs`, `/admin/plans`, `/admin/settings`) styled with Apna Ghar blue-green identity, shared `AdminNav`, and 5-theme support.
  - [x] Next.js Proxy: Created `apps/web/src/app/api/v1/admin/[...path]/route.ts` forwarding authenticated admin requests with Bearer tokens to the upstream API.
  - [x] Verified full monorepo typecheck (`npm run typecheck`: API, web, mobile passed with 0 errors).
  - [x] Verified automated unit tests (`npm test`: 14/14 test suites, 81/81 tests passed).
  - [x] Verified API e2e tests (`npm run test:e2e:api`: 3/3 test suites, 12/12 tests passed).
  - [x] Verified production builds: `npm run build:api` (NestJS clean build) and `npm run build:web` (25/25 Next.js static/dynamic routes compiled cleanly).

## Environment readiness

- [x] Cloudflare web URL loads the latest version (`8e124d8`).
- [x] Render/NestJS API health endpoint responds successfully (`/health` returns 200).
- [x] API can connect to MongoDB Atlas (`/health/ready` reports database connected).
- [ ] Cloudinary upload credentials and upload path work.
- [x] Clerk Development Instance keys are configured consistently in web and API.
- [x] Clerk development mode is used for test accounts only; it is not treated as production authentication for a public launch.
- [x] Payments remain disabled for the free launch.
- [x] Authentication-aware global navbar verified:
  - [x] Logged-out state: displays Sign In and Sign Up; hides Post Property, user menu, and Sign Out.
  - [x] Logged-in state: displays Post Property and user profile/avatar menu with account links and Sign Out; hides Sign In and Sign Up.
  - [x] Auth loading state: renders layout-stable placeholder skeleton without shifts.
  - [x] Dynamic session transitions: Sign In, Sign Out, and protected route redirection (`/list-property`) verified live in Chrome.

## Milestone M4 Live Browser Acceptance

- [x] Tested all 8 admin routes live in Google Chrome (`/admin`, `/admin/users`, `/admin/listings`, `/admin/reports`, `/admin/categories`, `/admin/audit-logs`, `/admin/plans`, `/admin/settings`).
- [x] Verified 5 theme presets (Light, Midnight, Graphite, Forest, AMOLED Black) dynamically toggle without layout shift.
- [x] Verified responsive layouts across Desktop (1440x900), Tablet (768x1024), and Mobile (390x844).
- [x] Verified authentication edge boundary (unauthenticated requests 307 redirect to `/sign-in?redirect_url=...`).
- [x] Verified admin allowlist and server-side `AdminAuthGuard`.
- [x] Resolved Next.js 15+ async params defect on `/admin/[section]` in commit `e1ecdd2`.
- [x] Detailed report generated at `docs/testing/M4-LIVE-ADMIN-ACCEPTANCE.md`.

## Manual two-account acceptance — Clerk Development Instance

Create two separate test users: **Owner** and **Buyer**. Run these tests in a clean browser session or separate browser profiles.

### Authentication and account isolation

- [ ] Owner can sign up/sign in.
- [ ] Buyer can sign up/sign in independently.
- [ ] Signed-out users cannot access protected account actions.
- [ ] Owner cannot read or modify another user's private account data.
- [ ] Buyer cannot read or modify another user's private account data.

### Property publishing and discovery

- [ ] Owner can open the Post Property flow.
- [ ] Owner can enter required property details and location.
- [ ] Owner can upload property photos (and video if enabled).
- [ ] Owner can save/publish a listing.
- [ ] Published listing appears in public search/listing results.
- [ ] Property detail page displays correct photos, price, description, and location.
- [ ] Owner can see the listing under My Properties.
- [ ] Owner can edit, change visibility, and delete their own listing.
- [ ] Buyer cannot edit, hide, or delete the Owner's listing.

### Buyer-owner conversations

- [ ] Buyer can start a conversation from the Owner's property.
- [ ] Owner can see the conversation.
- [ ] Buyer and Owner can exchange messages.
- [ ] Messages persist after refresh and re-login.
- [ ] A third/non-participant account cannot read the conversation.
- [ ] Unread/read state behaves correctly, if exposed in the UI.

### Offers and enquiry workflow

- [ ] Buyer can submit an offer, if the offer UI is enabled.
- [ ] Owner can view the offer.
- [ ] Owner can respond to the offer, if response actions are enabled.
- [ ] Offer data is not visible to unrelated users.

## Final acceptance and release gates

- [ ] Complete the manual flows above and record any failing route, request, and console/API error.
- [ ] Verify desktop, tablet, and mobile layouts in a real browser.
- [ ] Verify no broken images, dead buttons, placeholder content, or stale navigation.
- [ ] Verify privacy, terms, contact/help, and property moderation/reporting requirements before public launch.
- [ ] Re-run CI after any code changes and confirm the deployed commit matches `main`.
- [ ] Do not call M2/M3 production-ready until the relevant manual acceptance items pass.

## Scope decisions

- Budget target: ₹0 additional paid services for this test phase.
- Authentication: Clerk Development Instance for testing only.
- Payments: disabled for initial free launch.
- Mobile native app: deferred until web/API acceptance is complete.
- Work on `main`; do not revive stale milestone branches without a specific reason.
