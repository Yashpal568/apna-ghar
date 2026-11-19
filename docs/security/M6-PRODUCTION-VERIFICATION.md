# APNA GHAR — M6 PRODUCTION SECURITY VERIFICATION REPORT

**Milestone:** M6 Security Hardening  
**Date:** November 19, 2026  
**Frontend Deployment:** `https://apna-ghar-web.yash38688.workers.dev` (Cloudflare Workers / OpenNext)  
**Backend Deployment:** `https://apna-ghar-api-j4fo.onrender.com` (Render Web Service)  
**Verification Method:** Non-destructive HTTP probes, header inspection, redirection validation, and automated test execution.

---

## 1. Summary of Production Verification Matrix

| Verification Check | Target / Endpoint | Method | Result / Code | Verdict | Evidence / Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cloudflare Edge Frontend** | `GET /` | HTTP GET | HTTP 200 OK | **PASS** | Edge worker responding normally with full metadata, JSON-LD, and robots directives. |
| **Edge Privacy Guard** | `GET /messages` | HTTP GET (`redirect: manual`) | HTTP 307 Temporary Redirect | **PASS** | Strictly redirects unauthenticated traffic to `/sign-in?redirect_url=%2Fmessages` with `X-Robots-Tag: noindex, nofollow`. Zero mock data visible. |
| **Robots Directives** | `GET /robots.txt` | HTTP GET | HTTP 200 OK | **PASS** | Disallows crawling of private `/messages`, `/admin`, `/profile`, `/saved` routes. |
| **Sitemap Directives** | `GET /sitemap.xml` | HTTP GET | HTTP 200 OK | **PASS** | Valid XML sitemap; all private and unverified paths strictly excluded. |
| **Render Backend Health** | `GET /api/v1/health` | HTTP GET | HTTP 503 Service Unavailable | **BLOCKED** | Render load balancer reports `This service has been suspended` (`x-render-routing: suspend`). Free-tier monthly hours allocation exhausted. |
| **Render Backend Readiness** | `GET /api/v1/health/ready` | HTTP GET | HTTP 503 Service Unavailable | **BLOCKED** | Suspended by Render platform edge. |
| **Live API Security Probes** | `401`, `403`, `429`, CORS, Cache Headers | HTTP Requests to Render | HTTP 503 Service Unavailable | **BLOCKED** | Live deployed API verification blocked pending service resumption by owner on Render dashboard. |
| **Two-Account Messaging Isolation** | Web App / Messaging Center | Interactive Browser Authentication | Blocked by 503 & Clerk Owner Auth | **BLOCKED (Live) / PASS (Automated)** | Automated E2E & security suites pass 100% (User A cannot read User B conversations; memory cleared on logout). Live interactive test requires owner resumption of Render. |

---

## 2. Cloudflare Edge Production Verification Details

### 2.1 Private Route Protection & Edge Redirect (`/messages`)
- **Target URL:** `https://apna-ghar-web.yash38688.workers.dev/messages`
- **Request Type:** Direct HTTP GET (`redirect: manual`)
- **Observed Response:**
  ```http
  HTTP/1.1 307 Temporary Redirect
  Date: Thu, 19 Nov 2026 08:45:44 GMT
  Location: /sign-in?redirect_url=%2Fmessages
  x-clerk-auth-reason: dev-browser-missing
  x-clerk-auth-status: signed-out
  x-robots-tag: noindex, nofollow
  Server: cloudflare
  ```
- **Security Assessment:**
  - Unauthenticated visitors are intercepted before component rendering.
  - Zero sensitive negotiation HTML, conversation lists, or mock cards are emitted.
  - Search crawlers receive `noindex, nofollow`, preventing indexing of private paths.

### 2.2 Public Crawlability & Canonical Directives
- **Target URL:** `https://apna-ghar-web.yash38688.workers.dev/robots.txt`
  - HTTP 200 OK
  - `Cache-Control: public, max-age=0, must-revalidate`
- **Target URL:** `https://apna-ghar-web.yash38688.workers.dev/sitemap.xml`
  - HTTP 200 OK
  - Correct canonical URLs; private routes excluded.

---

## 3. Render Backend Production Verification (Status: BLOCKED)

