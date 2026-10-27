# API Contract and Permissions

Base `/api/v1`, HTTPS, server validation, consistent errors, request IDs, pagination and rate limits.

## Public endpoints
- GET /config/client
- GET /categories
- GET /properties with query, city, locality, category, price range, sort and cursor
- GET /properties/:slugOrId
- GET /properties/nearby?lat=&lng=&radiusKm=

## Authenticated user
- GET/PATCH /me
- POST /properties
- PATCH/DELETE /properties/:id (owner only)
- GET /me/properties
- GET /me/favorites
- PUT/DELETE /me/favorites/:propertyId
- POST /properties/:id/reports
- POST /media/upload-url
- POST /media/complete
- GET /me/entitlements
- GET /plans

## Admin-only
- GET /admin/overview
- GET /admin/users and PATCH /admin/users/:id/status
- GET /admin/properties and PATCH /admin/properties/:id/status
- GET /admin/reports and PATCH /admin/reports/:id
- CRUD /admin/categories
- CRUD /admin/features
- CRUD /admin/plans
- PUT /admin/plans/:id/entitlements
- POST /admin/users/:id/assign-plan
- GET /admin/config and PATCH /admin/config/:key
- GET /admin/audit-logs
- GET /admin/exports/users

## Authorization rules
Verify Clerk tokens in backend. Resolve role from application database, not client payload or untrusted public metadata. Check owner permission for each property/media operation. Admin routes require server-side role checks. Enforce plan features/limits on the API. Audit sensitive admin changes and exports.
