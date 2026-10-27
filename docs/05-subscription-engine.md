# Dynamic Subscription Engine

## Launch behavior
Everyone receives the Free plan. No checkout/payment collection is active in MVP. The plan, feature and entitlement management layer is implemented now.

## Admin functions
Create/edit/deactivate plans; define feature keys; set enabled/disabled and limits per plan; assign users to plans for support/testing; view plan-feature matrix; audit all changes; keep payment activation globally disabled until a later release.

## Runtime
Backend resolves user subscription -> plan -> entitlements and returns a sanitized capability map. The UI can show locked features, but the API is the security boundary. Configuration changes should take effect without an app release for features already implemented, using versioning/cache invalidation. Admin configuration cannot create executable functionality that has not been coded.

Future-only entities may include promotion orders, property promotions, builder organizations, organization members and invoices. Defer payment integration until requested.
