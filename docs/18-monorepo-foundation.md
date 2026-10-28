# Monorepo Foundation and Implementation Gates

## Purpose

This document defines the working repository contract for Apna Ghar. It does not claim that listed applications or features are implemented merely because their target directories exist.

## Current confirmed state

- `apps/web`: Next.js 14 UI implementation; runtime/build not yet verified.
- `apps/api`: NestJS 10 starter with development and build scripts; MongoDB integration is not wired.
- `apps/mobile`: placeholder only; React Native Community CLI native project has not been generated.
- `packages/*`: shared foundation exists in part; each package must have a real package manifest and tests before it is treated as a workspace.
- Clerk authentication, real property persistence/search, media uploads, enquiries, owner lifecycle and server-side admin authorization remain implementation work.

## Architecture rules

1. Keep the existing approved Figma direction as the visual source of truth.
2. Use Next.js for public SEO pages and the admin web application; keep admin authorization enforced server-side in both UI routing and API endpoints.
3. Use React Native Community CLI for mobile, not Expo.
4. Use NestJS as a modular monolith with feature modules and DTO validation.
5. Use MongoDB for application data; never treat the health/liveness endpoint as proof that the database is ready.
6. Use Clerk for identity, then verify session/token and role claims on protected server routes. A visible UI state is never authorization.
7. Keep launch subscriptions configurable but payment checkout disabled until explicitly enabled.
8. Valid property listings should publish immediately by default; moderation handles reports and policy exceptions.
9. Keep credentials out of Git. Commit only placeholder variable names in `.env.example`.
10. Avoid empty placeholder modules. Add folders when the first meaningful implementation for that module is being committed.

## Target repository layout

```text
apps/
  web/                 # Next.js public marketing, SEO, search and property pages
  admin/               # dedicated admin app only if separated from web becomes justified
  api/                 # NestJS API and domain modules
  mobile/              # React Native Community CLI app
packages/
  shared-types/        # cross-app transport/domain types
  validation/          # reusable validation schemas when truly shared
  api-client/          # typed API client
  config/              # shared lint/TypeScript configuration
assets/                # approved brand assets and app media
docs/                  # product, architecture, API, security and operations
infrastructure/        # deployment and local service definitions
scripts/               # repeatable developer and maintenance scripts
.github/workflows/     # CI quality gates
```

This is a target, not a request to create empty folders in advance. The current admin route lives in `apps/web`; do not duplicate it into `apps/admin` until a separate deployable admin app is intentionally chosen.

## Phase 1 acceptance criteria

- [ ] Root package manager and workspace configuration are explicit and consistent.
- [ ] Existing web and API build commands are documented and run successfully on a local machine/CI.
- [x] Mobile remains a parked workspace during foundation and web-first delivery; native generation/buildability is accepted in the final mobile phase, not M1.
- [ ] Shared workspace packages have valid manifests, exports and tests.
- [ ] CI installs dependencies and runs type checks/builds for implemented apps.
- [ ] Environment variables are documented with safe placeholders only.
- [ ] No production claim is made until builds and critical flows are tested.

## Next feature implementation order

1. Foundation and CI.
2. Authentication and authorization.
3. MongoDB connection, health/readiness distinction and migrations/index strategy.
4. Property model and owner listing lifecycle.
5. Search/filter/sort/pagination.
6. Saved properties, visits and enquiries.
7. Media upload and validation.
8. Admin reporting, user/listing moderation and audit log.
9. Notifications and configurable subscriptions.
10. Security hardening, observability, load tests and deployment.
