# APNA GHAR — M6 PRODUCTION SECURITY VERIFICATION REPORT

**Milestone:** M6 Security Hardening & Acceptance  
**Date:** November 19, 2026  
**Frontend Deployment:** `https://apna-ghar-web.yash38688.workers.dev` (Cloudflare Workers / OpenNext)  
**Backend Deployment:** `https://apna-ghar-api-w0dk.onrender.com` (Render Web Service)  
**Database Deployment:** MongoDB Atlas Multi-Region Replica Set  
**Verification Method:** Non-destructive HTTP probes, header inspection, redirection validation, real MongoDB integration testing, and automated test execution.

---

## 1. Summary of Production Verification Matrix

| Verification Dimension | Target / Endpoint | Probe Method | HTTP Code / Status | Verdict | Verifiable Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend API Health (Liveness)** | `GET /api/v1/health` | Direct HTTP GET | HTTP 200 OK | **PASS** | `rndr-id` present, `status: "ok"`, `x-ratelimit-limit: 120`. |
| **MongoDB Atlas Readiness** | `GET /api/v1/health/ready` | Direct HTTP GET | HTTP 200 OK | **PASS** | `status: "ready"`, `checks: { "database": "connected" }`. |
| **Public Catalog Data** | `GET /api/v1/categories` | Direct HTTP GET | HTTP 200 OK | **PASS** | Returns all 6 active category documents from MongoDB Atlas. |
| **Unauthenticated API Access** | `GET /api/v1/conversations` | Direct HTTP GET | HTTP 401 Unauthorized | **PASS** | `Bearer token required` enforced by `ClerkAuthGuard`. |
| **Admin Route Protection** | `GET /api/v1/admin/users` | Direct HTTP GET | HTTP 401 Unauthorized | **PASS** | `Bearer token required` enforced by `AdminAuthGuard`. |
| **Upload Authentication** | `POST /api/v1/conversations/upload` | Direct HTTP POST | HTTP 401 Unauthorized | **PASS** | Mutation rate limit 30 applied (`x-ratelimit-remaining: 29`), auth strictly required. |
| **CORS Allowlist Enforcement** | `Origin: https://malicious-site.com` | Preflight / Request | Header Omitted | **PASS** | `access-control-allow-origin` strictly omitted for unauthorized origins. |
| **CORS Authorized Origin** | `Origin: ...workers.dev` | HTTP GET | Header Returned | **PASS** | `access-control-allow-origin: https://apna-ghar-web.yash38688.workers.dev` with `credentials: true`. |
| **Frontend Cloudflare Worker** | `GET /` | Direct HTTP GET | HTTP 200 OK | **PASS** | Edge worker responding normally with full OpenGraph and SEO metadata. |
| **Edge Privacy Guard** | `GET /messages` | Direct HTTP GET | HTTP 307 Redirect | **PASS** | Strictly redirects unauthenticated visitors to `/sign-in` with `X-Robots-Tag: noindex, nofollow`. |
| **Two-Account Messaging Isolation** | MongoDB Integration Suite | Real MongoDB Suite | 37 / 37 passed | **PASS** | Users A & B isolated from User C; cross-account reads/writes/offers denied. |
| **Private Attachment Security** | Attachment Signing & Guards | Real MongoDB Suite | 11 / 11 passed | **PASS** | Signed URL validation, expiry checks, HMAC verification, cross-account denial. |

---

## 2. Live Backend Production Evidence (`apna-ghar-api-w0dk.onrender.com`)

### 2.1 Backend Liveness (`/api/v1/health`)
```http
HTTP/1.1 200 OK
Date: Thu, 19 Nov 2026 09:44:31 GMT
Content-Type: application/json; charset=utf-8
rndr-id: 119c49f3-1155-4b7c
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: DENY
x-ratelimit-limit: 120
x-ratelimit-remaining: 119

{"status":"ok","service":"apna-ghar-api","timestamp":"2026-11-19T09:44:31.252Z"}
```

### 2.2 MongoDB Atlas Readiness (`/api/v1/health/ready`)
```http
HTTP/1.1 200 OK
Date: Thu, 19 Nov 2026 09:44:38 GMT
Content-Type: application/json; charset=utf-8
rndr-id: 5258d0bb-ebd0-4a90

{"status":"ready","service":"apna-ghar-api","checks":{"database":"connected"},"timestamp":"2026-11-19T09:44:38.041Z"}
```

### 2.3 CORS Strict Enforcement
* **Unauthorized Origin Probe:**
  ```bash
  curl.exe -i -s -H "Origin: https://malicious-site.com" "https://apna-ghar-api-w0dk.onrender.com/api/v1/health"
  ```
  **Result:** `access-control-allow-origin` is omitted completely from the HTTP response headers.
* **Authorized Production Origin Probe:**
  ```bash
  curl.exe -i -s -H "Origin: https://apna-ghar-web.yash38688.workers.dev" "https://apna-ghar-api-w0dk.onrender.com/api/v1/health"
  ```
  **Result:**
  ```http
  access-control-allow-origin: https://apna-ghar-web.yash38688.workers.dev
  access-control-allow-credentials: true
  ```

