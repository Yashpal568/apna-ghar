# APNA GHAR — M6 SECURITY TEST RESULTS & EVIDENCE

**Milestone:** M6 Security Hardening  
**Date:** November 19, 2026  
**Environment:** Local Integration Environment / Monorepo Test Runner  
**Node.js Version:** v22.14.0  
**Status:** ALL TESTS PASSING (243/243 total tests passed)

---

## 1. Executive Test Execution Summary

| Test Suite Category | Total Suites | Passed | Failed | Skipped | Total Tests |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Unit, Schema & Security Tests** | 18 | 18 | 0 | 0 | **180** |
| **API E2E Integration Tests** | 9 | 9 | 0 | 0 | **63** |
| **Total Automated Tests** | **27** | **27** | **0** | **0** | **243** |

---

## 2. API Unit, Schema & Security Test Suites (180 Tests)

Execution Command:
```bash
npm run test:api
# npm run test -w @apna-ghar/api -- --runInBand
```

Terminal Output Evidence:
```text
PASS test/security-hardening.spec.ts (8.482 s)
  M6 Security Hardening Acceptance Suite
    1. Authentication Enforcement (ClerkAuthGuard & PropertyAuthGuard)
      ✓ rejects unauthenticated requests without authorization header
      ✓ rejects requests with malformed authorization header
      ✓ rejects authentication when server secret key is not configured
      ✓ rejects expired or signature-invalid tokens
      ✓ rejects token missing subject (claims.sub)
      ✓ successfully verifies valid Bearer token and populates request.auth
    2. Authorization, IDOR Defense & Admin Isolation (AdminAuthGuard & RolesGuard)
      ✓ denies access to non-admin ordinary user
      ✓ allows access to administrator in configured ADMIN_CLERK_USER_IDS
      ✓ allows access to user with database ADMIN role
      ✓ RolesGuard blocks unauthorized roles on gated routes
    3. Suspended User Restrictions (Account Suspension Defense)
      ✓ allows active users to proceed
      ✓ blocks suspended users from properties, messaging, and write operations with HTTP 403
    4. Rate Limiting & Abuse Protection (RateLimitGuard)
      ✓ allows requests within rate limits and sets rate limit headers
      ✓ throws HTTP 429 Too Many Requests when limit is exceeded with Retry-After header
      ✓ enforces user-keyed limits preventing IP spoofing bypass for authenticated users
    5. Private Cache-Control Directives (PrivateCacheInterceptor)
      ✓ sets private no-cache headers on authenticated requests
      ✓ sets private no-cache headers on sensitive routes like /conversations
      ✓ does not force private cache headers on unauthenticated public routes
    6. File Upload Security & Magic Byte Validation
      ✓ validates authentic JPEG magic bytes
      ✓ validates authentic PNG magic bytes
      ✓ validates authentic WebP magic bytes
      ✓ validates authentic PDF magic bytes
      ✓ rejects spoofed file claiming to be JPEG but containing HTML/script
      ✓ rejects spoofed file claiming to be PDF but containing executable binary
    7. CORS Allowlist Hardening
      ✓ allows production Cloudflare Worker frontend
      ✓ allows localhost development origins
      ✓ allows verified Vercel production and project preview domains
      ✓ STRICTLY REJECTS arbitrary attacker domains on .workers.dev
      ✓ STRICTLY REJECTS arbitrary attacker domains on .vercel.app
      ✓ STRICTLY REJECTS random third-party origins
    8. NoSQL Injection & Regular Expression Sanitization
      ✓ properly escapes regex metacharacters preventing ReDoS and wildcard injection

PASS test/mongodb-integration.spec.ts
  Real MongoDB Integration & Data Layer Acceptance
    ✓ 1. Connects to real MongoDB and registers all 11 Mongoose collections
    ✓ 2. Verifies actual MongoDB indexes and unique constraints on collections
    ✓ 3. Persists UserProfile and enforces unique constraint in MongoDB
    ✓ 4. Persists Property and validates nested location document and slug uniqueness
    ✓ 5. Enforces SavedProperty compound unique constraint { userId: 1, propertyId: 1 } in MongoDB
    ✓ 6. Enforces Conversation unique thread constraint { propertyId: 1, buyerId: 1 } in MongoDB
    ✓ 7. Persists Messages, Offers, VisitRequests, Reports, Categories, and AuditLogs
    ✓ 8. Verifies Application Restart Persistence across reconnect

PASS src/conversations/conversations.controller.spec.ts
PASS src/admin/admin.service.spec.ts
PASS src/users/users.service.spec.ts
PASS src/properties/admin-auth.guard.spec.ts
PASS src/properties/properties.service.spec.ts
PASS test/schema-validation.spec.ts
PASS src/properties/saved-properties.service.spec.ts
PASS src/categories/categories.service.spec.ts
PASS src/properties/visit-requests.service.spec.ts
PASS src/properties/property-reports.service.spec.ts
PASS src/auth/roles.guard.spec.ts
PASS src/health/health.controller.spec.ts
PASS src/properties/property-auth.guard.spec.ts
PASS src/admin/admin-audit.service.spec.ts
PASS src/auth/clerk-auth.guard.spec.ts
PASS test/seo-acceptance.spec.ts

Test Suites: 18 passed, 18 total
Tests:       180 passed, 180 total
Snapshots:   0 total
Time:        25.934 s
Ran all test suites.
```

