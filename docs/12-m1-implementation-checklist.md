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
- [x] NestJS + TypeScript API scaffold exists.
- [x] Add /api/v1/health (liveness) and database-aware /api/v1/health/ready response.
- [x] Add configuration validation (API port and Mongo URI are validated at startup; global HTTP exception filter is registered).
- [x] Baseline API unit tests and documented start commands exist. [ ] Add/verify end-to-end tests that exercise the HTTP app and health routes.
- [x] Existing API module boundaries include health, users and properties. [ ] Add explicit placeholder modules for auth, categories, subscriptions/entitlements and admin before those features are implemented.

### M1.3 — Next.js web and admin
- [x] Next.js + TypeScript App Router web app exists.
- [x] Homepage and property route shells exist; full SEO metadata/sitemap remain queued for the web milestone.
- [x] Separate admin route/layout shell exists; it remains non-operational until server-side auth/authorization is implemented.
- [x] Shared blue/green tokens and light/dark theme foundation are present; visual verification remains part of web milestone.
- [ ] Keep SEO metadata, sitemap and robots implementation queued for the web milestone.

### M1.4 — React Native Community CLI mobile
- [x] React Native Community CLI package and starter screen exist. [ ] Generate and commit native android/ and ios/ platform projects (blocking M1 acceptance).
- [x] Shared theme tokens and branded starter screen exist. [ ] Verify system light/dark behavior on native devices after platform projects are generated.
- [x] Documented Android Studio/JDK/SDK/emulator/device setup in docs/13-mobile-native-setup.md.
- [x] Documented macOS/Xcode/CocoaPods requirement in docs/13-mobile-native-setup.md.
- [ ] Keep ShadCN Studio web components out of the native app.

### M1.5 — Shared packages and CI
- [x] packages/design-tokens exports framework-neutral brand/theme values.
- [x] packages/contracts contains shared transport types without importing app-specific UI.
- [x] packages/api-client defines a typed client boundary and base URL configuration.
- [x] packages/entitlement-core defines stable feature-key types; server remains the authority.
- [x] GitHub Actions CI added for install, typechecks, API tests, API build and web build (result pending).
- [x] Documented that current Ubuntu CI does not build native Android/iOS binaries in docs/13-mobile-native-setup.md.

## Current M1 gate

The API exception filter and mobile setup documentation are now in place. M1 is **not yet complete**: native Android/iOS projects are absent, and API HTTP end-to-end tests plus placeholder module boundaries still need to be verified/added. Do not start M2 until these blockers are resolved and CI is green on the latest commit.

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
