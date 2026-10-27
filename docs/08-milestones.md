# Milestones

## M0 — Product and technology decisions — COMPLETE
- React Native Community CLI selected for the eventual mobile app.
- NestJS + TypeScript selected for the backend modular monolith.
- Next.js selected for public SEO website and dedicated admin area.
- Clerk selected as identity provider; non-OTP sign-in method must be confirmed before implementation.
- MongoDB selected for persistence; integration intentionally deferred until the domain/API workflows are ready.
- Cloudinary selected as the intended listing-image provider; credentials and production integration are deferred.
- Blue/green branding and system light/dark themes confirmed.
- Free launch with payment collection disabled; subscription entitlements remain part of the backend design.

## M1 — Foundation and CI — IN PROGRESS
- Stabilize npm workspaces, shared packages, environment validation, API health/readiness, tests and CI.
- Prioritize API and Next.js web developer experience.
- Mobile workspace may remain parked; native Android/iOS projects are not an acceptance blocker for the current web-first phase.
- Verify builds and report actual CI outcomes; never claim success without green checks.

## M2 — Web experience
Responsive marketing/home page, property search/filter/sort, property detail pages, city/category landing pages, customer accounts, favorites, seller/broker dashboards and listing management.

## M3 — Backend domain and identity
Clerk server-side token verification, profile sync, roles/permissions, versioned API, property/category/user/favorite/contact/report domains, validation, consistent errors and test coverage. Design repository interfaces before database integration.

## M4 — Dedicated admin and moderation
Server-protected admin access, dashboard metrics, users, listings, categories, reports, moderation, configuration and audit log. Every privileged API operation must enforce server-side permissions.

## M5 — Marketing SEO and growth foundations
Unique metadata, canonical URLs, sitemap, robots, accurate structured data, internal linking, indexable local landing pages, private-route indexing controls, performance and analytics readiness.

## M6 — Security and reliability
Threat model, validation, secure headers, CORS, rate limiting, auth/authorization tests, upload controls, secrets hygiene, redacted logs, dependency scanning, privacy/legal content, monitoring and backup/restore plan.

## M7 — SaaS-ready entitlements
Plan catalog, Free assignment, stable feature keys, usage limits, admin plan editor and server-side enforcement. Billing/payment collection remains disabled unless explicitly approved.

## M8 — MongoDB and Cloudinary integration
Database schemas/indexes/seeds, repository integration, image upload authorization, file limits, Cloudinary transformations/cleanup, integration tests and failure handling.

## M9 — Release QA
End-to-end buyer/seller/admin flows, accessibility, SEO, performance, security, staging smoke tests, monitoring and rollback checks.

## M10 — Mobile application (LAST)
Only after web, backend, admin, SEO, security, SaaS and MongoDB/Cloudinary integrations are accepted, finish the React Native Community CLI Android/iOS application against stable shared API contracts.
