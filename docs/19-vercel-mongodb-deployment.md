# Apna Ghar — Vercel, Render and MongoDB Atlas Deployment Guide

This is the recommended web-first hosting layout. Do not commit credentials to Git or paste secrets into chat.

## Recommended hosting split

- **Public website + SEO:** Vercel (apps/web, Next.js).
- **Backend REST API:** Render Web Service (NestJS). This gives the API a conventional long-running Node.js service, straightforward health checks, logs and environment management. Vercel can host NestJS too, but it packages the app as a Function and inherits function constraints; for this project, keep the API on Render initially.
- **Database:** MongoDB Atlas.
- **Listing image storage (later):** Cloudinary, accessed only through the backend.

This is a starting architecture, not a claim that the application is production-ready. Current auth, admin authorization and marketplace flows still need implementation and testing.

## 1. Deploy the web app to Vercel

1. Open the Vercel dashboard and import Yashpal568/apna-ghar.
2. Set the project name to apna-ghar-web.
3. Set Root Directory to apps/web.
4. Select Next.js framework detection. Ensure the build/install setup can resolve npm workspace dependencies from the repository root and packages/*. If Vercel reports workspace-resolution errors, configure the project to install/build from the monorepo root rather than duplicating package files.
5. Deploy a Preview first. Use a production branch only after CI is green and the preview has been smoke-tested.
6. Add NEXT_PUBLIC_API_BASE_URL after the API is deployed. Set it to the Render API origin plus /api/v1, for example https://YOUR-API.onrender.com/api/v1. Do not use this example hostname literally.
7. Redeploy after changing environment variables.

Official references:
- Vercel monorepos: https://vercel.com/docs/monorepos
- Vercel environment variables: https://vercel.com/docs/environment-variables

## 2. Deploy the API to Render

Create a Web Service connected to the same GitHub repository.

Recommended initial settings:
- Name: apna-ghar-api
- Branch: feat/m1-foundation-completion for a temporary preview/test deployment; switch to the approved production branch after merge/review.
- Root Directory: leave blank / repository root because this is an npm workspace.
- Runtime: Node.
- Build Command: npm install && npm run build:api
- Start Command: node apps/api/dist/main.js
- Health Check Path: /api/v1/health

Check the generated build output path if the build command or Nest configuration changes. Do not expose the API as production-ready until its build and smoke checks pass.

Add Render environment variables:
- MONGODB_URI: MongoDB Atlas driver connection string, secret.
- CORS_ORIGIN: exact Vercel website origin(s), comma-separated; include localhost only if needed for local development. Avoid wildcards.
- NODE_ENV: production for production service.
- API_PORT: optional; Render provides PORT and the API now prefers it.

Use Render's logs and deploy status to troubleshoot build/start failures. Render docs:
- Web Services: https://render.com/docs/web-services
- Health checks: https://render.com/docs/health-checks
- Deploys: https://render.com/docs/deploys

Note: Render's free web services can spin down after inactivity, causing cold-start delays. That may be fine for early testing; consider a paid always-on service when reliability and response times matter.

## 3. Connect MongoDB Atlas securely

1. In Atlas, create/use a dedicated database user with a strong unique password. Do not use your Atlas account login password.
2. Set network access according to the hosting plan and Atlas guidance. Do not assume Render or Vercel has a fixed outbound IP on every plan. If a broad allowlist is temporarily required for development, understand the exposure and tighten it before production.
3. Copy the Atlas driver URI, replace the password placeholder, and select the database name (for example apna_ghar).
4. Add the complete URI only to Render's API environment variable named MONGODB_URI. Never put it in a NEXT_PUBLIC_* variable, frontend code, source files, screenshots or logs.
5. Trigger a new deploy after setting the variable.
6. Verify:
   - https://YOUR-API.onrender.com/api/v1/health returns a liveness response.
   - https://YOUR-API.onrender.com/api/v1/health/ready returns HTTP 200 only when Atlas is connected.
7. If readiness fails, inspect Render logs and Atlas network/database-user settings. Do not post the connection string into chat.

Use separate credentials/databases for preview and production when feasible. Avoid real customer data in preview environments.

## 4. CORS and client configuration

- CORS_ORIGIN on Render should list the exact deployed Vercel origin, without a trailing slash if possible.
- NEXT_PUBLIC_API_BASE_URL belongs in Vercel's web project and is public by design; it must contain only the API base URL, never credentials.
- If preview deployment URLs vary, avoid allowing every arbitrary origin permanently. Configure a controlled preview-origin policy or test preview builds without privileged cookies.
- The backend must verify auth and permissions independently of frontend visibility.

## 5. Later: Cloudinary

When listing-image upload flows are implemented:
- Keep Cloudinary API secret only in Render's backend environment.
- Use backend-issued signed upload parameters or server-mediated uploads.
- Validate file type, size, ownership, image transformations and deletion/cleanup.
- Never put the Cloudinary API secret in the browser or NEXT_PUBLIC_* variables.

## 6. Release checklist

Before calling this a production launch, verify:
- CI: API/web typecheck, tests and production builds actually pass.
- Vercel preview loads and can reach the Render API.
- Render API build succeeds and health/readiness endpoints behave correctly.
- Atlas connectivity works and database errors are handled safely.
- CORS is restricted; secrets are not in Git/client bundles/logs.
- Server-side Clerk auth and admin authorization are implemented and tested.
- Property CRUD, validation, access-control, moderation and upload abuse tests pass.
- Privacy/terms, backups, monitoring, rollback and staging smoke tests are ready.

A successful hosting deployment does not mean the unfinished marketplace, auth, admin permissions or security controls are complete.
