# Technical Decision Records

## TDR-001: Expo vs React Native Community CLI
Status: OPEN. Compare native SDK needs (Clerk, media, maps, AdMob), development speed, build workflow, debugging and maintenance. Expo is the default recommendation unless a concrete dependency requires a bare workflow. Expo Go and development builds are different; some native modules require development builds.

## TDR-002: ShadCN Studio
Status: PARTIALLY DECIDED. Use for web/admin design and compatible React components. It is not a drop-in React Native UI kit. Native app should use React Native-compatible components while sharing brand tokens.

## TDR-003: Clerk
Status: DECIDED. Verify Clerk tokens in backend and maintain application role/profile mapping. Never trust client-only roles.

## TDR-004: MongoDB
Status: DECIDED. Use MongoDB, explicit indexes, validated schemas and 2dsphere index for geo queries.

## TDR-005: Backend framework
Status: OPEN. Choose NestJS for conventions/modules or Express for a lighter setup before implementation. Do not mix both.
