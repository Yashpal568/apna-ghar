# Proposed Monorepo Structure

The mobile folder is intentionally not scaffolded until Expo vs CLI is decided.

```text
apna-ghar/
├── apps/
│   ├── mobile/              # React Native: Expo OR Community CLI, decided later
│   ├── web/                 # Next.js SEO website + protected admin route group
│   └── api/                 # Node.js TypeScript modular monolith
├── packages/
│   ├── contracts/           # Shared request/response schemas
│   ├── api-client/          # Typed API client
│   ├── design-tokens/       # Blue/green tokens + light/dark themes
│   ├── config/              # Shared lint/TypeScript configuration
│   └── entitlement-core/    # Stable feature keys and capability contracts
├── docs/
├── prompts/
├── assets/branding/         # Add approved logo exports here
├── .github/workflows/
├── .env.example
├── .gitignore
├── architecture.css
└── README.md
```

Add package.json/workspaces after stack decisions. Use separate development/staging/production secrets and never commit real credentials.
