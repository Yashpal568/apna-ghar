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
- Mobile package and branded starter screen are present, but native `android/` and `ios/` project directories are still missing. This remains an M1 acceptance blocker.
- M1 is still blocked by missing native `android/` and `ios/` projects and unverified HTTP end-to-end coverage. See `docs/12-m1-implementation-checklist.md` and `docs/13-mobile-native-setup.md`.
- The current Ubuntu CI does not build native Android/iOS binaries; do not treat TypeScript checks as native-build validation.

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

## Docs

- `docs/01-product-requirements.md` — product requirements
- `docs/09-technical-decisions.md` — confirmed technology decisions
- `docs/12-m1-implementation-checklist.md` — M1 acceptance criteria and progress
- `docs/17-web-design-implementation-status.md` — what is UI-only versus production-gated
