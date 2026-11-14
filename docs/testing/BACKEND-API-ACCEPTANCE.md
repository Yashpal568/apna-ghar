# Apna Ghar — Complete Backend API Acceptance & Endpoint Matrix

**Repository:** `https://github.com/Yashpal568/apna-ghar`  
**Branch:** `main`  
**API Base URL:** `/api/v1`  
**Auditor:** Senior Full-Stack & API QA Engineer  
**Date:** November 14, 2026  
**Status:** PASS — ALL 50 ENDPOINTS TESTED & ACCEPTED (100% SUCCESS)  

---

## 1. Complete 50-Endpoint Acceptance Matrix

| # | HTTP Method | Path | Controller | Auth / Guard | Request DTO / Query | Response Status | Test Verdict |
|---|---|---|---|---|---|:---:|:---:|
| **Health Module** |
| 1 | `GET` | `/api/v1/health` | HealthController | Public | None | 200 OK | **PASS** |
| 2 | `GET` | `/api/v1/health/ready` | HealthController | Public | None | 200 / 503 | **PASS** |
| **Users Module** |
| 3 | `GET` | `/api/v1/users/me` | UsersController | `ClerkAuthGuard` | None | 200 OK | **PASS** |
| 4 | `GET` | `/api/v1/users/me/profile` | UsersController | `ClerkAuthGuard` | None | 200 OK | **PASS** |
| 5 | `PUT` | `/api/v1/users/me/profile` | UsersController | `ClerkAuthGuard` | `UpdateProfileDto` | 200 OK | **PASS** |
| **Properties Module** |
| 6 | `POST` | `/api/v1/properties/images` | PropertiesController | `PropertyAuthGuard` | `Multipart (file)` | 201 Created | **PASS** |
| 7 | `POST` | `/api/v1/properties/videos` | PropertiesController | `PropertyAuthGuard` | `Multipart (file)` | 201 Created | **PASS** |
| 8 | `POST` | `/api/v1/properties` | PropertiesController | `PropertyAuthGuard` | `CreatePropertyDto` | 201 Created | **PASS** |
| 9 | `GET` | `/api/v1/properties/mine` | PropertiesController | `PropertyAuthGuard` | None | 200 OK | **PASS** |
| 10 | `GET` | `/api/v1/properties/mine/:slugOrId` | PropertiesController | `PropertyAuthGuard` | Param: `slugOrId` | 200 / 404 | **PASS** |
| 11 | `PATCH` | `/api/v1/properties/:id` | PropertiesController | `PropertyAuthGuard` | `UpdatePropertyDto` | 200 / 404 | **PASS** |
| 12 | `PATCH` | `/api/v1/properties/:id/visibility` | PropertiesController | `PropertyAuthGuard` | `{ visible: boolean }` | 200 / 404 | **PASS** |
| 13 | `DELETE` | `/api/v1/properties/:id` | PropertiesController | `PropertyAuthGuard` | Param: `id` | 200 / 404 | **PASS** |
| 14 | `GET` | `/api/v1/properties` | PropertiesController | Public | `ListPropertiesQueryDto` | 200 OK | **PASS** |
| 15 | `GET` | `/api/v1/properties/:slugOrId` | PropertiesController | Public | Param: `slugOrId` | 200 / 404 | **PASS** |
| **Saved Properties Module** |
| 16 | `GET` | `/api/v1/saved-properties` | SavedPropertiesController | `PropertyAuthGuard` | None | 200 OK | **PASS** |
| 17 | `POST` | `/api/v1/saved-properties/sync` | SavedPropertiesController | `PropertyAuthGuard` | `SyncSavedPropertiesDto` | 201 Created | **PASS** |
| 18 | `GET` | `/api/v1/saved-properties/check/:propertyId` | SavedPropertiesController | `PropertyAuthGuard` | Param: `propertyId` | 200 OK | **PASS** |
| 19 | `POST` | `/api/v1/saved-properties/:propertyId` | SavedPropertiesController | `PropertyAuthGuard` | Param: `propertyId` | 201 / 404 | **PASS** |
| 20 | `DELETE` | `/api/v1/saved-properties/:propertyId` | SavedPropertiesController | `PropertyAuthGuard` | Param: `propertyId` | 200 OK | **PASS** |
| **Visit Requests Module** |
| 21 | `GET` | `/api/v1/visit-requests` | VisitRequestsController | `PropertyAuthGuard` | None | 200 OK | **PASS** |
| 22 | `GET` | `/api/v1/visit-requests/received` | VisitRequestsController | `PropertyAuthGuard` | None | 200 OK | **PASS** |
| 23 | `POST` | `/api/v1/visit-requests/:propertyId` | VisitRequestsController | `PropertyAuthGuard` | `CreateVisitRequestDto` | 201 / 400 | **PASS** |
| **Property Reports Module** |
| 24 | `GET` | `/api/v1/property-reports/admin` | PropertyReportsController | `AdminAuthGuard` | Query: `status` | 200 / 403 | **PASS** |
| 25 | `POST` | `/api/v1/property-reports/admin/:reportId/status` | PropertyReportsController | `AdminAuthGuard` | `ModeratePropertyReportDto` | 201 / 403 | **PASS** |
| 26 | `GET` | `/api/v1/property-reports` | PropertyReportsController | `PropertyAuthGuard` | None | 200 OK | **PASS** |
| 27 | `POST` | `/api/v1/property-reports/:propertyId` | PropertyReportsController | `PropertyAuthGuard` | `CreatePropertyReportDto` | 201 / 400 | **PASS** |
| **Conversations & Messaging Module** |
| 28 | `GET` | `/api/v1/conversations` | ConversationsController | `ClerkAuthGuard` | None | 200 OK | **PASS** |
| 29 | `POST` | `/api/v1/conversations/property/:propertyId` | ConversationsController | `ClerkAuthGuard` | `StartConversationDto` | 201 / 400 | **PASS** |
| 30 | `GET` | `/api/v1/conversations/:conversationId` | ConversationsController | `ClerkAuthGuard` | Param: `conversationId` | 200 / 404 | **PASS** |
| 31 | `GET` | `/api/v1/conversations/:conversationId/messages`| ConversationsController | `ClerkAuthGuard` | Query: `before`, `limit` | 200 / 404 | **PASS** |
| 32 | `PATCH` | `/api/v1/conversations/:conversationId/read` | ConversationsController | `ClerkAuthGuard` | Param: `conversationId` | 200 / 404 | **PASS** |
| 33 | `POST` | `/api/v1/conversations/upload` | ConversationsController | `ClerkAuthGuard` | `Multipart (file)` | 201 Created | **PASS** |
| 34 | `POST` | `/api/v1/conversations/:conversationId/messages`| ConversationsController | `ClerkAuthGuard` | `SendMessageDto` | 201 / 400 | **PASS** |
| 35 | `GET` | `/api/v1/conversations/:conversationId/offers` | ConversationsController | `ClerkAuthGuard` | Param: `conversationId` | 200 / 404 | **PASS** |
| 36 | `POST` | `/api/v1/conversations/:conversationId/offers` | ConversationsController | `ClerkAuthGuard` | `CreateOfferDto` | 201 / 403 | **PASS** |
| 37 | `POST` | `/api/v1/conversations/:conversationId/offers/:offerId/counter` | ConversationsController | `ClerkAuthGuard` | `CreateOfferDto` | 201 / 404 | **PASS** |
| 38 | `PATCH` | `/api/v1/conversations/:conversationId/offers/:offerId/respond` | ConversationsController | `ClerkAuthGuard` | `RespondOfferDto` | 200 / 400 | **PASS** |
| **Categories Module** |
| 39 | `GET` | `/api/v1/categories` | CategoriesController | Public | None | 200 OK | **PASS** |
| **Admin Module** |
| 40 | `GET` | `/api/v1/admin/overview` | AdminController | `AdminAuthGuard` | None | 200 / 403 | **PASS** |
| 41 | `GET` | `/api/v1/admin/users` | AdminController | `AdminAuthGuard` | `ListUsersQueryDto` | 200 / 403 | **PASS** |
| 42 | `GET` | `/api/v1/admin/users/:userId` | AdminController | `AdminAuthGuard` | Param: `userId` | 200 / 404 | **PASS** |
| 43 | `POST` | `/api/v1/admin/users/:userId/status` | AdminController | `AdminAuthGuard` | `UpdateUserStatusDto` | 201 / 400 | **PASS** |
| 44 | `GET` | `/api/v1/admin/properties` | AdminController | `AdminAuthGuard` | `ListAdminPropertiesQueryDto` | 200 / 403 | **PASS** |
| 45 | `GET` | `/api/v1/admin/properties/:propertyId` | AdminController | `AdminAuthGuard` | Param: `propertyId` | 200 / 404 | **PASS** |
| 46 | `POST` | `/api/v1/admin/properties/:propertyId/status`| AdminController | `AdminAuthGuard` | `ModeratePropertyStatusDto` | 201 / 400 | **PASS** |
| 47 | `GET` | `/api/v1/admin/categories` | AdminController | `AdminAuthGuard` | None | 200 / 403 | **PASS** |
| 48 | `POST` | `/api/v1/admin/categories/:key/toggle` | AdminController | `AdminAuthGuard` | `ToggleCategoryDto` | 201 / 403 | **PASS** |
| 49 | `PATCH` | `/api/v1/admin/categories/:key` | AdminController | `AdminAuthGuard` | `UpdateCategoryDto` | 200 / 403 | **PASS** |
| 50 | `GET` | `/api/v1/admin/audit-logs` | AdminController | `AdminAuthGuard` | `ListAuditLogsQueryDto` | 200 / 403 | **PASS** |

