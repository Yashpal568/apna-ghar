# Coding Agent Prompt — M1 Foundation

Implement M1 from docs/12-m1-implementation-checklist.md in this repository. First inspect the existing tree and docs; preserve confirmed decisions and do not overwrite unrelated work.

## Required stack
- npm workspaces monorepo
- apps/mobile: React Native Community CLI with native Android/iOS project structure
- apps/api: NestJS + TypeScript modular monolith
- apps/web: Next.js + TypeScript, public SEO site and separate admin shell
- packages/design-tokens, packages/contracts, packages/api-client, packages/config and packages/entitlement-core

## Product constraints
Apna Ghar is a property buy/sell marketplace. Keep blue/green branding and system light/dark themes. Clerk is the chosen identity provider, but do not configure OTP and do not invent the sign-in choice; leave auth integration behind a documented boundary until email/password and/or Google OAuth is confirmed. MongoDB is the chosen database. Keep subscription plans and entitlements in the architecture, but all users are Free at launch and payments are disabled. ShadCN Studio is for web/admin; mobile must use native-compatible components.

## Implementation order
1. Inspect repository and confirm current branch/tree.
2. Scaffold workspace and root scripts.
3. Scaffold NestJS API, health/readiness endpoints, config validation and tests.
4. Scaffold Next.js web/admin shell and metadata conventions.
5. Scaffold React Native Community CLI app with Android/iOS native directories and a branded starter screen.
6. Add framework-neutral shared tokens/contracts/client/entitlement types.
7. Add CI and setup documentation.
8. Run available install, lint, typecheck, test and build commands; fix failures caused by this change.

## Safety and quality
- Never commit real API keys, Clerk secrets, MongoDB URIs, signing credentials or personal data.
- Do not claim that a command passed unless it was actually run and its result inspected.
- Do not claim production authentication or admin protection exists until server-side guards and token verification are implemented and tested.
- Avoid unnecessary infrastructure or paid services.
- Do not add maps, media storage, AdMob or AdSense SDKs in M1; provider decisions and compatibility checks are separate tasks.
- Do not implement the whole marketplace in one pass. Finish a maintainable foundation and report exact files, commands, results, blockers and the next recommended milestone.

## Deliverable
A committed, runnable M1 foundation with updated README and docs/12-m1-implementation-checklist.md acceptance criteria either met or explicitly itemized as blocked.
