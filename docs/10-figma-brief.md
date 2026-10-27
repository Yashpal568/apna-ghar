# Figma Design Brief

Design **Apna Ghar**, a premium Indian property marketplace for buying and selling homes, flats, villas, and plots. Brand: primary blue #2563EB, green #10B981, navy #0F172A, light background #F3F4F6, white #FFFFFF. Use refined typography, high-quality property photos, clear INR pricing, generous spacing, and accessible contrast.

## Mandatory theme system
Deliver **five complete visual themes** across mobile, public SEO website, and admin:
1. **Light** — our existing approved baseline.
2. **Midnight** — deep navy/blue dark surfaces.
3. **Graphite** — neutral charcoal dark surfaces.
4. **Forest** — dark green undertone with blue-led brand accents.
5. **AMOLED Black** — true-black background and near-black cards.

Also design a **System default** option that follows the device/browser preference. In total, users can choose one Light theme or one of four Dark themes, or use System default. Do not treat this as a single generic dark mode. Keep semantic meaning, layout, hierarchy, listing content, and imagery identical across themes; only adapt tokens, surfaces, borders, text, controls, and accents. Never tint or darken property photography.

## Theme settings and component states
Create a polished Appearance settings screen with five theme preview tiles/swatches, labels, selected state, system default option, and instant preview. Add theme-aware designs for navigation, cards, chips, filters, search controls, forms, dropdowns, bottom sheets, dialogs, toasts, badges, skeletons, empty/error states, tables, charts, and focus/disabled states. Show the same representative screen in all five themes side by side on a dedicated Theme Showcase page. Ensure accessible contrast and visible focus rings.

## Brand assets
Create separate assets for: main horizontal wordmark, light-surface small logo, dark-surface alternate logo, and launcher icon. Do not use the entire branding sheet as a production logo.

## Screens
- Mobile: onboarding, Clerk sign-in/up, home, categories, search/filter sheet, list/map results, property detail with photo/video gallery, seller contact, create listing flow, my listings, favorites, notifications, profile, appearance/theme settings, report listing, loading/error/empty states.
- Public SEO web: homepage, search results, property detail, categories, seller/profile entry points, about, contact, privacy, terms, safety, 404/error.
- Admin: overview, listings/users/categories/reports, listing details, feature catalog, subscription plan matrix, app configuration, audit log, profile/settings, empty/loading/error/permission states.

## Product behavior
Listings that pass validation publish immediately; do not invent a pending approval workflow. All users are Free at launch, but keep future subscription plans and feature entitlements configurable. Do not design a payment checkout for launch. Use realistic Indian locations and INR prices. Avoid fake verification badges or unsupported trust claims.

## Prototype journeys
1. Search → apply filters → open property → contact seller.
2. Create listing → add photos → enter price/location → preview → publish.
3. Admin reviews a reported listing and records an action.
4. Admin edits an entitlement/configuration and publishes the change.
5. User opens Appearance → previews themes → selects Midnight/Graphite/Forest/AMOLED → sees the UI update instantly.

## Handoff
Use reusable components, named variants, semantic color variables/tokens, auto layout, responsive web breakpoints, mobile-safe touch targets, and clear frame naming. Include design specs and states for every theme. Keep components implementation-friendly for Next.js web/admin and React Native Community CLI mobile; ShadCN Studio may inform web/admin components but is not a React Native UI kit. Deliver the complete editable Figma file and clickable prototype, not only screenshots.
