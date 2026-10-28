# Apna Ghar — Phase-wise Delivery Plan & Milestone Tracker

**Status:** Execution plan  
**Applies to:** Web/SEO, React Native mobile, NestJS API, MongoDB, dedicated admin  
**Source of truth:** `docs/01-product-requirements.md`, `docs/08-milestones.md`, `docs/10-figma-brief.md`, `docs/13-design-handoff.md`, `docs/17-web-design-implementation-status.md`, and the approved Figma source.

> This plan breaks the approved PRD into implementation phases. It is not permission to invent product behavior or replace the approved Figma. A phase is complete only when its acceptance criteria, tests, and design review pass.

## 1. Non-negotiable product rules

- Build the product described by the PRD; do not treat the current scaffold or placeholder screens as finished functionality.
- Inspect the approved Figma frames, components, variants, variables, prototypes, and responsive rules before implementing a screen. The Figma file is the visual source of truth; Stitch prototypes are secondary references.
- Preserve the approved brand tokens: blue `#2563EB`, green `#10B981`, navy `#0F172A`, light canvas `#F3F4F6`, and white surfaces.
- Implement all five themes—Light, Midnight, Graphite, Forest, AMOLED Black—plus System default across web, admin, and mobile. Property photography must not be tinted.
- Do not invent or substitute the approved Apna Ghar logo. The individual approved assets must be supplied/located before removing the explicit placeholder.
- Valid listings publish immediately after server validation. There is no default pending-approval queue. Admins can hide, restore, or remove abusive/violating listings with a reason and audit trail.
- Launch users are Free. Plans, features, and entitlements must be configurable and evaluated server-side; payment processing, paid boosts, checkout, escrow, EMI, and builder billing are out of launch scope.
- Admin authorization must be enforced by server-side route and API guards. Hiding links or screens is not security.
- Do not present sample property cards or placeholder dashboard metrics as live data.
- Do not mark a screen “Figma complete” until desktop/tablet/mobile behavior and relevant theme states have been compared with the source.

## 2. Phase overview

| Phase | Milestone | Primary outcome | Exit gate |
|---|---|---|---|
| P0 | Source and scope lock | PRD, Figma and route inventory reconciled | Every supplied frame and user journey has an implementation destination |
| P1 | Foundation and CI | Reliable monorepo, env validation, build/test gates | Clean install, web/API builds and tests pass |
| P2 | Design system | Shared tokens, five themes, responsive primitives | Theme showcase and design comparison approved |
| P3 | Identity and profiles | Clerk auth, user sync, profile and roles | Auth and permission tests pass |
| P4 | Listings and media | Real property CRUD, uploads and owner lifecycle | Valid listing publishes immediately and persists |
| P5 | Discovery and engagement | Search, filters, detail, favorites, contact, report | End-to-end discovery/contact journey passes |
| P6 | SEO public web | Crawlable, shareable property/category pages | Metadata, canonical URLs, sitemap and rendered HTML verified |
| P7 | Admin operations | Protected dashboard and operational modules | Non-admin requests denied; admin actions audited |
| P8 | Plans and entitlements | Free launch with dynamic plan/feature controls | Server enforces configured entitlements; no checkout enabled |
| P9 | Native mobile | React Native Community CLI application | Core journeys and five themes work on supported devices |
| P10 | Quality, safety and launch | QA, accessibility, privacy/legal, operations | Release checklist signed off |
| P11 | Ads and growth | AdMob and eligible web ad readiness | Test ads/policy review complete; no harmful UX regressions |

## 3. Detailed milestones

### P0 — PRD and Figma source audit

**Tasks**
- [ ] Locate and inspect the original editable Figma file and its PDF export. Keep originals unchanged.
- [ ] If the files are only in ChatGPT Library, retrieve/materialize them through the supported file workflow; do not pretend the repo contains them.
- [ ] Inventory every Figma page/frame, component, variant, variable, prototype link, responsive breakpoint, and theme state.
- [ ] Map each frame to one of: public web route, admin route, mobile screen, shared component, or documented design gap.
- [ ] Record states for loading, empty, error, success, validation, disabled, permission denied, and offline where applicable.
- [ ] Reconcile this map against PRD and existing route inventory; flag conflicts for product-owner decision rather than silently changing scope.
- [ ] Create a frame-to-route checklist with design review status.

**Deliverables**
- Figma frame inventory and route map.
- List of missing assets and unresolved design questions.
- Updated acceptance checklist for each journey.