---

## 2. Test Execution Details by Module

### 2.1 Public Search & Property Endpoints
- **Test File:** `test/properties.e2e-spec.ts`
- **Scenarios Tested:**
  - Valid slug resolution: returns 200 with property payload.
  - Valid MongoDB ObjectId resolution: returns 200 with property payload.
  - Non-existent slug: returns 404 with structured error response.
  - Invalid slug ("undefined", "null", ""): returns 404 immediately without database error.
  - Paginated search query: returns paginated list of properties matching filter criteria.

### 2.2 User Profile & Clerk Sync
- **Test File:** `test/domain.e2e-spec.ts`
- **Scenarios Tested:**
  - Token verification and Clerk user synchronization (`/users/me`).
  - Missing authorization token: rejected with 401 Unauthorized.
  - Profile retrieval from claims and fallback to Clerk backend client.
  - Profile updates (`PUT /users/me/profile`) with DTO validation (email, name, phone, city).

### 2.3 Real-Time Messaging, Offers & IDOR Security
- **Test File:** `test/conversations.e2e-spec.ts`
- **Scenarios Tested:**
  - Listing conversations: only returns threads where `participantIds` includes authenticated caller.
  - Owner self-chat prevention: owner cannot initiate buyer inquiry on own listing (rejected with 400).
  - Multi-tenant IDOR protection: third-party user cannot view or send messages to another user's conversation (rejected with 404).
  - Empty message prevention: rejected with 400 if both text and attachment are empty.
  - Offer role restrictions: only the buyer can initiate initial proposal (owner rejected with 403 Forbidden).
  - Counter-offer workflow: recipient responds with counter-offer; original marked countered.
  - Offer acceptance: updates offer status to `accepted` and timestamps response.

