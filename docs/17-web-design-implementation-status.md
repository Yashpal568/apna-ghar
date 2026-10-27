# Web Design Implementation Status

## What this branch implements
Branch: `design/finalize-web`

The Figma PDF and the existing Stitch HTML prototypes were used as references. Figma remains the primary design direction; Stitch is a supporting interaction reference. This branch is a coherent web UI implementation pass, not a claim that the full marketplace is production-ready.

- Home discovery page with responsive hero, search form, category cards, illustrative property cards and owner CTA.
- Search page with URL-driven search inputs and an explicit no-live-inventory state.
- Property detail layout with image placeholders, facts, amenities, map placeholder and disabled contact/visit actions.
- Sign-in, sign-up and password-recovery layouts for email/password and Google entry points.
- Listing creation first-step layout with property basics, owner contact fields, step indicator and publishing-policy guidance.
- Five theme palettes plus System default picker with local preference persistence.
- Admin overview, listing/users/reports/plans/settings workspace routes and clear preview-only states.
- About, safety and privacy draft content routes.
- Responsive layout rules, reduced-motion handling, keyboard focus styling and theme-aware semantic CSS tokens.

## Product decisions preserved
- Brand palette: blue `#2563EB`, green `#10B981`, navy `#0F172A`, light canvas `#F3F4F6`, white surfaces.
- Five themes: Light, Midnight, Graphite, Forest, AMOLED Black. System default follows device preference.
- The approved blue/green house-and-wordmark asset must not be recreated or substituted. The asset is missing from this repo, so the explicit placeholder is shown.
- Valid listings are intended to publish immediately by default. Manual moderation is reserved for reports, policy violations and explicit exceptions.
- Subscription flows may be designed, but all users remain Free and payment checkout stays disabled at initial launch.
- Sample property cards on the home page are explicitly described as illustrative; search and details pages do not pretend there is a live database.

## Production blockers — do not skip
This branch is UI implementation only. Before launch, implement and verify:

1. **Authentication:** Clerk configuration, email/password, Google OAuth, email verification, recovery, session handling and authorization tests.
2. **API/data:** connect Next.js to NestJS endpoints and MongoDB schemas; implement listings, search/filter/sort/pagination, saved homes, visits, enquiries and owner lifecycle.
3. **Listing form:** real client validation, draft persistence, image upload/storage, preview, publish response and edit/pause/sold/rented/delete flows.
4. **Admin security:** protect every admin route on the server, verify roles/permissions in APIs, add audit logging and rate limits. Hiding UI is not authorization.
5. **Safety:** reporting workflows, moderation actions, abuse handling and support escalation.
6. **Subscriptions:** configurable plan/entitlement model and expiry behavior. Payment provider integration remains disabled until the product decision and compliance review are complete.
7. **Legal content:** replace draft About/Safety/Privacy content with reviewed company information and a complete privacy/legal notice before publishing.
8. **Brand asset:** add approved individual SVG/PNG light/dark assets and app icons; remove placeholder only after asset review.
9. **Native app:** the React Native Community CLI app still needs to be scaffolded and implemented using the same design tokens and theme behavior.
10. **Quality gates:** run `npm install`, `npm run build:web`, API build/tests and responsive/manual accessibility review. This environment has not executed a build or browser QA, so compilation and visual pixel parity remain unverified.

## Review checklist
- [ ] Build passes on Node.js >= 20.11.
- [ ] No missing or conflicting Next.js routes.
- [ ] Theme changes persist and System default responds to OS preference.
- [ ] Logo placeholder is replaced only with the approved source asset.
- [ ] All forms have real validation and server-backed success/error/loading states.
- [ ] Admin routes deny unauthenticated/non-admin requests server-side.
- [ ] No demo metrics or illustrative property details are presented as live data.
- [ ] Legal copy and contact details approved.
- [ ] Mobile, tablet, desktop and keyboard accessibility checked.
