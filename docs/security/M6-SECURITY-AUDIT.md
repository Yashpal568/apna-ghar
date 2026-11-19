# APNA GHAR — M6 SECURITY HARDENING AUDIT REPORT

**Milestone:** M6 Security Hardening  
**Date:** November 19, 2026  
**Repository:** `https://github.com/Yashpal568/apna-ghar`  
**Branch:** `main`  
**Application Stack:** Next.js 14 / React 18, NestJS 10, MongoDB Atlas / Mongoose 8, Clerk Development Instance, Cloudinary, Cloudflare Workers / OpenNext, Render Backend.

---

## 1. Executive Summary & Objective

The objective of milestone **M6: Complete Security Hardening** is to conduct an end-to-end security architecture audit, identify potential threat vectors across client, API, and database boundaries, implement defense-in-depth security mitigations without introducing paid services (₹0 infrastructure budget), and establish a comprehensive automated security test suite.

The security hardening encompassed eight core domains:
1. **Server-Side Authentication & Session Verification** (Strict token validation, failure-mode analysis).
2. **Role-Based Authorization & Insecure Direct Object Reference (IDOR) Prevention** (Strict ownership validation, user role immutability).
3. **Messaging Privacy & Multi-Tenant Isolation** (Re-audit of the earlier incident, strict participant query scoping, zero mock data).
4. **Input Validation, DTO Whitelisting & Anti-NoSQL Injection** (Strict class-validator pipes, regex escaping, ObjectId enforcement).
5. **Rate Limiting & Abuse Protection** (Zero-cost application-level rate limiter with IP and user tiering).
6. **File Upload & Cloudinary Asset Security** (Magic byte MIME inspection, path traversal sanitization, size limits).
7. **HTTP Headers, CORS Hardening & Cache Isolation** (Strict CORS allowlist without wildcards, HSTS, frame protection, private Cache-Control headers).
8. **Secrets Management & Audit Log Immutability** (Zero hardcoded secrets, append-only MongoDB audit logs).

---

## 2. Architecture & Threat Model

```
               [ Internet / External Clients ]
                            │
               HTTPS / TLS 1.3 Termination
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    [ Cloudflare Worker Edge ]    [ Render API Gateway ]
    (Next.js 14 / OpenNext)       (NestJS / Express)
              │                           │
    - Edge Middleware Auth        - Express trust proxy (hop 1)
    - 307 Redirect on Unauth      - Strict CORS Allowlist
    - Private Route Matcher       - Global RateLimitGuard
    - Security Headers (HSTS,     - PrivateCacheInterceptor
      noindex on redirects)       - Global ValidationPipe (whitelist)
              │                   - HttpExceptionFilter (no stack leak)
              │                           │
              └─────────────┬─────────────┘
                            │
                 Protected Internal Services
              ┌─────────────┴─────────────┐
              ▼                           ▼
     [ MongoDB Atlas (Mongoose) ]   [ Clerk & Cloudinary ]
     - Participant Scoped Queries   - Token Cryptographic Verify
     - Compound Unique Constraints  - Signed Upload Presets
     - Immutable Audit Logs         - Server-Side Identity Sync
```

### Threat Actors & Attack Vectors Evaluated:
1. **Unauthenticated Scrapers & Crawlers:** Attempting to enumerate listing IDs, download private negotiations, or abuse public search endpoints.
2. **Authenticated Malicious Users (Cross-Tenant Access / IDOR):** Attempting to modify other users' property listings, access negotiations they are not part of, respond to offers sent to others, or view private documents.
3. **Suspended Accounts:** Users suspended by administrators attempting to continue posting listings, sending messages, or creating offers.
4. **Cross-Origin Attackers (CORS Exploitation):** Malicious third parties hosting websites on free cloud subdomains (`*.workers.dev`, `*.vercel.app`) attempting to issue credentialed cross-origin requests to read private user data.
5. **File Upload Attackers:** Uploading executable scripts, HTML/SVG XSS payloads disguised as images or PDFs.
6. **Query & ReDoS Attackers:** Injecting unescaped regex characters or MongoDB operator payloads into search and filter fields.

---

## 3. Security Hardening Domains & Implementation

### 3.1 Authentication & Identity Verification
- **Token Verification:** All protected routes require a valid Clerk session Bearer token. Tokens are cryptographically validated server-side using `@clerk/backend` `verifyToken` with `CLERK_SECRET_KEY`.
- **Fail-Closed Design:** If `CLERK_SECRET_KEY` is missing or invalid, endpoints reject requests with `401 Unauthorized` ('Authentication is not configured').
- **Token Subject Enforcement:** Tokens lacking a valid `sub` claim are rejected immediately.
- **Frontend Edge Middleware:** In `apps/web/src/middleware.ts`, `isProtectedRoute` enforces server-side authentication for `/my-listings(.*)`, `/list-property(.*)`, `/admin(.*)`, and `/messages(.*)`. Unauthenticated visitors receive an immediate HTTP 307 redirect with `X-Robots-Tag: noindex, nofollow`.