### 2.4 Bookmarks (Saved Properties)
- **Test File:** `test/saved-properties.e2e-spec.ts`
- **Scenarios Tested:**
  - List saved properties: scoped to authenticated user.
  - Sync bookmarks: accepts array of property IDs and upserts.
  - Check isSaved: returns `{ propertyId, isSaved: boolean }`.
  - Add & Remove: manages bookmark state idempotently.
  - Missing token: rejected with 401 Unauthorized.

### 2.5 Walkthroughs (Visit Requests)
- **Test File:** `test/visit-requests.e2e-spec.ts`
- **Scenarios Tested:**
  - List mine: returns visit requests sent by current buyer.
  - List received: returns visit requests received by current owner.
  - Create request: accepts valid `YYYY-MM-DD` and `HH:mm` format.
  - Input validation: invalid time format (e.g. `25:99`) rejected with 400 Bad Request.

### 2.6 Listing Reports & Moderation
- **Test File:** `test/property-reports.e2e-spec.ts`
- **Scenarios Tested:**
  - Submit report: requires valid enum (`misleading`, `scam`, etc.); invalid values rejected with 400.
  - Admin report queue: accessible only to users with admin privileges.
  - Role-based rejection: normal users accessing `/admin` receive 403 Forbidden.
  - Report moderation: admin changes status to `resolved` or `dismissed` with audit notes.

### 2.7 Backoffice Governance (Admin Module)
- **Test File:** `test/admin.e2e-spec.ts`
- **Scenarios Tested:**
  - All 11 backoffice endpoints verified end-to-end.
  - Unauthenticated requests rejected with 401.
  - Non-admin user tokens rejected with 403 Forbidden.
  - User suspension and property moderation persist audit logs.
  - Category toggling and metadata updates.
