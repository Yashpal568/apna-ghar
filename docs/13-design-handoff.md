# Design Handoff — Figma or Google Stitch

The design source will be supplied by the product owner after generating the UI in Figma or Google Stitch. Do not treat the current starter homepage as the final design.

## Source of truth
- Approved Figma/Stitch file supplied by the product owner.
- Blue/green brand tokens in packages/design-tokens.
- Confirmed product requirements in docs/01-product-requirements.md.

## Implementation process
1. Inspect all pages, frames, components, variants, prototypes and design variables in the supplied file.
2. Inventory every screen and map each screen to a route or mobile navigation destination.
3. Capture desktop/tablet/mobile responsive rules and light/dark states.
4. Identify missing states: loading, empty, error, disabled, success, validation and permission denied.
5. Map web/admin components to Next.js and React components; map mobile UI to React Native-native components. Do not copy web DOM components into native screens.
6. Create an implementation checklist and resolve design gaps before broad UI coding.
7. Implement one user journey at a time and compare screenshots against the approved design.

## Design-generation master prompt
Use the prompt supplied in chat titled “APNA GHAR — Complete Product UI/UX Generation Brief”. It specifies the public website, mobile app, dedicated admin panel, design system, subscription-ready controls, prototype journeys and developer handoff.

## Important constraints
- Free launch; no payment checkout.
- No invented listing approval queue; valid listings publish immediately.
- Admin settings cannot enable features that are not implemented.
- Clerk OTP is not assumed enabled.
- Never claim UI parity until screens have been compared against the supplied design file.
