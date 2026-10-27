# Vercel + MongoDB Atlas Deployment Guide

This guide is for the Apna Ghar web-first deployment. Do not commit credentials to Git.

## Deployment layout

Create two Vercel projects from the same GitHub repository:
1. **apna-ghar-web** — Root Directory: `apps/web`, framework: Next.js.
2. **apna-ghar-api** — Root Directory: `apps/api`, framework: NestJS / Node.js.

Use the same protected Git branch for production after CI passes. Enable preview deployments for pull requests. Verify Vercel's monorepo/workspace settings include shared `packages/*` dependencies when building from the app directories. If Vercel cannot resolve workspace packages from the selected root, adjust the project's root/install/build configuration before production deployment rather than copying packages by hand.

Official references:
- Vercel NestJS: https://vercel.com/docs/frameworks/backend/nestjs
- Vercel monorepos: https://vercel.com/docs/monorepos
- Vercel environment variables: https://vercel.com/docs/environment-variables

## MongoDB Atlas setup

1. Create an Atlas project and a database deployment sized for development.
2. Create a dedicated database user with a strong unique password. Do not use the Atlas account password.
3. Configure network access narrowly where practical. If using Vercel functions with changing egress IPs, understand the security trade-off before choosing a broad IP allowlist; do not assume a fixed Vercel IP.
4. Copy the driver connection string and replace the password placeholder. Use a database name such as `apna_ghar`.
5. Add `MONGODB_URI` to the API Vercel project's Production and Preview environment variables separately. Never add it as a `NEXT_PUBLIC_*` variable and never put it in the web project unless the web server genuinely needs direct database access (preferred design: web calls API).
6. Redeploy the API after changing environment variables.
7. Verify `/api/v1/health` for liveness and `/api/v1/health/ready` for database readiness. The readiness endpoint should not report healthy until Atlas is connected.

## Environment variables

### API project
- `MONGODB_URI`: secret Atlas connection string.
- `CORS_ORIGIN`: comma-separated exact origins, e.g. the production website origin and approved preview origin(s).
- `API_PORT`: optional for local development; Vercel provides `PORT` at runtime.
- Any Clerk secret keys should be added only when server-side Clerk auth is implemented.

### Web project
- `NEXT_PUBLIC_API_BASE_URL`: deployed API origin plus `/api/v1`, if the web API client expects an absolute URL.
- Clerk publishable/secret keys only after the chosen sign-in method and Clerk dashboard configuration are ready. Secret keys must never use the `NEXT_PUBLIC_` prefix.

## Security and release checklist

- Keep Atlas URI and Clerk secret keys out of Git, client bundles and logs.
- Restrict CORS to known website origins; do not use wildcard origins with credentialed requests.
- Use separate Atlas databases/credentials for preview and production when feasible.
- Do not use real customer data in preview environments.
- Verify API build, unit tests, web build, health/readiness endpoints and browser console after deployment.
- A green deployment only confirms that the current code deployed; it does not mean the unfinished marketplace, admin authorization, auth or security controls are production complete.
- Add Cloudinary only after the secure upload endpoint and image lifecycle are implemented. Cloudinary API secret belongs on the API project only.
- Never paste passwords, full MongoDB URIs, Clerk secrets or Cloudinary secrets into chat. Enter them directly in the relevant provider dashboard.

## Current limitations

The repo still needs product/domain completion, verified CI, and production auth/security work. Deploy first to Preview or a non-public test environment; do not advertise it as production-ready until the release checklist is satisfied.
