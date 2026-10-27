# Proposed Monorepo Structure

The framework decisions are confirmed. M1 should turn this planned layout into a runnable workspace; preserve clear app/package boundaries.

    apna-ghar/
    ├── apps/
    │   ├── mobile/              # React Native Community CLI app
    │   ├── web/                 # Next.js SEO website + protected admin area
    │   └── api/                 # NestJS TypeScript modular monolith
    ├── packages/
    │   ├── contracts/           # Shared request/response schemas and types
    │   ├── api-client/          # Typed API client
    │   ├── design-tokens/       # Blue/green tokens + light/dark themes
    │   ├── config/              # Shared TypeScript/lint/format configuration
    │   └── entitlement-core/    # Stable feature keys and capability contracts
    ├── docs/
    ├── prompts/
    ├── assets/branding/         # Approved logo exports and variants
    ├── .github/workflows/       # CI checks
    ├── .env.example
    ├── .gitignore
    ├── architecture.css
    └── README.md

## M1 implementation rules
- Use npm workspaces unless a documented blocker justifies a change.
- Keep NestJS API and Next.js web app independently runnable from root scripts.
- React Native Community CLI must retain its native Android/iOS project structure.
- Shared packages must not import React DOM, Next.js, or web-only UI into mobile.
- Keep real credentials in ignored local environment files; commit placeholders only.
- Document Node.js, Android Studio, JDK, Android SDK and iOS prerequisites (macOS required for local iOS builds).
