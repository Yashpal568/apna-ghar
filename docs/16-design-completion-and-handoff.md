# Apna Ghar — Design Completion & Handoff Plan

## Status
**Direction selected; completion work not yet implemented.**

- Primary design source: the supplied Figma design (Untitled.fig) and its 18-page PDF export.
- Supporting reference: Google Stitch HTML prototypes and screen suite.
- Decision: do not maintain two competing design systems. Extend the Figma direction and selectively reuse useful Stitch interaction patterns.
- Coding starts after the required screen inventory, theme coverage, logo usage, and key interaction states are reviewed.

## Confirmed implementation decisions
- Complete the missing design screens before coding.
- Design subscription purchase, renewal, and expiry flows now, but keep paid checkout disabled for the initial launch.
- Authentication supports email/password and Google sign-in.
- Five themes: Light Classic, Midnight Navy, Graphite, Forest Dark, AMOLED Black; include System default as a preference that follows the device setting.
- Use the exact approved Apna Ghar logo asset. Do not use a generic AG monogram or invent a substitute.
- Listings that pass validation publish immediately by default; do not add mandatory manual approval as a default publishing step.
- Existing product stack decision: React Native Community CLI mobile app, Next.js website/admin, NestJS TypeScript backend, MongoDB, Clerk authentication.

## Design inventory — existing coverage from the 18-page PDF
| Screen / area | Evidence | Assessment |
|---|---|---|
| Mobile Home, five theme examples | Pages 1–5 | Present |
| Mobile Search / results | Page 6 | Present |
| Mobile Property Details | Page 7 | Present |
| Saved homes | Page 8 | Present |
| Schedule a visit | Page 9 | Present |
| Profile overview | Page 10 | Partial; edit/profile subflows not shown |
| Website landing page | Page 11 and alternate concept on page 14 | Present; select one final desktop direction |
| Website search results | Page 12 | Present |
| Website property details | Page 13 | Present |
| Admin overview/dashboard | Page 15 | Present |
| Admin listing management | Page 16 | Partial; moderation queue in mockup must not override auto-publish product rule |
| Theme picker | Page 17 | Present |
| Design tokens/components | Page 18 | Present as specification/recipes; verify editable native components in source file |

A screen mentioned in copy or a navigation label is not proof that its complete flow is designed. Review actual frames and states before marking a flow complete.

## Missing / incomplete screen checklist

### A. Authentication and account access
- [ ] Welcome / sign-in entry
- [ ] Email + password sign-in
- [ ] Create account
- [ ] Google sign-in / account linking states
- [ ] Forgot password
- [ ] Password reset success / failure
- [ ] Email verification / resend verification
- [ ] Invalid credentials, network failure, loading, disabled-submit states
- [ ] Signed-out state when accessing a protected action
- [ ] Sign-out confirmation where appropriate

### B. Profile and settings
- [ ] View profile
- [ ] Edit profile: name and profile photo
- [ ] Email / phone display and verification status
- [ ] Account preferences and language
- [ ] Appearance / theme picker with System default
- [ ] Notification preferences
- [ ] Privacy and safety settings
- [ ] Account deletion request and confirmation
- [ ] Session/sign-out state and helpful error states

### C. Owner experience and property listing lifecycle
- [ ] My listings overview with Draft / Published / Paused / Sold or Rented / Expired states as applicable
- [ ] Create listing wizard with step indicator and save-draft behavior
- [ ] Listing details: category, transaction type, location, price, area, rooms, amenities and ownership details as relevant
- [ ] Upload, reorder, remove and validate photos
- [ ] Preview listing before publishing
- [ ] Validation errors and incomplete form states
- [ ] Publish success state; passing validation publishes immediately by default
- [ ] Edit listing, pause/unpause, mark sold/rented, and delete confirmation
- [ ] Listing performance / enquiry summary if included in MVP
- [ ] Owner enquiry inbox and enquiry detail
- [ ] Visit request list, accept/decline/reschedule/cancel states
- [ ] Report listing / safety report submission and status

