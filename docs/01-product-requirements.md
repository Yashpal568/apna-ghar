# Apna Ghar — MVP Product Requirements

## Product
Premium Indian marketplace for buying and selling properties. Mobile-first, free at launch, with a dynamic backend and SEO-friendly web presence.

## Confirmed decisions
- Brand: Apna Ghar, blue + green identity, system-aware light/dark logos.
- Property sale marketplace: houses, apartments, villas, plots, commercial properties, farmhouses, offices and shops.
- Clerk authentication; MongoDB database; React Native mobile; Expo vs CLI remains open.
- Next.js web for SEO and a dedicated protected admin panel.
- All users free initially; plans/features/entitlements built into backend now, payments disabled.
- AdMob mobile ads; AdSense only on eligible web pages after approval/policy review.
- No pending listing approval. Valid listings publish immediately; admins can later hide/remove abusive listings.
- Photos, optional video, price, description, location, optional latitude/longitude, map, seller contact.
- ShadCN Studio is primarily for web/admin UI inspiration and compatible React components, not a drop-in native component kit.

## User features
Browse; search; category browse; filters/sort; property details; photo/video gallery; optional map; post/edit/hide/delete own listings; favorites; contact seller; report listing; profile; shareable web URLs.

## Admin features
Dashboard metrics; manage users, listings, categories, reports, homepage sections, filters, feature catalog, plans, entitlements, ad settings and audit logs; hide/restore/remove listings with reasons; controlled data export.

## MVP exclusions
No pending state, property checkout/escrow, loan/EMI features, payment processing, active paid boosts, or builder billing. Future paid UI can remain absent or disabled.

## Acceptance criteria
- New valid listings become active immediately.
- Public search returns active listings only.
- Owner/admin permissions are enforced server-side.
- Admin APIs are inaccessible to regular users.
- Entitlements are server-evaluated even while all users are Free.
- Public web property pages render meaningful HTML for search engines.
- Business configuration is API-driven, not hardcoded in client screens.
