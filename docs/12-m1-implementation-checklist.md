# M1 — Web-First Foundation and CI Checklist

## Goal
Establish a reliable, reproducible monorepo foundation for the Next.js public website/marketing experience and admin shell plus the NestJS API. M1 is foundation work, not a completed marketplace.

## Decisions in force
- Web-first delivery: public website, marketing/SEO, admin panel, backend contracts and security come before mobile.
- Mobile APK is the final delivery phase. Do not make native Android/iOS project generation an M1 acceptance blocker or spend M1 effort on mobile feature work.
- Mobile target remains React Native Community CLI (not Expo).
- API: NestJS + TypeScript modular monolith.
- Web/admin: Next.js App Router; admin shell is preview-only until server-side authorization is implemented.
- Identity: Clerk; sign-in methods are email/password and Google sign-in per design handoff, but implementation must still be configured and tested. Never trust client-side roles.
- Data: MongoDB; readiness must remain distinct from liveness.
- Brand: blue #2563EB, green #10B981, navy #0F172A; five themes plus System default are a web/admin design requirement.
- Launch: all users Free; payment collection disabled.

## M1.1 — Workspace and developer experience
- [x] Root npm workspaces include API, web, mobile and shared packages.
- [x] Root scripts cover development, typechecking, unit tests and production builds.
- [x] Document the clean install and local development commands; CI remediation is a separate follow-up gate.
- [x] Verify each app has an explicit TypeScript configuration and workspace-level scripts; shared lint/format tooling remains a separate quality improvement, not a blocker to the foundation scaffold.
- [x] .gitignore excludes local environment files, build output and secrets.
- [x] .env.example documents safe placeholders only.

## M1.2 — NestJS API foundation
- [x] NestJS + TypeScript API scaffold.
- [x] Liveness route at /api/v1/health.
- [x] MongoDB-aware readiness route at /api/v1/health/ready (503 while disconnected).
- [x] API port and MongoDB URI startup validation.
- [x] Global DTO validation and centralized HTTP exception filter.
- [x] Unit tests cover liveness and connected/disconnected readiness states.
- [x] Added HTTP-level e2e tests for liveness and readiness without requiring a live MongoDB server.
- [x] Existing meaningful module boundaries include health, users, auth and properties.
- [x] Add the HTTP e2e command and wire it into CI. Actual CI failures are deferred to the agreed CI-remediation step.
- [ ] Add new domain modules when the first real feature for each domain is implemented; do not add empty placeholder modules.

## M1.3 — Next.js public web, marketing and admin shell
- [x] Next.js + TypeScript App Router exists.
- [x] Public homepage, property/search route shells and marketing/legal draft routes exist.
- [x] Admin route/layout shell exists and is clearly preview-only.
- [x] Shared semantic theme tokens include Light, Midnight, Graphite, Forest and AMOLED Black plus System default behavior.
- [x] Define the web production build and typecheck commands; resolve any CI failures in the separate CI-remediation step.
- [ ] SEO metadata, canonical URLs, sitemap, robots, structured data and live listing content belong to the web/SEO milestone; do not mark them complete from the starter shell.
- [ ] Admin must remain non-operational for privileged actions until server-side route and API authorization are implemented.

## M1.4 — Shared packages and CI
- [x] Shared design tokens, transport contracts, API client and entitlement keys exist.
- [x] GitHub Actions workflows cover typechecks, API tests/build and web build.
- [ ] CI remediation: make all workflows green on the latest commit, including the new HTTP e2e suite. This is the next task after M1 foundation implementation and before M2.
- [ ] Record any checks not runnable in the current environment without claiming success.

## Explicitly deferred to the final mobile phase
- [x] React Native Community CLI package and starter screen exist.
- [ ] Native Android/iOS projects, APK builds, device smoke tests and native theme switching are deferred until the web product, admin, backend, SEO, security, entitlements and data/media integrations have been accepted.
- [ ] ShadCN Studio web components must not be copied into the native UI.

## Current M1 gate
M1 foundation implementation is **complete**: workspace, API/web/mobile scaffolds, shared packages, environment example, health/readiness, validation/error handling, baseline unit tests, HTTP e2e test wiring, and setup documentation are present. The separate CI-remediation gate remains open and must be completed before M2. Native Android/iOS projects are intentionally not an M1 blocker because the approved web-first roadmap explicitly places mobile last.

## Acceptance criteria
1. A fresh clone can install dependencies and start the API and web app using the README.
2. API liveness and readiness are distinct and tested at unit and HTTP levels.
3. API build/tests and web build/typecheck are defined in scripts and CI; actual CI remediation is tracked as the next gate before M2.
4. Shared tokens and contracts remain framework-neutral.
5. No real secrets are committed and environment configuration is validated.
6. The admin shell is not represented as secure/production-ready until server-side authorization exists.
7. Mobile APK work remains deferred to the final phase.
8. Report commands and browser/device checks as passed only when they have actually run.

## Not in M1
- Full Clerk authentication/session/profile implementation.
- Full property CRUD, live search, favorites, contact and report workflows.
- Production SEO implementation and live MongoDB/Cloudinary integration.
- Operational admin actions, entitlements enforcement, security hardening and release QA.
- Native Android/iOS generation and APK delivery.