**Exit criteria**
- No supplied frame or major user journey is unaccounted for.
- Logo and asset gaps are documented.
- No broad UI implementation is declared Figma-aligned before this audit.

### P1 — Monorepo foundation, configuration and CI

**Tasks**
- [x] Verify npm workspace structure, per-app TypeScript configurations, and root/app scripts. Shared lint/format tooling remains a follow-up quality improvement.
- [ ] Validate environment variables at startup; maintain safe `.env.example` files and never commit secrets.
- [ ] Keep NestJS API, Next.js web/admin, and React Native Community CLI as separate app targets.
- [x] Add/verify API health and dependency readiness behavior without claiming database readiness from liveness alone.
- [x] Add API unit tests, web build checks, type checks and API HTTP e2e test wiring to CI.
- [x] **Separate gate before M2:** latest CI and Quality Checks were verified green on the M1 foundation commit before starting M2.
- [ ] Document reproducible local setup and Android Studio/JDK/SDK requirements.
- [x] Keep the mobile workspace parked during web-first phases. Generate the native Community CLI project in P9, after web, admin, backend, SEO, security, entitlements and data/media integration gates are accepted.

**Exit criteria**
- Fresh dependency install succeeds.
- API build and tests pass.
- Web production build passes.
- CI is green on the exact commit being reviewed.
- Environment setup and failures are documented truthfully.

### P2 — Design system and theme implementation

**Tasks**
- [ ] Extract and verify typography, spacing, radius, elevation, breakpoints, and remaining semantic tokens against the approved Figma source. (Base light-theme brand colors were aligned to the documented palette.)
- [ ] Build shared web/admin primitives with accessible focus, disabled, validation, skeleton, toast, dialog, dropdown, filter, table, and empty/error states.
- [x] Keep the existing Light, Midnight, Graphite, Forest, and AMOLED Black palettes and System default picker; align visible theme labels to the documented names. Full cross-route visual review remains open.
- [x] Preserve the existing local-device theme preference persistence and immediate theme switching. Verify cross-route behavior and first-paint flash during QA.
- [x] Add `/appearance` settings and a dedicated showcase displaying the same representative property UI in all five themes. Visual review and responsive QA remain open.
- [ ] Map tokens to native-compatible equivalents; do not reuse web DOM components in React Native.
- [ ] Compare representative screens at mobile, tablet, and desktop sizes against Figma screenshots.

**Exit criteria**
- All five themes are distinct and complete, with System default functioning.
- Content hierarchy and photography remain unchanged across themes.
- Keyboard focus and contrast are reviewed.
- Design review records pass/fail per screen.

### P3 — Authentication, user sync and authorization

**Tasks**
- [ ] Confirm Clerk sign-in methods with the product owner; do not assume OTP is enabled.
- [ ] Configure sign-in, sign-up, email verification, Google OAuth if approved, password recovery, session state, sign-out and failure states.
- [ ] Verify Clerk tokens in NestJS; never trust client-supplied user IDs or role names.
- [ ] Synchronize the authenticated identity to a MongoDB user/profile record safely.
- [ ] Define roles and permissions for user, owner/seller, and admin.
- [ ] Protect private web routes and every corresponding API operation.
- [ ] Add authorization tests for unauthenticated, regular-user, owner-of-record, and admin cases.
- [ ] Replace local-only profile storage with server-backed profile read/update.

**Exit criteria**
- Login and recovery work using configured providers.
- API derives identity from a verified token.
- A user cannot read or mutate another user's private data.
- Admin endpoints reject regular users server-side.

### P4 — Listings, media and owner lifecycle

**Tasks**
- [ ] Finalize MongoDB property schema and indexes for status, owner, location, category, price, and search/sort requirements.
- [ ] Implement category/config APIs and server-side DTO validation.
- [ ] Implement create, read, update, hide/pause, restore, mark sold/rented, and delete operations for an owner's own listings.
- [ ] Implement secure image upload/storage using the selected provider; validate file type, size, count, and access.
- [ ] Support optional video and optional latitude/longitude/map data according to the PRD and provider decision.
- [ ] Make preview reflect the actual submitted listing; publish only after successful API validation/persistence.
- [ ] Publish valid listings immediately. Do not introduce a default pending moderation state.
- [ ] Enforce ownership on the server for every listing mutation.
- [ ] Replace localStorage-only listing drafts/previews with API-backed persistence where signed in; clearly label any offline/local draft.
- [ ] Build My Listings with real server data, status, edit and lifecycle actions.

