# Apna Ghar

Premium Indian real-estate buy/sell/rent marketplace.

## Confirmed stack

- Mobile: React Native Community CLI (not Expo)
- Backend: NestJS + TypeScript modular monolith
- Identity: Clerk; non-OTP sign-in method to be confirmed before auth implementation
- Database: MongoDB
- Public SEO website and dedicated admin area: Next.js
- Branding: blue #2563EB, green #10B981, navy #0F172A; system light/dark themes
- Launch: all users Free; payment collection disabled

## M1 foundation status

- npm workspaces and shared developer scripts are configured.
- NestJS API has liveness and MongoDB-aware readiness routes, baseline unit tests, request validation, and a registered centralized HTTP exception filter.
- API validates the port and MongoDB URI during configuration.
- Shared design tokens, transport contracts, API client and entitlement keys are present.
- Next.js web app and admin design shell exist; admin authorization is not implemented and admin screens are not safe for real operations.
- Mobile package and branded starter screen are present. Native `android/` and `ios/` project directories are intentionally deferred to the final mobile phase; they are not an M1 blocker.
- HTTP-level health/readiness end-to-end tests and a dedicated Jest config have been added. CI remediation is tracked separately after foundation implementation.
- Native `android/` and `ios/` projects are intentionally deferred to the final mobile phase. The approved delivery workflow is web + admin + marketing/SEO + backend/security/data integrations first, APK last. See `docs/08-milestones.md`, `docs/12-m1-implementation-checklist.md`, and `docs/18-web-first-delivery-roadmap.md`.
- The current Ubuntu CI does not build native Android/iOS binaries; do not treat TypeScript checks as native-build validation.


## Typography

- Web body/UI text uses Google Fonts **Inter** (16px base, 1.55 line-height).
- Web headings and brand display text use Google Fonts **Plus Jakarta Sans**.
- Icon glyphs use Material Symbols Outlined; do not use icon fonts for ordinary text.
- Typography rules for web and the planned React Native app are documented in [docs/19-typography-guidelines.md](docs/19-typography-guidelines.md). Native font assets will be bundled during the mobile UI phase; CSS imports do not apply to React Native.

## Requirements

- Node.js >= 20.11 and npm
- MongoDB for API development (local default URI is in `.env.example`)
- Android development: Android Studio, compatible JDK and Android SDK
- Local iOS builds: macOS and Xcode

## Setup

1. Copy `.env.example` to `.env` and adjust local values. Never commit credentials.
2. Install dependencies from the repository root:
   ```bash
   npm install
   ```
3. Start the API:
   ```bash
   npm run dev:api
   ```
4. Start the web app in a second terminal:
   ```bash
   npm run dev:web
   ```

API liveness: http://localhost:4000/api/v1/health
API readiness: http://localhost:4000/api/v1/health/ready (503 until MongoDB is connected)
Website: http://localhost:3000

## Useful commands

- `npm run build` — API and web production builds
- `npm run typecheck` — API, web and mobile TypeScript checks
- `npm run test` — API unit tests
- `npm run test:e2e:api` — API HTTP end-to-end health/readiness tests

## Docs

- `docs/01-product-requirements.md` — product requirements
- `docs/09-technical-decisions.md` — confirmed technology decisions
- `docs/12-m1-implementation-checklist.md` — M1 acceptance criteria and progress
- `docs/17-web-design-implementation-status.md` — what is UI-only versus production-gated
