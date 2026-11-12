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
  - [x] Verified full monorepo typecheck (`npm run typecheck`: API, web, mobile passed with 0 errors).
  - [x] Verified unit and contract test suites (`npm test`: 9 passed, 53 passed).
  - [x] Verified production build (`npm run build:web`: 21/21 routes compiled and optimized).
  - [x] Verified local server HTTP 200 and navbar presence across all 12 core marketplace routes.

## Environment readiness

- [ ] Cloudflare web URL loads the latest version.
- [ ] Render/NestJS API health endpoint responds successfully.
- [ ] API can connect to MongoDB Atlas.
- [ ] Cloudinary upload credentials and upload path work.
- [ ] Clerk Development Instance keys are configured consistently in web and API.
- [ ] Clerk development mode is used for test accounts only; it is not treated as production authentication for a public launch.
- [ ] Payments remain disabled for the free launch.

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
