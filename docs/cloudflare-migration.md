# Apna Ghar — Cloudflare Workers migration

This repository is a monorepo. The Next.js frontend lives in `apps/web`; the NestJS API remains on Render and MongoDB remains on Atlas. This migration must be previewed before changing production traffic.

## Runtime

- Next.js frontend: Cloudflare Workers using `@opennextjs/cloudflare`
- API: existing Render NestJS service
- Database: existing MongoDB Atlas cluster
- Authentication: existing Clerk project

## Local commands

Run these from the repository root after installing dependencies:

```bash
npm install
npm run preview:cloudflare
```

The workspace command runs in `apps/web` and uses its `wrangler.jsonc`. To deploy manually after Cloudflare credentials are configured:

```bash
npm run deploy:cloudflare
```

Do not run a production deploy until the Cloudflare preview has been checked.

## Cloudflare setup

1. Connect the GitHub repository `Yashpal568/apna-ghar` to Cloudflare Workers Builds.
2. Keep the repository root as the build root so npm workspaces can install correctly.
3. Install command: `npm install --include=dev`.
4. Configure the build/deploy command using the workspace scripts in `apps/web/package.json` (see below); use a Cloudflare API token with only the required Workers deployment permissions and the correct account ID.
5. Add the same required **frontend** environment variables currently configured in Vercel as Worker secrets/variables. Do not copy API secrets into client-visible `NEXT_PUBLIC_*` variables.
6. Confirm the Worker deploys to its `workers.dev` URL before changing any production settings.

For a direct CLI deployment, the repository root command is `npm run deploy:cloudflare`. If using a Git-connected build, configure the Cloudflare build step to run `npm run deploy:cloudflare -w @apna-ghar/web` and provide the Cloudflare account credentials through the platform's secret settings. Avoid exposing tokens in build logs or source control.

## Required environment configuration

Review the current Vercel project settings and configure the equivalent values for the Cloudflare Worker. Likely variables include:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY` (server-only secret)
- The frontend API base URL, currently intended to point to the Render API
- Any other variables actually read by `apps/web`

Use the exact variable names found in the code and current Vercel settings. Never commit production values. Confirm Clerk's allowed origins/redirect URLs and the Render API CORS allowlist include the new `workers.dev` hostname before testing authenticated profile calls.

## Acceptance checklist

- [ ] Home page and property detail pages render on the Workers URL.
- [ ] Mobile navigation drawer opens/closes, is keyboard accessible, and does not scroll the page behind it.
- [ ] Sign-in and sign-up work with the existing Clerk project.
- [ ] Profile and security pages load without 401/CORS errors after sign-in.
- [ ] Profile edits persist through the existing Render API.
- [ ] Property photos and Cloudinary images render correctly.
- [ ] Refreshing nested routes does not return 404.
- [ ] Production build and runtime logs show no adapter or unsupported-runtime errors.
- [ ] Only after all checks pass, update the public link/production target. Keep Vercel available for rollback until Cloudflare is stable.

## Important notes

- Do not use static export: the app uses dynamic Next.js functionality and Clerk.
- Do not move the API or database as part of this frontend migration.
- OpenNext Cloudflare requires the Node.js compatibility flag and does not support Next.js Edge runtime routes. Remove any `export const runtime = "edge"` if one exists before deploying.
- The first deployment is a test deployment only. No production domain is configured in this repo.
