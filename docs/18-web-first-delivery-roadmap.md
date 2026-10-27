# Apna Ghar — Web-First Delivery Roadmap

## Product delivery rule
Build and validate the web product and backend first. The React Native mobile application is explicitly deferred until the web product, backend contracts, security controls, admin operations, SEO, SaaS foundation, and media/data integrations are stable.

## Phase 0 — Foundation and CI
- Stabilize npm workspaces, shared TypeScript conventions, environment validation, API health/readiness, tests and CI.
- Keep mobile workspace parked; do not spend milestone effort on Android/iOS screens or native project generation during web-first delivery.
- Report checks as passing only after the actual workflow results are green.

## Phase 1 — Public website and customer web experience
- Finish responsive homepage and branded design system.
- Build property discovery: search, filters, sorting, pagination, listing cards, property details and location/category landing pages.
- Build account/profile, saved properties, property submission/editing, own-properties dashboard and seller/broker contact flows.
- Add clear loading, empty, validation, error and accessibility states.
- Keep all user-visible workflows connected to typed API contracts; do not present mock data as production data.

## Phase 2 — Backend domain implementation
Use NestJS as a modular monolith with versioned REST endpoints and DTO validation.
- Identity adapter and server-side Clerk token verification; settle sign-in method before wiring auth.
- User profiles, roles/permissions and account lifecycle.
- Property/category/location domain, draft/publish/status workflows, search/filter contracts, favorites and contact requests.
- Reporting, moderation, notifications abstraction, admin configuration and audit trail.
- Consistent errors, pagination, request IDs, rate limits, API docs and unit/integration tests.
- Define repository/service interfaces now. Connect MongoDB only in the dedicated integration phase; avoid a fake in-memory store being mistaken for durable storage.

## Phase 3 — Dedicated admin panel
- Server-protected admin routes and backend authorization on every privileged endpoint.
- Dashboard metrics, users, properties, categories, reports/moderation, configuration, audit logs and support tools.
- Role separation, least privilege, confirmation for destructive actions and auditable changes.
- Admin UI must remain clearly non-production until server-side access control is verified.

## Phase 4 — Marketing website and SEO
- Server-rendered/indexable public pages with unique title, description, canonical URL and social metadata.
- XML sitemap, robots rules, structured data where accurate, breadcrumb links and clean URL strategy.
- City/locality/property-type landing pages that provide real unique value; no mass-generated thin pages.
- Core Web Vitals, image performance, analytics/consent as applicable, and Search Console readiness.
- Keep admin/private/account routes out of public indexing.

## Phase 5 — Security and reliability
- Threat model and security checklist; validate every DTO and upload input.
- Authentication/session hardening, server-side authorization, CSRF strategy where cookie sessions apply, secure headers, CORS allowlist, rate limits and abuse protection.
- Secrets only in environment/secret manager; redacted logs, request IDs, audit events and dependency scanning.
- Tests for IDOR/BOLA, role escalation, mass assignment, injection, unsafe redirects, upload abuse and rate-limit behaviour.
- Backups, retention/deletion policy, privacy/terms, monitoring and incident response plan before launch.

## Phase 6 — SaaS-ready architecture
- Establish tenant/organization boundaries only where the business model requires them; do not add complexity without a product reason.
- Define plan catalog, feature keys, entitlements, quotas and server-side enforcement.
- Admin-managed plan configuration and Free plan assignment at launch.
- Billing provider integration and payment collection remain disabled until explicitly approved. Never rely on hiding buttons as entitlement enforcement.

## Phase 7 — MongoDB and Cloudinary integration
- Connect MongoDB through validated configuration and a repository/data-access boundary.
- Add schemas, indexes, migrations/versioning strategy where applicable, safe seed scripts and integration tests.
- Connect Cloudinary for listing images with server-issued signed upload parameters or a server-mediated upload flow.
- Enforce file type/size limits, ownership checks, image transformations, deletion/cleanup and orphan cleanup; keep API secrets server-side.
- Test connection failures, retries, duplicate submissions and upload failures before production.

## Phase 8 — Release hardening
- End-to-end tests for buyer, owner/broker and admin journeys.
- Security, accessibility, SEO, performance and backup-restore checks.
- Staging deployment, environment-specific secrets, health monitoring and rollback plan.
- Do not declare production readiness until actual checks and a staging smoke test pass.

## Phase 9 — React Native mobile (last)
- Generate and complete the React Native Community CLI Android/iOS projects.
- Reuse stable API contracts, auth policy, design tokens and business rules.
- Implement mobile discovery, details, saved properties, account and listing workflows.
- Run device/emulator tests after web/backend contracts have stabilized.

## Non-negotiable delivery rules
1. No fake success claims: report CI and test results only from actual outputs.
2. No secrets committed to Git.
3. Every protected action is authorized by the backend, not only by frontend visibility.
4. Do not connect MongoDB or Cloudinary until the interfaces and workflows are ready, but keep integration tests and environment contracts planned.
5. Mobile is deferred until all web-first phases above are accepted.
