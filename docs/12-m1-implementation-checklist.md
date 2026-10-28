# M1 — Implementation Foundation Checklist

## Goal
Turn the planning-only repository into a locally runnable monorepo with three independently runnable apps: React Native Community CLI mobile, NestJS API, and Next.js public web/admin. This milestone establishes foundations; it does not implement the complete marketplace.

## Decisions in force
- Mobile: React Native Community CLI (not Expo).
- API: NestJS + TypeScript modular monolith.
- Web/admin: Next.js, with public SEO routes and a dedicated protected admin area.
- Identity: Clerk; do not configure OTP. Confirm email/password and/or Google OAuth before implementing auth.
- Data: MongoDB.
- Brand: blue #2563EB, green #10B981, navy #0F172A, light surface #F3F4F6, white #FFFFFF. Support system light/dark mode.
- Launch: free access, no payment collection; keep future plans and feature entitlements in the domain design.

## Work packages

### M1.1 — Workspace and developer experience
- [x] Root package.json using npm workspaces (API, web, mobile and packages/*).
- [x] Shared scripts for install, typecheck, test, build and app-specific dev commands. Web lint script exists but still needs validation.
- [ ] Consistent TypeScript, ESLint and formatting configuration.
- [x] .gitignore excludes node_modules, build output, local environment files, signing keys and secrets.
- [x] .env.example documents variable names with safe placeholders only.

### M1.2 — NestJS API
- [ ] Scaffold apps/api with NestJS and TypeScript.
- [x] Add /api/v1/health (liveness) and database-aware /api/v1/health/ready response.
- [ ] Add configuration validation (API port and Mongo URI validation added; centralized error handling remains).
- [ ] Add baseline unit/e2e tests and a documented start command.
- [ ] Establish modules boundaries for auth, users, properties, categories, subscriptions/entitlements and admin without pretending those features are already implemented.

### M1.3 — Next.js web and admin
- [ ] Scaffold apps/web using TypeScript and App Router.
- [ ] Create a crawlable homepage shell and property-listing route placeholder with metadata conventions.
- [ ] Create a separate /admin route group/layout shell; do not expose it as a functional admin system until server-side auth/authorization exists.
- [ ] Add responsive blue/green tokens and system light/dark theme foundation.
- [ ] Keep SEO metadata, sitemap and robots implementation queued for the web milestone.

### M1.4 — React Native Community CLI mobile
- [ ] Native React Native Community CLI package and starter screen added; generated android/ and ios/ platform projects are still missing.
- [ ] Add theme tokens and a minimal branded starter screen with system light/dark mode.
- [ ] Document Android Studio, JDK, Android SDK, emulator and physical-device setup.
- [ ] Document that local iOS builds require macOS with Xcode.
- [ ] Keep ShadCN Studio web components out of the native app.

### M1.5 — Shared packages and CI
- [x] packages/design-tokens exports framework-neutral brand/theme values.
- [x] packages/contracts contains shared transport types without importing app-specific UI.
- [x] packages/api-client defines a typed client boundary and base URL configuration.
- [x] packages/entitlement-core defines stable feature-key types; server remains the authority.
- [x] GitHub Actions CI added for install, typechecks, API tests, API build and web build (result pending).
- [ ] Document which mobile-native checks require platform runners and avoid claiming CI validates them if it does not.

## Acceptance criteria
1. A fresh clone can follow README instructions to install dependencies and start API and web locally.
2. The mobile project is a real React Native Community CLI project, not an Expo project or placeholder.
3. API health endpoint responds and has tests.
4. Shared tokens contain the approved blue/green palette and light/dark semantic roles.
5. No real secrets are committed; environment variables are validated.
6. Admin route is only a shell until auth is enforced; no client-only security claims.
7. Root scripts and CI results are reported truthfully. Any commands not run or blocked by the environment are listed.

## Not in M1
- Full Clerk login/session integration (first confirm non-OTP method).
- Production media storage or map SDK (provider decisions remain open).
- Full property CRUD/search/favorites, admin management, subscriptions UI, payments or production ads.
- Production deployment and production credentials.

## Local environment note
React Native Community CLI requires native tooling. For Android, install a compatible Node.js version, JDK, Android Studio, Android SDK/platform tools and emulator or device debugging. For iOS, use macOS and Xcode. Keep dependency versions aligned with the React Native version selected during scaffold.