**Exit criteria**
- A valid listing persists and becomes active immediately.
- Public endpoints return active listings only.
- Invalid payloads are rejected server-side.
- Owners cannot modify other owners' listings.
- Upload permissions and media validation are tested.

### P5 — Discovery, property details and engagement

**Tasks**
- [ ] Implement home discovery and category browsing with configured data; sample/illustrative cards must not masquerade as live inventory.
- [ ] Implement search by location and supported filters, sorting and pagination.
- [ ] Implement property details with photo/video gallery, facts, description, optional map and seller contact entry points.
- [ ] Implement favorites/saved homes as account-backed data, with a clearly designed guest behavior if specified by the product.
- [ ] Implement seller contact/enquiry flow and capture only the minimum required information.
- [ ] Implement listing reports, reason selection, submission feedback, and abuse controls.
- [ ] Implement shareable property URLs and graceful not-found, loading, empty, and API error states.
- [ ] Verify journeys from the Figma prototype: search → filter → details → contact; create → preview → publish; report → admin action.

**Exit criteria**
- Search results are filtered and paginated by the API.
- Details and contact use real property/seller data.
- Favorites persist correctly for the intended user model.
- Reports enter an auditable admin workflow.

### P6 — Public SEO web

**Tasks**
- [ ] Implement public homepage, search results, property detail, category pages, seller/profile entry points, About, Contact, Privacy, Terms, Safety, and 404/error states as defined by Figma/PRD.
- [ ] Render meaningful property content in server-rendered HTML for crawlers.
- [ ] Add canonical metadata, title/description, Open Graph/share metadata, robots rules, sitemap, and structured data only where accurate.
- [ ] Avoid indexing private, draft, hidden, or deleted listings.
- [ ] Ensure stable, shareable property URLs and correct 404 handling.
- [ ] Replace draft legal copy with approved company details and reviewed notices before launch.
- [ ] Verify mobile/tablet/desktop behavior and performance.

**Exit criteria**
- Public active listing pages render meaningful HTML without relying on client-only data fetch.
- Metadata and canonical URLs are correct.
- Sitemap/robots behavior excludes private inventory.
- Legal pages have owner-approved content.

### P7 — Dedicated admin operations

**Tasks**
- [ ] Implement a protected admin shell and server-side authorization for every admin route and API.
- [ ] Build dashboard metrics from real API/database aggregations; remove fake metrics.
- [ ] Implement listings, users, categories, reports, listing detail, feature catalog, plans, app configuration, audit log, and admin profile/settings.
- [ ] Support hide/restore/remove listing actions with mandatory reason, confirmation, and audit event.
- [ ] Support user management with explicit permission boundaries and audit trail.
- [ ] Add controlled data export with authorization and audit records.
- [ ] Implement loading, empty, error, forbidden, and confirmation states in the approved theme system.
- [ ] Rate-limit sensitive operations and validate every input on the server.

**Exit criteria**
- Non-admin requests are denied even when calling API endpoints directly.
- All destructive/moderation actions are attributable and auditable.
- Dashboard metrics are sourced from real data or explicitly shown as unavailable.
- Admin screens are responsive and match approved Figma frames.

### P8 — Subscription-ready plans and entitlements (no payments)

**Tasks**
- [ ] Define plan, feature catalog, entitlement, assignment and expiry models from existing docs.
- [ ] Assign Free entitlements to all users at launch.
- [ ] Make plan/feature configuration API-driven rather than hardcoded in screens.
- [ ] Evaluate limits and permissions server-side for relevant operations.
- [ ] Implement admin plan/feature editing with validation, preview and audit log.
- [ ] Keep payment checkout, paid boosts and billing disabled; do not add a payment provider without a separate approved decision.

**Exit criteria**
- Every user receives the Free plan by default.
- Server-side entitlements are enforced and tested.
- Admin changes affect configuration predictably.
- No payment flow is exposed at launch.

### P9 — React Native Community CLI mobile app

**Tasks**
- [ ] Scaffold and configure the native React Native Community CLI project; document Android/iOS build prerequisites.
- [ ] Port design tokens and all five themes plus System default to native components.
- [ ] Implement onboarding and Clerk auth flows approved for mobile.
- [ ] Implement home, categories, search/filter sheet, list/map results, property detail gallery, seller contact, create/edit listing, My Listings, favorites, notifications, profile, appearance settings, and report listing.
- [ ] Implement upload permissions, camera/photo library selection, loading/error/offline states, and mobile-safe touch targets.
- [ ] Integrate AdMob in test mode only after core flows are stable.
- [ ] Run device/emulator smoke tests and verify theme/layout parity against Figma.