### 3.2 Authorization, IDOR & Suspended Account Enforcement
- **Resource Ownership Scoping:**
  - Property updates (`PATCH /properties/:id`) and deletions (`DELETE /properties/:id`) enforce `{ _id: identifier, ownerId: request.authUserId, deletedAt: null }`. Non-owners receive HTTP 404 (non-disclosing).
  - Saved properties (`/saved-properties`) strictly uses `userId` from the verified token.
  - Visit requests (`/visit-requests`) and reports (`/property-reports`) isolate user inquiries.
- **Role Immutability:** In `users.service.ts`, `saveMyProfile` strictly allows updating only `name`, `email`, `phone`, `city`, `about`, `imageUrl`. Fields such as `role` and `accountStatus` are never accepted from request payloads.
- **Suspension Enforcement:** `PropertyAuthGuard` queries the database for the user's `accountStatus`. If the account is marked `suspended`, the guard throws `403 Forbidden` ('Your account has been suspended by an administrator.'). This guard is applied across property management, visit requests, reports, and conversations.

### 3.3 Messaging Privacy & Multi-Tenant Isolation
- **Re-Audit of SEC-2026-11-14-MESSAGING-PRIVACY:**
  - The earlier incident where prototype demo state was visible to unauthenticated visitors was completely resolved.
  - All mock data arrays (`DEFAULT_CONVERSATIONS`) were removed from the codebase.
  - Edge middleware redirects unauthenticated requests with HTTP 307.
- **Backend Query Scoping:**
  - `GET /conversations`: Scoped strictly to `{ participantIds: request.auth.userId }`.
  - `GET /conversations/:id`: Scoped strictly to `{ _id: id, participantIds: request.auth.userId }`.
  - `GET /conversations/:id/messages`: Scoped strictly to conversation participants. Non-participants receive 404.
  - `POST /conversations/:id/messages`: Scoped to `{ _id: id, participantIds: request.auth.userId }`.
  - `POST /conversations/:id/offers`: Enforces that only the buyer can initiate the offer, and owner can counter.
  - `PATCH /conversations/:id/offers/:offerId/respond`: Verifies `recipientId === request.auth.userId`.
- **Client-Side Account Switching Reset:** In `MessagesCenter.tsx`, an explicit React effect monitors `user?.id`. Upon account change or logout, `items`, `messages`, `selected`, `propertyInfo`, and drafts are immediately wiped from memory.

### 3.4 Input Validation, DTO Whitelisting & Anti-NoSQL Injection
- **Global Validation Pipe:** Configured with:
  - `whitelist: true` (strips all non-whitelisted properties).
  - `forbidNonWhitelisted: true` (rejects requests containing unrecognized properties with HTTP 400).
  - `forbidUnknownValues: true` (rejects malformed payloads).
  - `transform: true` (transforms incoming data to strongly-typed DTO instances).
- **Anti-NoSQL Injection / ReDoS Protection:** In `PropertiesService`, `AdminService`, and search filters, all user-supplied search queries pass through `escapeRegex` (`value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`), completely neutralizing regex operator injection.
- **Identifier Validation:** Route parameters (`/properties/:id`, `/conversations/:id`, `/offers/:offerId`) are validated using `isObjectId` / `mongoose.isValidObjectId`. Malformed IDs fail closed with 404 or 400 without executing raw database queries.

### 3.5 Rate Limiting & Abuse Protection
- **Zero-Cost Application Rate Limiter:** Implemented `RateLimitGuard` (`apps/api/src/common/guards/rate-limit.guard.ts`) with zero external dependencies (no paid Redis).
- **Endpoint Tiering:**
  - *Sensitive Mutations & Uploads:* 30 requests / minute (`POST /properties/images`, `POST /properties/videos`, `POST /conversations/upload`, `POST /properties`, `POST /conversations/:id/messages`, `POST /conversations/:id/offers`, `POST /visit-requests/:id`, `POST /property-reports/:id`).
  - *General Read / Search:* 120 requests / minute (`GET /properties`).
  - *Admin Operations:* 60 requests / minute (`/admin/*`).
- **IP Spoofing Protection:**
  - Express is configured with `express.set('trust proxy', 1)`.
  - Client identifier is prioritized by authenticated user ID (`user:<userId>`), ensuring attackers cannot bypass limits by rotating proxy headers.
  - Unauthenticated requests check Cloudflare's verified `cf-connecting-ip` header followed by Express `req.ip`.
- **Standards-Compliant 429 Response:** Exceeded limits return HTTP 429 `Too Many Requests` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`, and `X-RateLimit-Reset`.

### 3.6 File Upload & Cloudinary Asset Security
- **MIME & Magic Byte Verification:** In `conversations.controller.ts` (`uploadAttachment`) and `properties.controller.ts` (`uploadImage`, `uploadVideo`):
  - In addition to checking declared MIME headers, the raw buffer is inspected for authentic file signatures:
    - JPEG: `0xFF 0xD8 0xFF`
    - PNG: `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
    - WebP: `RIFF....WEBP`
    - PDF: `0x25 0x50 0x44 0x46` (`%PDF`)
    - Video: MP4/MOV `ftyp` box; WebM EBML `0x1A 0x45 0xDF 0xA3`
  - Spoofed payloads (e.g. HTML or scripts claiming to be JPEG/PDF) are rejected with `400 Bad Request`.
