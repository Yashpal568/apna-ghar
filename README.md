# Apna Ghar

Premium Indian real-estate buy/sell marketplace.

## Confirmed stack
- Mobile: React Native Community CLI (native Android/iOS project)
- Backend: NestJS + TypeScript modular monolith
- Authentication: Clerk; non-OTP sign-in method to be confirmed before auth implementation
- Database: MongoDB
- Public SEO website and dedicated admin area: Next.js
- UI: ShadCN Studio / compatible React components for web/admin; native-compatible components for mobile
- Branding: blue #2563EB + green #10B981, system light/dark themes
- Subscriptions: dynamic plans/features/entitlements designed from MVP; all users Free and payments disabled at launch

## Current scaffold status
- NestJS API starter and liveness endpoint are committed.
- Next.js public homepage starter and an admin placeholder route are committed.
- Shared design tokens, transport types and feature-key types are committed.
- **The native React Native Community CLI project has not yet been generated.** See apps/mobile/README.md. Do not treat this repository as a fully runnable three-app monorepo yet.
- Clerk, MongoDB, listings, search, media upload and admin authorization are not wired up yet. Admin route is not protected; do not use it for real administration.
- Code has been committed to GitHub, but dependency installation/build/tests have not been executed in this environment. Verify locally before treating it as working.

## Requirements
- Node.js >= 20.11 and npm
- Android mobile: Android Studio, JDK and Android SDK
- Local iOS builds: macOS and Xcode

## Start API
```bash
npm install
npm run dev:api
```
Health endpoint: http://localhost:4000/api/v1/health

## Start website
In another terminal:
```bash
npm run dev:web
```
Website: http://localhost:3000

## Environment
Copy .env.example to .env and configure local values. Never commit real credentials. The health endpoint reports liveness only and does not claim MongoDB readiness.

## Docs
- docs/01-product-requirements.md — product requirements
- docs/09-technical-decisions.md — confirmed technology decisions
- docs/12-m1-implementation-checklist.md — M1 acceptance criteria
- prompts/04-m1-foundation-implementation.md — coding-agent instructions