### D. Search, saved items and notifications
- [ ] Filter drawer/page and applied-filter chips
- [ ] No results, loading, network error and retry states
- [ ] Save/unsave home feedback
- [ ] Save/edit/delete search alert
- [ ] Compare saved homes, if retained in scope
- [ ] Notifications inbox and read/unread states
- [ ] Deep-link destination when a notification is tapped

### E. Future subscription experience (design now, payments disabled at launch)
- [ ] Plan comparison: Free and future paid tier(s), with configurable features and limits
- [ ] Plan detail / upgrade intent screen
- [ ] Checkout layout marked disabled/not available in initial launch
- [ ] Payment pending, success, failure and retry concepts for the future phase
- [ ] Current plan / entitlement overview
- [ ] Renewal date / expiry date display
- [ ] Upcoming expiry reminder
- [ ] Expired subscription state and renewal CTA
- [ ] Payment history / invoices concept
- [ ] Cancellation / downgrade confirmation concept
- [ ] Grace period / failed renewal state if policy is approved
- [ ] Clear behavior for listings/features after expiry — product policy must be decided before implementation
- [ ] Feature flags/configuration so payment functionality remains disabled until explicitly launched

Do not invent pricing, plan names, quotas, billing terms, grace periods, or expiry consequences in final UI. Use clearly marked design placeholders until product policy is approved.

### F. Admin and operational screens
- [ ] Admin sign-in and access-denied state
- [ ] User list, search, detail and account-status actions
- [ ] Listing list, detail and issue/report context
- [ ] Reports / safety complaints queue
- [ ] Settings and configurable feature/plan entitlements
- [ ] Basic audit trail for sensitive admin actions
- [ ] Empty/loading/error states for dashboard tables and charts
- [ ] Remove any default manual approval step that conflicts with immediate publication of valid listings; moderation should be for reports, policy violations, or explicitly defined exceptions.

## Five-theme coverage requirement
The following representative screens must be reviewed in all five themes, using identical content and layout so the differences are genuinely theme-related:
- [ ] Home / discovery
- [ ] Search results and filters
- [ ] Property details
- [ ] Create/edit listing
- [ ] Authentication forms
- [ ] Profile / appearance
- [ ] My listings / owner dashboard
- [ ] Subscription plans and expiry concepts
- [ ] Admin dashboard and tables

Include default, focus, selected, disabled, loading, empty, error, modal/sheet states where relevant. System default is a behavior option, not a sixth color palette.

## Logo and brand acceptance criteria
- [ ] Use the exact approved blue-and-green house/roof mark and Apna Ghar wordmark.
- [ ] No generic AG monogram or generated replacement.
- [ ] If the original asset is not available in the design workspace, show the explicit placeholder “INSERT APPROVED APNA GHAR LOGO ASSET”.
- [ ] Confirm the logo's contrast on all five themes without changing its geometry.
- [ ] Record final asset filename/format once the approved source asset is supplied.

## Design QA and handoff gates
1. Screen inventory is complete and every required screen has a named frame.
2. Primary user journeys connect: sign-in → browse/search → property details → save/enquiry/visit; sign-in → create listing → preview → publish → manage listing.
3. All forms show validation, loading, success and failure states.
4. Mobile and desktop responsive behavior is specified where applicable.
5. Five-theme coverage is checked for key screens and states.
6. Logo asset is correct and consistent.
7. Fictional property data and demo verification labels are clearly marked as sample content; do not imply regulatory verification.
8. One website landing-page concept is selected from the alternatives in the PDF.
9. Admin moderation concepts align with the auto-publish product rule.
10. Future subscription designs are visibly marked as future-phase; no live payment is enabled for launch.
11. Handoff includes frame names, reusable components, semantic tokens, interaction notes and acceptance criteria.

## Next execution order
1. Audit the editable Figma file against this inventory and name existing frames.
2. Add missing authentication, profile, owner/listing, notification, admin and future-subscription frames.
3. Apply and inspect the five themes on the required representative screens.
4. Run a flow/consistency review; resolve product-policy questions using explicit decisions rather than mockup assumptions.
5. Approve the design handoff.
6. Begin implementation.

## Important status note
This document records the agreed plan. It does not claim that missing frames have already been added to Figma, that the approved logo source asset is present, or that subscription checkout has been implemented.
