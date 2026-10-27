# Technical Decision Records

## TDR-001: Mobile framework
Status: DECIDED — React Native Community CLI. Maintain native Android/iOS projects and use Android Studio, JDK and Android SDK for Android development. Select native libraries deliberately and document setup/version compatibility.

## TDR-002: Backend framework
Status: DECIDED — NestJS + TypeScript. Use a modular-monolith architecture with feature modules, DTO validation, guards, centralized exception handling, configuration validation and tests. Do not add a separate Express application; NestJS uses its configured HTTP adapter.

## TDR-003: ShadCN Studio
Status: PARTIALLY DECIDED. Use ShadCN Studio / compatible React components for web and admin. It is not a drop-in React Native UI kit. Native app uses React Native-compatible components and shared brand tokens.

## TDR-004: Clerk
Status: DECIDED. Verify Clerk-issued tokens on the API and maintain application role/profile mapping. Never trust client-only roles. Before implementation, confirm the desired non-OTP sign-in method(s), such as email/password or Google OAuth; do not enable OTP by default.

## TDR-005: MongoDB
Status: DECIDED. Use MongoDB, explicit indexes, validated schemas and a 2dsphere index for geo queries. Store GeoJSON coordinates in [longitude, latitude] order.

## TDR-006: Web and admin
Status: DECIDED. Use Next.js for crawlable public property pages and a dedicated protected admin area. Public listing pages require canonical metadata, sitemap and robots handling. Admin authorization must be enforced server-side and by the API.

## TDR-007: Subscription entitlements
Status: DECIDED. Model plans, feature keys and entitlements dynamically from MVP. All accounts receive Free entitlements at launch; payment collection is disabled. Server-side checks are authoritative. Admin configuration cannot activate functionality that has not been implemented.

## TDR-008: Branding and themes
Status: DECIDED. Blue + green brand palette, shared design tokens, system-aware light/dark themes and corresponding logo variants. Keep web-only components out of the native bundle.

## TDR-009: Media and maps
Status: OPEN. Select an object-storage/upload strategy and map provider before implementing production uploads or map-dependent flows. Do not store large media binaries directly in MongoDB.