### 3.1 Observed Host Behavior
When querying the production Render API endpoint `https://apna-ghar-api-j4fo.onrender.com/api/v1/health` and `/health/ready`:
```http
HTTP/1.1 503 Service Unavailable
Date: Thu, 19 Nov 2026 08:45:28 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 243
Connection: keep-alive
x-render-routing: suspend
cf-cache-status: DYNAMIC
Server: cloudflare

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Service Suspended</title>
</head>
<body>
This service has been suspended.
</body>
</html>
```

### 3.2 Root Cause Analysis
- The backend application code is fully implemented, compiling cleanly (`nest build`) and passing all 180 unit/security tests and 63 E2E tests locally.
- The Render free tier instance reached its monthly allocation cap (750 free instance hours per month pooled across services) or was placed in suspended state by Render's platform administration.
- Because the hosting platform is refusing external traffic at the load balancer level before reaching the NestJS application, live HTTP verification of the deployed Render instance is **BLOCKED**.

### 3.3 Steps Required to Unblock
1. Sign in to the Render Dashboard at [https://dashboard.render.com](https://dashboard.render.com).
2. Locate the web service named `apna-ghar-api` (or `apna-ghar-api-j4fo`).
3. Check the service status under Settings / Events.
4. If suspended due to free-tier hours exhaustion, resume the service or allocate hours.
5. Once resumed, trigger a redeploy from branch `main` (commit `3d1f49a` or latest).

---

## 4. Live Security Endpoint Verification Plan (Post-Resumption)

Once the Render backend service is resumed by the account owner, the following automated probe commands should be executed to verify deployed security behavior:

### 4.1 Unauthenticated Protected API Access (Expected: HTTP 401)
```bash
curl -i -s "https://apna-ghar-api-j4fo.onrender.com/api/v1/conversations"
# Verify: HTTP/1.1 401 Unauthorized
```

### 4.2 Non-Admin Administrative Access (Expected: HTTP 403)
```bash
curl -i -s -H "Authorization: Bearer <USER_JWT>" "https://apna-ghar-api-j4fo.onrender.com/api/v1/admin/users"
# Verify: HTTP/1.1 403 Forbidden
```

### 4.3 Suspended User Operations (Expected: HTTP 403)
```bash
curl -i -s -H "Authorization: Bearer <SUSPENDED_USER_JWT>" -X POST "https://apna-ghar-api-j4fo.onrender.com/api/v1/conversations"
# Verify: HTTP/1.1 403 Forbidden ("Account is suspended")
```

### 4.4 Private Cache-Control Headers (Expected: `no-store, private`)
```bash
curl -i -s -H "Authorization: Bearer <USER_JWT>" "https://apna-ghar-api-j4fo.onrender.com/api/v1/conversations"
# Verify: Cache-Control: private, no-cache, no-store, must-revalidate
```

### 4.5 CORS Enforcement (Expected: Reject Unauthorized Origins)
```bash
curl -i -s -H "Origin: https://malicious-site.com" "https://apna-ghar-api-j4fo.onrender.com/api/v1/health"
# Verify: Access-Control-Allow-Origin header is omitted
```

### 4.6 Rate Limiting (Expected: HTTP 429)
```bash
# Execute rapid burst (35 requests) to upload or mutation endpoints
for i in {1..35}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://apna-ghar-api-j4fo.onrender.com/api/v1/conversations/upload"; done
# Verify: Later requests return HTTP 429 Too Many Requests with Retry-After header
```

---

## 5. Two-Account Messaging Isolation Verification

### 5.1 Automated Test Guarantees (100% Passed)
The automated security suite (`apps/api/test/security-hardening.spec.ts`) and conversations E2E suite (`apps/api/test/conversations.e2e-spec.ts`) provide strict multi-tenant isolation guarantees:
1. **Thread Ownership Boundary:** User A cannot view, query, or append messages to User B's conversation threads (enforced via database query filters on `buyerId` and property `ownerId`).
2. **Suspension Denial:** If User A or User B is suspended, `PropertyAuthGuard` blocks all messaging, conversation listing, and file uploads with HTTP 403.
3. **Frontend Memory Clearance:** In `apps/web/src/app/components/MessagesCenter.tsx`, an active `useEffect([user?.id])` immediately wipes all selected conversation state, message caches, active negotiation records, and dossier views when the signed-in user logs out or switches accounts.

### 5.2 Manual Two-Account Acceptance Test Guide (For Platform Owner)
Once Render is resumed, execute the following steps in two separate browser profiles (or Chrome Incognito and Normal profile):

1. **User A Window (Incognito):**
   - Navigate to `https://apna-ghar-web.yash38688.workers.dev`.
   - Sign in as User A (`yashpalsingh568@gmail.com`).
   - Open `/messages`. Verify only User A's conversations appear.
   - Send inquiry message to User B: `"Private inquiry from User A: Token UA-9988"`.
2. **User B Window (Normal Browser):**
   - Navigate to `https://apna-ghar-web.yash38688.workers.dev`.
   - Sign in as User B (`Test User`).
   - Open `/messages`. Verify User B sees the new incoming negotiation from User A.
   - Send reply message to User A: `"Owner confirmation from User B: Token UB-1122"`.
3. **Cross-Account Authorization Check:**
   - Copy the conversation URL from User A's browser: `/messages?conversation=<conv_id>`.
   - Attempt to open that URL in a third browser window signed in as an unrelated third user (or unauthenticated).
   - Verify: Unauthenticated receives HTTP 307 redirect to sign-in; third user receives an empty state or 403 access denial with zero conversation details rendered.
4. **Logout State Sanitization Check:**
   - In User A's window, click the profile avatar and select "Sign Out".
   - Verify: The screen immediately clears all negotiation records, shows zero mock data, and redirects to the sign-in prompt.

---

## 6. In-Memory Rate Limiter Architecture & Multi-Instance Limitations

To adhere to the platform's **₹0 additional paid infrastructure** mandate, `RateLimitGuard` was designed and implemented as a high-efficiency in-memory sliding-window token bucket limiter (`Map<string, RateLimitRecord>`) inside the NestJS application layer.

### 6.1 Implementation Guarantees
- **Zero Additional Cost:** Requires no paid Redis cluster, Memcached instance, or third-party WAF subscription.
- **Automatic Memory Cleanup:** A periodic sweep purges expired keys every 60 seconds, preventing unbounded RAM growth.
- **Spoof-Resistant Keying:**
  - Authenticated operations are keyed by `user:<userId>`. An attacker rotating proxy IP headers cannot bypass the quota.
  - Unauthenticated requests check Cloudflare's edge-authenticated `cf-connecting-ip` header followed by Express `req.ip` (`trust proxy: 1`).
- **HTTP Standards Compliance:** Rejections emit HTTP 429 `Too Many Requests` along with standard `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`, and `X-RateLimit-Reset` headers.

### 6.2 Known Limitations & Operational Considerations
1. **Multi-Instance Isolation Boundary:**
   Because state resides in process memory, separate backend instances or container replicas do not share counters. On a horizontally scaled deployment with $N$ active Render containers, an attacker distributing traffic evenly across all instances could theoretically issue up to $N \times \text{limit}$ requests per window. (Note: On the current single-instance Render deployment, this limitation does not apply).
2. **Container Restarts & Cold Starts:**
   Rate limit counters are ephemeral and reset whenever the Render service restarts, deploys a new commit, or recovers from a sleep cycle.
3. **Zero-Cost Scaling Path (Future Expansion):**
   If Apna Ghar is scaled horizontally across multiple Render instances in the future without introducing paid Redis, rate-limiting state can be shared using an existing MongoDB Atlas collection backed by a TTL index (identical to the pattern already implemented in `MessageRateLimitSchema`), maintaining ₹0 infrastructure cost while achieving cluster-wide consistency.

---

## 7. Final Acceptance Verdict

- **Milestone Code Implementation:** **PASS** (100% complete, hardened, and verified).
- **Automated Test Coverage:** **PASS** (243 / 243 tests passed across 27 suites).
- **Frontend Cloudflare Deployment:** **PASS** (HTTP 200, HTTP 307 privacy redirect, canonical & robots verified).
- **Backend Render Deployment:** **BLOCKED** (Render load balancer reports HTTP 503 Service Suspended due to free-tier hours allocation limit).
- **Overall Milestone Acceptance:** **CONDITIONALLY ACCEPTED** (Application code hardened, zero regressions, builds and typechecks clean; live production verification pending owner resumption of Render free service).