- **Path Traversal & Filename Sanitization:** `sanitizeAttachmentFilename` uses `path.basename` and strips all characters except `[a-zA-Z0-9._-]`, truncating to 100 characters.
- **Upload Size Limits:** Hard limits enforced by Multer (`8 MB` for property images, `100 MB` for property videos, `10 MB` for chat attachments).

### 3.7 HTTP Headers, CORS & Session Security
- **Tightened CORS Allowlist:**
  - Removed over-permissive wildcard matches (`endsWith('.workers.dev')` and `endsWith('.vercel.app')`).
  - Restricts access strictly to configured origins, Apna Ghar production domains (`https://apna-ghar-web.yash38688.workers.dev`), verified project preview domains, and localhost for development.
  - Arbitrary third-party domains on Cloudflare Workers or Vercel are rejected.
- **Baseline Browser Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (in production)
- **Private Cache-Control Interceptor:** `PrivateCacheInterceptor` sets `Cache-Control: private, no-cache, no-store, must-revalidate`, `Pragma: no-cache`, and `Expires: 0` on all authenticated endpoints.

### 3.8 Secrets Management & Admin Audit Immutability
- **No Hardcoded Secrets:** No API keys, database credentials, or secret tokens are committed to Git. `.env` files are ignored in `.gitignore`.
- **Error Information Leakage:** `HttpExceptionFilter` logs internal error stacks on the server while returning sanitized `Internal server error` responses to the client.
- **Audit Log Immutability:** `AuditLogSchema` is configured with `timestamps: { createdAt: true, updatedAt: false }`. No update or delete endpoints exist in the API, ensuring tamper-proof audit trails for administrative actions.

### 3.9 In-Memory Rate Limiter Architecture & Multi-Instance Limitations

To adhere to the platform's **₹0 additional paid infrastructure** mandate, `RateLimitGuard` was designed and implemented as a high-efficiency in-memory sliding-window token bucket limiter (`Map<string, RateLimitRecord>`) inside the NestJS application layer.

#### Implementation Guarantees:
- **Zero Additional Cost:** Requires no paid Redis cluster, Memcached instance, or third-party WAF subscription.
- **Automatic Memory Cleanup:** A periodic sweep purges expired keys every 60 seconds, preventing unbounded RAM growth.
- **Spoof-Resistant Keying:**
  - Authenticated operations are keyed by `user:<userId>`. An attacker rotating proxy IP headers cannot bypass the quota.
  - Unauthenticated requests check Cloudflare's edge-authenticated `cf-connecting-ip` header followed by Express `req.ip` (`trust proxy: 1`).
- **HTTP Standards Compliance:** Rejections emit HTTP 429 `Too Many Requests` along with standard `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`, and `X-RateLimit-Reset` headers.

#### Known Limitations & Operational Considerations:
1. **Multi-Instance Isolation Boundary:**
   Because state resides in process memory, separate backend instances or container replicas do not share counters. On a horizontally scaled deployment with $N$ active Render containers, an attacker distributing traffic evenly across all instances could theoretically issue up to $N \times \text{limit}$ requests per window. (Note: On the current single-instance Render deployment, this limitation does not apply).
2. **Container Restarts & Cold Starts:**
   Rate limit counters are ephemeral and reset whenever the Render service restarts, deploys a new commit, or recovers from a sleep cycle.
3. **Zero-Cost Scaling Path (Future Expansion):**
   If Apna Ghar is scaled horizontally across multiple Render instances in the future without introducing paid Redis, rate-limiting state can be shared using an existing MongoDB Atlas collection backed by a TTL index (identical to the pattern already implemented in `MessageRateLimitSchema`), maintaining ₹0 infrastructure cost while achieving cluster-wide consistency.

---

## 4. Summary of Verification Evidence

| Verification Target | Test Tool / Harness | Result | Evidence |
| :--- | :--- | :--- | :--- |
| API Unit & Security Suites | Jest (`npm run test:api`) | **18 / 18 PASS** | 180 tests passed, 0 failed |
| API E2E Integration Suites | Jest (`npm run test:e2e:api`) | **9 / 9 PASS** | 63 tests passed, 0 failed |
| TypeScript Monorepo Check | `tsc --noEmit` | **PASS** | 0 type errors across API and Web |
| Monorepo Production Build | `nest build` + `next build` | **PASS** | Clean build, all 27 web routes optimized |
| Edge Frontend Verification | Direct HTTP Probe | **PASS** | `/messages` returns 307 redirect with `X-Robots-Tag: noindex, nofollow` |
| Render Production API | Direct HTTP Probe | **BLOCKED** | Render instance reports 503 Service Suspended (free tier limit reached) |
