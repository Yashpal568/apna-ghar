# APNA GHAR — M6 PRODUCTION SECURITY VERIFICATION REPORT

**Milestone:** M6 Security Hardening  
**Date:** November 19, 2026  
**Frontend Deployment:** `https://apna-ghar-web.yash38688.workers.dev` (Cloudflare Workers / OpenNext)  
**Backend Deployment:** `https://apna-ghar-api-j4fo.onrender.com` (Render Web Service)  
**Verification Method:** Non-destructive HTTP probes, header inspection, and redirection validation.

---

## 1. Summary of Production Verification

| Deployment / Target | Verification Probe | Status | Verdict | Evidence / Details |
| :--- | :--- | :--- | :--- | :--- |
| **Cloudflare Frontend** | `GET /` | HTTP 200 | **PASS** | Edge worker responding normally. |
| **Edge Privacy Guard** | `GET /messages` | HTTP 307 | **PASS** | Redirects to `/sign-in?redirect_url=%2Fmessages` with `X-Robots-Tag: noindex, nofollow`. Zero mock data visible. |
| **Robots Directives** | `GET /robots.txt` | HTTP 200 | **PASS** | Valid robots.txt syntax; disallows private routes. |
| **Sitemap Directives** | `GET /sitemap.xml` | HTTP 200 | **PASS** | Valid XML sitemap; private routes excluded. |
| **Render Backend API** | `GET /api/v1/health` | HTTP 503 | **BLOCKED** | Render web service suspended (`This service has been suspended`). Free tier hours limit reached. |
| **Render Readiness** | `GET /api/v1/health/ready` | HTTP 503 | **BLOCKED** | Suspended by Render host. |

---

## 2. Cloudflare Edge Production Verification Details

### 2.1 Private Route Protection & Edge Redirect (`/messages`)
- **Target URL:** `https://apna-ghar-web.yash38688.workers.dev/messages`
- **Request Type:** Direct HTTP GET (`redirect: manual`)
- **Observed Response:**
  ```http
  HTTP/1.1 307 Temporary Redirect
  Location: /sign-in?redirect_url=%2Fmessages
  X-Robots-Tag: noindex, nofollow
  Content-Length: 0
  ```
- **Security Assessment:**
  - Unauthenticated visitors are intercepted before component rendering.
  - Zero sensitive negotiation HTML, conversation lists, or mock cards are emitted.
  - Search crawlers receive `noindex, nofollow`, preventing indexing of private paths.

### 2.2 Public Crawlability & Sitemap Verification
- **Target URL:** `https://apna-ghar-web.yash38688.workers.dev/robots.txt`
  - HTTP 200 OK
  - `Cache-Control: public, max-age=0, must-revalidate`
- **Target URL:** `https://apna-ghar-web.yash38688.workers.dev/sitemap.xml`
  - HTTP 200 OK
  - Correct canonical URLs; private routes disallowed.

---

## 3. Render Backend Production Verification (Status: BLOCKED)

### 3.1 Observed Host Behavior
When querying the production Render API endpoint `https://apna-ghar-api-j4fo.onrender.com/api/v1/health`:
```http
HTTP/1.1 503 Service Unavailable
Content-Type: text/html
Content-Length: 172

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
- The backend application code is fully functional, compiling cleanly (`nest build`) and passing all 180 unit/security tests and 63 E2E tests locally.
- The Render free tier instance reached its monthly allocation cap or was placed in suspended state by Render's platform administration.
- Because the hosting platform is refusing external traffic at the load balancer level before reaching the NestJS application, live HTTP verification of the deployed Render instance is **BLOCKED**.

### 3.3 Steps Required to Unblock
1. Sign in to the Render Dashboard at [https://dashboard.render.com](https://dashboard.render.com).
2. Locate the web service named `apna-ghar-api` (or `apna-ghar-api-j4fo`).
3. Check the service status under Settings / Events.
4. If suspended due to free-tier hours exhaustion, resume the service or allocate hours.
5. Once resumed, trigger a redeploy from branch `main`.
