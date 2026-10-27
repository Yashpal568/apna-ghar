# MongoDB Database Design

Use ObjectId consistently, UTC timestamps, validated request schemas, explicit indexes. Store photos/videos in object storage.

## users
`_id`, `clerkUserId` (unique), `fullName`, optional `phoneE164`, optional `email`, `role` (user/admin), `profileImageUrl`, `accountStatus` (active/restricted/deleted), `createdAt`, `updatedAt`, `lastSeenAt`.

## properties
`_id`, `ownerId`, `title`, `slug`, `description`, `categoryId`, `listingType` (sale), `priceAmount`, `currency` (INR), `location` (state, city, locality, addressText, optional GeoJSON point), `area` (value/unit), `bedrooms`, `bathrooms`, `parkingCount`, `furnishing`, `amenities[]`, `isNegotiable`, `mediaIds[]`, `status` (active/hidden_by_owner/removed_by_admin/deleted), `publishedAt`, timestamps, `deletedAt`. No pending status.

GeoJSON coordinates order is [longitude, latitude]. Use a 2dsphere index for map queries.

## categories
`_id`, `name`, `slug`, `iconKey`, `sortOrder`, `isActive`, timestamps.

## propertyMedia
`_id`, `propertyId`, `ownerId`, `mediaType` (image/video), `objectKey`, `mimeType`, `sizeBytes`, dimensions, optional duration, `sortOrder`, `createdAt`.

## favorites
`_id`, `userId`, `propertyId`, `createdAt`; unique compound index on userId + propertyId.

## listingReports
`_id`, `propertyId`, `reporterId`, `reasonCode`, `details`, `status`, `resolutionNote`, `resolvedBy`, `resolvedAt`, timestamps.

## adminAuditLogs
`_id`, `adminId`, `action`, `entityType`, `entityId`, `reason`, `metadata`, `createdAt`.

## Dynamic subscriptions
- `features`: unique stable `key`, name, description, valueType, defaultValue, isActive, isSystem, timestamps.
- `plans`: name, unique slug, description, isFree, price metadata, billing interval, isActive, isPublic, sortOrder, timestamps.
- `planEntitlements`: planId, featureKey, enabled, limits, config; unique compound index planId + featureKey.
- `userSubscriptions`: userId, planId, status, source, startsAt, endsAt, timestamps.
- `appConfig`: unique key, value, version, isActive, updatedBy, updatedAt. Never store secrets here.

## Indexes
Unique users.clerkUserId; properties status+publishedAt; categoryId+status+publishedAt; ownerId+createdAt; location.point 2dsphere; category slug; feature key; plan slug; planId+featureKey; userId+propertyId favorites; report status+createdAt.
