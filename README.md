# Apna Ghar

Premium Indian real-estate buy/sell marketplace. This repository currently contains the product blueprint; the runnable implementation foundation is the next milestone.

## Confirmed technology decisions
- **Mobile:** React Native Community CLI
- **Backend:** NestJS + TypeScript modular monolith
- **Authentication:** Clerk; confirm a non-OTP sign-in method before auth implementation
- **Database:** MongoDB
- **Public SEO website:** Next.js
- **Admin:** Dedicated protected admin area in the Next.js web app, with server-enforced permissions
- **UI:** ShadCN Studio / compatible React components for web and admin; native-compatible components for mobile
- **Brand:** Blue + green with system-aware light/dark themes and logo variants
- **Subscriptions:** Dynamic plans, feature keys and server-side entitlements; all users Free and payments disabled at launch
- **Ads:** AdMob for mobile; AdSense only on eligible web pages after approval

## Start here
1. Read docs/01-product-requirements.md and docs/09-technical-decisions.md.
2. Follow docs/12-m1-implementation-checklist.md for the next milestone.
3. Use prompts/04-m1-foundation-implementation.md with the coding agent.
4. Never commit secrets; .env.example contains variable names only.

## Current status
Planning documents and repository structure are committed. A runnable app/API scaffold has not yet been implemented. M1 is the next implementation milestone.