**Exit criteria**
- Native app is a real buildable project, not a placeholder directory.
- Core browse → detail → contact and create → publish journeys work.
- Theme preference persists.
- Android smoke tests pass; iOS verification is documented if unavailable in the current environment.

### P10 — Quality, security and launch readiness

**Tasks**
- [ ] Add end-to-end tests for authentication, listing lifecycle, search, favorites, contact, reports, admin actions, and entitlement enforcement.
- [ ] Test validation, rate limits, abuse cases, access control, upload restrictions, and common OWASP risks.
- [ ] Check keyboard navigation, focus order, color contrast, reduced motion, semantic labels and mobile touch targets.
- [ ] Test responsive layouts on mobile, tablet and desktop.
- [ ] Add operational logging, error monitoring, database backup/restore process, and production readiness checks.
- [ ] Complete privacy, terms, safety, support/contact, and data retention/deletion policy.
- [ ] Verify production environment configuration, CORS, secure headers, secret handling and deployment health checks.
- [ ] Run final web/API/mobile test suite and record the exact commit SHA and results.

**Exit criteria**
- No unresolved critical/high release blocker.
- Backup/restore and incident response responsibilities are documented.
- QA report and release checklist are signed off.
- No claims of production readiness without evidence.

### P11 — Ads and growth

**Tasks**
- [ ] Integrate AdMob using test IDs and verify placements do not obstruct core actions.
- [ ] Complete consent/privacy and platform-policy review before production ad IDs.
- [ ] Apply for AdSense only on eligible web pages after policy approval; do not assume approval.
- [ ] Keep ads configurable and avoid sensitive/private/account pages unless policy and UX review explicitly allow them.
- [ ] Measure retention, search-to-detail conversion, seller-contact conversion, and ad impact.
- [ ] Roll out gradually and provide a way to disable placements via configuration.

**Exit criteria**
- Test ads are verified and production configuration is reviewed.
- Privacy/legal requirements are met.
- Ads do not degrade essential discovery, contact, or listing creation journeys.

## 4. Screen-to-journey acceptance matrix

| Journey | Web | Mobile | Admin/API dependencies |
|---|---|---|---|
| Browse home/categories | SEO pages and responsive discovery | Home and category browse | Category/config API |
| Search and filter | URL-driven results, sort, pagination | Search/filter sheet and list/map | Active listing search API |
| Property details | Crawlable detail URL, gallery, map/contact | Gallery, map/contact | Property detail and seller data |
| Create and manage listing | Create, preview, publish, edit and lifecycle | Native create/edit and media | Auth, media, property CRUD |
| Favorites | Account-backed saved homes | Account-backed favorites | Favorite persistence API |
| Contact seller | Contact/enquiry action and result states | Contact/enquiry action | Seller/contact endpoints and abuse controls |
| Report a listing | Report flow and confirmation | Report flow and confirmation | Report API, audit and admin queue |
| Appearance | Five themes + System default | Five themes + System default | Shared semantic tokens |
| Admin moderation | Protected review/action screens | Not required for MVP unless specified | Role guard, moderation API, audit log |
| Plans/features | Free messaging/configured capabilities | Free messaging/configured capabilities | Entitlement engine; payments off |

## 5. Delivery discipline

For each milestone, create a small implementation PR/commit set and report:
1. **Scope:** exact PRD and Figma frames addressed.
2. **Code:** routes, components, API modules and schemas changed.
3. **Verification:** commands/tests run and their actual results.
4. **Design review:** frames compared, viewport sizes, themes and gaps.
5. **Known blockers:** missing credentials/providers/assets or unresolved product decisions.
6. **Exit decision:** pass/fail against the criteria above.

Do not stack a new feature on top of a failing CI baseline. Recheck the latest commit's CI before marking the milestone green. Do not claim pixel parity, API persistence, authorization, or production readiness unless those behaviors have been implemented and verified.

## 6. Current known gaps to carry into execution

- The design README states that `docs/design/Untitled.fig` and `docs/design/Untitled.pdf` are expected source files but are not yet committed there. Locate the supplied originals and inspect them before calling the design audit complete.
- The approved individual brand assets are currently missing from the repository; retain the specified placeholder until the actual asset is available.
- The current web design status document identifies production blockers around Clerk, API/data integration, media, admin authorization, safety, entitlements, legal copy, native mobile and QA.
- Verify the actual current CI status on the latest commit before selecting the next implementation milestone.
- Provider choices still need confirmation where marked open in the source docs (Clerk sign-in method, media/object storage, map provider).