---

## 3. API End-to-End (E2E) Integration Test Suites (63 Tests)

Execution Command:
```bash
npm run test:e2e:api
# npm run test:e2e -w @apna-ghar/api -- --runInBand
```

Terminal Output Evidence:
```text
PASS test/conversations.e2e-spec.ts (7.192 s)
  Conversations & Messaging Module Endpoints (e2e)
    ✓ 1. GET /api/v1/conversations - lists current user conversations
    ✓ 2. POST /api/v1/conversations/property/:propertyId - starts conversation with owner
    ✓ 3. POST /api/v1/conversations/property/:propertyId - prevents owner from messaging self
    ✓ 4. GET /api/v1/conversations/:id - returns conversation details
    ✓ 5. GET /api/v1/conversations/:id/messages - returns paginated message thread
    ✓ 6. POST /api/v1/conversations/:id/messages - sends a text message
    ✓ 7. POST /api/v1/conversations/:id/messages - rejects empty text and attachment
    ✓ 8. PATCH /api/v1/conversations/:id/read - resets unread count for user
    ✓ 9. POST /api/v1/conversations/upload - uploads file attachment
    ✓ 10. POST /api/v1/conversations/upload - rejects disallowed mime type
    ✓ 11. GET /api/v1/conversations/:id/offers - lists all negotiation proposals
    ✓ 12. POST /api/v1/conversations/:id/offers - submits buyer offer
    ✓ 13. POST /api/v1/conversations/:id/offers - rejects offer from owner (must use counter)
    ✓ 14. POST /api/v1/conversations/:id/offers/:offerId/counter - owner counters offer
    ✓ 15. PATCH /api/v1/conversations/:id/offers/:offerId/respond - accepts offer
    ✓ 16. PATCH /api/v1/conversations/:id/offers/:offerId/respond - rejects offer
    ✓ 17. Security: Rejects unauthenticated requests with 401

PASS test/admin.e2e-spec.ts
PASS test/visit-requests.e2e-spec.ts
PASS test/domain.e2e-spec.ts
PASS test/properties.e2e-spec.ts
PASS test/property-reports.e2e-spec.ts
PASS test/saved-properties.e2e-spec.ts
PASS test/health.e2e-spec.ts
PASS test/categories.e2e-spec.ts

Test Suites: 9 passed, 9 total
Tests:       63 passed, 63 total
Snapshots:   0 total
Time:        17.449 s
Ran all test suites.
```

---

## 4. TypeScript Typecheck Verification

Execution Command:
```bash
npm run typecheck:api && npm run typecheck:web
```

Terminal Output Evidence:
```text
> apna-ghar@0.1.0 typecheck:api
> npx tsc --noEmit -p apps/api/tsconfig.json

> apna-ghar@0.1.0 typecheck:web
> npx tsc --noEmit -p apps/web/tsconfig.json

Process exited with code 0 (0 errors).
```

---

## 5. Production Build Verification

Execution Command:
```bash
npm run build
# npm run build:api && npm run build:web
```

Terminal Output Evidence:
```text
> apna-ghar@0.1.0 build:api
> nest build
> node scripts/ensure-entrypoint.js
✓ NestJS API production bundle created successfully.

> apna-ghar@0.1.0 build:web
> next build
▲ Next.js 16.4.6 (Turbopack)
✓ Compiled successfully in 1715ms
✓ Generating static pages using 11 workers (26/26) in 1032ms
Finalizing page optimization ...
Route (app)                                      Revalidate  Expire
┌ ○ /
├ ○ /_not-found
├ ƒ /[slug]
├ ○ /about
├ ○ /admin
├ ƒ /admin/[section]
├ ○ /admin/audit-logs
├ ○ /admin/categories
├ ○ /admin/listings
├ ○ /admin/reports
├ ○ /admin/users
├ ƒ /api/v1/admin/[...path]
├ ƒ /api/v1/categories
├ ƒ /api/v1/conversations
├ ƒ /api/v1/conversations/property/[propertyId]
├ ƒ /api/v1/conversations/upload
├ ƒ /api/v1/health
├ ƒ /api/v1/properties
├ ƒ /api/v1/property-reports
├ ƒ /api/v1/property-reports/[reportId]/status
├ ○ /appearance
├ ○ /forgot-password
├ ○ /icon.svg
├ ○ /list-property
├ ƒ /messages
├ ○ /my-listings
├ ○ /profile
├ ƒ /property/[id]
├ ○ /robots.txt
├ ○ /saved
├ ƒ /search
├ ○ /services
├ ƒ /sign-in/[[...sign-in]]
├ ƒ /sign-up/[[...sign-up]]
└ ○ /sitemap.xml                                         1h      1y
```