### 2.4 Unauthenticated Mutation & Rate Limiting (`POST /conversations/upload`)
```http
HTTP/1.1 401 Unauthorized
Date: Thu, 19 Nov 2026 10:07:21 GMT
Content-Type: application/json; charset=utf-8
x-ratelimit-limit: 30
x-ratelimit-remaining: 29
x-ratelimit-reset: 1795082902

{"statusCode":401,"message":"Bearer token required","path":"/api/v1/conversations/upload"}
```

---

## 3. Two-Account Messaging Isolation Architecture & Real Verification

The automated integration suite (`apps/api/test/two-account-messaging-isolation.spec.ts`) executed against real MongoDB models with real schemas, real indexes, and three distinct test user identities:
* **User A (`user_a_buyer_111`):** Buyer identity.
* **User B (`user_b_owner_222`):** Owner of Property 1 (`Green Meadows Luxury Villa`).
* **User C (`user_c_stranger_333`):** Owner of Property 2 (`Connaught Place Commercial Suite`).
* **User Suspended (`user_suspended_444`):** Suspended user identity.

### 3.1 Verification Guarantees
1. **Thread Privacy:** Conv 1 contains participant IDs `[User A, User B]`. User C listing conversations receives an empty result and cannot view Conv 1.
2. **IDOR Defense:** User C querying `/conversations/:conv1Id` or `/conversations/:conv1Id/messages` receives `404 Not Found`. User C attempting to POST messages to Conv 1 receives `404 Not Found`.
3. **Offer Manipulation Defense:** User A cannot accept, reject, or counter their own offer. User C cannot accept, reject, or counter User A and User B's offer. Only User B (the recipient) can counter or respond.
4. **Suspension Defense:** A suspended account receives `403 Forbidden` (`Your account has been suspended by an administrator`) from `PropertyAuthGuard` on all write and upload operations.
5. **Memory Clearance on Account Switch:** In `apps/web/src/app/components/MessagesCenter.tsx`, an active `useEffect([user?.id])` immediately wipes all conversations, active threads, messages, and dossier caches when a user signs out or switches accounts.

---

## 4. Private Attachment Security Implementation & Verification

### 4.1 Architecture
1. **Upload Verification:**
   - Files uploaded via `POST /conversations/upload` are validated for magic byte signatures (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF...WEBP` for WebP, `25 50 44 46` for PDF).
   - Filenames are sanitized via `basename()` and character whitelisting to eliminate directory traversal (`../../`).
   - If Cloudinary credentials are configured, assets are uploaded as `type: 'authenticated'` under `apna-ghar/messages/private`, preventing any public access via unauthenticated URLs.
   - Uploads are recorded in `uploaded_attachments` with ownership tied to `uploaderId: request.auth.userId`.
2. **Message Association & Ownership Check:**
   - When `sendMessage` is called, client-supplied attachment IDs or URLs are validated against `uploaded_attachments` owned by the sender.
   - An attacker attempting to supply another user's attachment ID or unverified public ID receives `BadRequestException`.
3. **Cryptographically Signed Delivery:**
   - Conversation messages emit short-lived signed URLs:
     `/api/v1/conversations/:conversationId/messages/:messageId/attachment?expires=<timestamp>&sig=<hmac>`
   - The HMAC-SHA256 signature binds `conversationId`, `messageId`, and `expires` to the server secret.
   - URL tampering, signature forgery, or expired timestamps produce immediate `403 Forbidden` errors.
   - Authorized participants can access attachments using their Bearer token or valid signed URL.
   - Unauthenticated or non-participant access is strictly denied (`401` or `404`).

---

## 5. Automated Test Results Summary

| Suite Category | File | Total Tests | Passed | Failed |
| :--- | :--- | :--- | :--- | :--- |
| **Two-Account Messaging Isolation** | `test/two-account-messaging-isolation.spec.ts` | 37 | **37** | 0 |
| **Security Hardening Acceptance** | `test/security-hardening.spec.ts` | 31 | **31** | 0 |
| **Conversations Controller Unit** | `src/conversations/conversations.controller.spec.ts` | 20 | **20** | 0 |
| **Real MongoDB Integration** | `test/mongodb-integration.spec.ts` | 8 | **8** | 0 |
| **API E2E Integration (9 suites)** | `test/*.e2e-spec.ts` | 63 | **63** | 0 |
| **Remaining API Unit Suites (15 suites)**| `src/**/*.spec.ts` | 121 | **121** | 0 |
| **Total Automated Tests** | **28 test suites** | **280** | **280** | **0** |

---

## 6. Final M6 Verdict: PASS

All core objectives of Milestone M6 have been successfully completed:
1. **Private Attachment Access Control:** Implemented, secured with server-side ownership verification and HMAC signed access, and tested against expired, malformed, and cross-account access attempts.
2. **Two-Account Messaging Isolation:** 37 automated tests passing against real MongoDB validating complete tenant isolation, offer tampering prevention, and account switching state sanitation.
3. **Admin Authorization:** Normal users cannot escalate privileges via crafted bodies; non-admins receive 403; platform admins proceed unimpeded.
4. **Upload Security:** Magic byte inspection, path traversal neutralization, size limits, and spoof-resistant rate limiting all operational.
5. **Production Verification:** Render backend is active and healthy at `https://apna-ghar-api-w0dk.onrender.com` with MongoDB connected and CORS properly configured.
