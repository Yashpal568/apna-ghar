# Milestones

## M0 — Product and technology decisions — COMPLETE
- React Native Community CLI selected for mobile.
- NestJS selected for the backend.
- Clerk, MongoDB, Next.js SEO web and dedicated protected admin confirmed.
- Blue/green branding and system light/dark themes confirmed.
- Free launch with payments disabled; dynamic subscription entitlements remain part of the backend design.
- Still to confirm before implementation: Clerk non-OTP sign-in method, media/object-storage provider and map provider.

## M1 — Implementation foundation — NEXT
- Establish npm workspaces/monorepo scripts and shared TypeScript/lint/format conventions.
- Scaffold React Native Community CLI mobile app, NestJS API and Next.js web/admin app.
- Add shared design tokens and API/contracts packages without importing web-only UI into native.
- Add environment validation and safe .env.example files.
- Add health/readiness endpoint, baseline API tests, web/mobile smoke checks and CI.
- Document Android Studio/JDK/Android SDK requirements and local run commands.
- Verify builds or clearly report environment limitations; no secrets and no fake success claims.

## M2 — Identity and backend
Clerk token verification, user profile sync, roles, MongoDB connection/indexes, seed strategy and audit logging.

## M3 — Listings and media
Category/config API, property CRUD, secure uploads, instant active publishing, own-listing management.

## M4 — Mobile discovery
Home, search, filters, property detail, favorites, seller contact and map.

## M5 — SEO web
Next.js public listing pages, canonical metadata, sitemap, robots and responsive listing management.

## M6 — Admin panel
Metrics, users, properties, categories, reports, app config and audit log.

## M7 — Subscription-ready backend
Features, plans, entitlements, Free assignment, admin plan editor and server-side limits; no payments.

## M8 — QA and launch
E2E/security/accessibility/performance checks, backups, monitoring, privacy/legal pages and store readiness.

## M9 — Ads and growth
AdMob test integration then production review; apply for AdSense for eligible web pages; measure impact on retention and contact conversion.
