# Theme QA and Milestone Progress

Last updated: 2026-10-28

## Theme implementation status

The web theme system supports five explicit palettes and System default:
- Light Classic
- Midnight Navy
- Graphite
- Forest Dark
- AMOLED Black
- System default (resolves to Light or Midnight based on OS preference)

The shared theme tokens live in `styles/design-tokens.css`. Component-level theme mappings live at the end of `apps/web/src/app/globals.css`. The selected palette is persisted in `localStorage` under `apna-ghar-theme`.

Recent changes:
- `f4ceb49a`: shared CTA, form, property card, illustration, tag and footer theme tokens.
- `c661dd6f`: admin and Clerk auth surfaces use semantic tokens.
- `dc46bf50`: final auth/admin palette parity and account settings panel styles.
- `4352bd60` / `e1b0b582`: initial P3 account-security settings integration.

## Manual visual acceptance checklist

Run the web app and test every page below in all five themes plus System default. Automated builds do not prove visual contrast or pixel parity.

- [ ] Home: navbar, search fields, primary/secondary buttons, category cards, property cards, hero art and footer.
- [ ] Search: filter controls, loading skeleton, empty/error states, result cards, save button and badges.
- [ ] Property details: gallery, save/share actions, facts, amenities, contact card and skeleton.
- [ ] Sign in / sign up / forgot password: Clerk fields, labels, social buttons, divider, primary CTA and footer.
- [ ] Profile: contact preferences and Clerk account-security panel.
- [ ] Saved homes and My listings: status badges, empty/loading/error states, row/card actions.
- [ ] List property: all form controls, step navigation, validation and review panel.
- [ ] Admin preview routes: sidebar, topbar, metrics, tables, warning and empty states.
- [ ] Responsive widths: 390px, 650px, 900px, desktop.
- [ ] Keyboard focus, hover, pressed, disabled and reduced-motion states.
- [ ] Confirm real property photos remain untinted; only UI surfaces and decorative illustrations change palette.

## Current milestone

### P2 — Design system and themes
Implementation pass applied to shared web surfaces. **Final visual acceptance remains open** until the checklist above is manually reviewed against the approved Figma/Stitch reference. The original editable Figma file is not currently present in the repository, so pixel-perfect parity cannot be claimed from source code alone.

### P3 — Identity and profiles (in progress)
- [x] Add account-security panel on the profile route.
- [x] Use Clerk's supported account UI for signed-in users to manage email, password, connected accounts and security settings.
- [x] Provide sign-in and not-configured states.
- [ ] Verify signed-in and signed-out behavior with configured Clerk keys.
- [x] Add authenticated GET/PUT `/api/v1/users/me/profile` endpoints backed by MongoDB and keyed by verified Clerk user ID.
- [x] Connect the profile page to the API for signed-in users; retain local-only profile saving for signed-out visitors.
- [ ] Verify signed-in and signed-out behavior with configured Clerk keys and a reachable MongoDB deployment.
- [x] Add initial unit tests for profile defaults, public response shape, input normalization and Clerk-user-scoped upsert.
- [ ] Add controller/guard authorization tests and run the API test suite in CI.

## Scope guardrails
- No invented user/listing metrics.
- The profile contact preferences currently stored in localStorage are not account-synced.
- Theme CI/build success is necessary but not a substitute for manual visual comparison.
- Admin pages remain preview-only until server-side admin roles and protected operations are implemented.
