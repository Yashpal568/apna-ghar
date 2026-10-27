# Figma UI Source of Truth — Apna Ghar

## Authority and fidelity rule

The user-approved Figma source file and its PDF export are the primary visual specification. Google Stitch HTML files are secondary references only and must not replace or redefine the approved Figma screens.

Do not redesign, modernize, paraphrase, or invent alternate visual patterns where a Figma screen already exists. Implement its hierarchy, layout, spacing, typography, colour, components, labels, navigation and responsive behaviour. If an exact asset or screen detail cannot be recovered, record the gap and ask for/retrieve the original asset rather than silently substituting a new design.

The current web implementation is a starter design pass and is NOT yet confirmed pixel-identical to the Figma export.

## Locked design tokens from the PDF

- Palette names: Light Classic, Midnight Navy, Graphite, Forest Dark, AMOLED Black; plus System default behaviour.
- Brand blue: #2563EB.
- Brand green: #10B981.
- Light canvas: #F5F7FB; surface #FFFFFF; elevated #EEF2F7; primary text #142238; secondary text #65748B; border #DFE6EE.
- Midnight Navy: canvas #0B1424; surface #142138; elevated #1C2D48; primary text #F3F6FD; secondary text #A9B8CF; border #293B56.
- Graphite: canvas #191B20; surface #24272E; elevated #30343D; primary text #F4F5F7; secondary text #B3BAC7; border #3B414D.
- Forest Dark: canvas #0C1B17; surface #152C25; elevated #1D3B31; primary text #F0F8F4; secondary text #A3C0B4; border #2B4A3D.
- AMOLED Black: canvas #000000; surface #0B0B0D; elevated #19191D; primary text #F8F8FA; secondary text #B3B3BF; border #29292E.
- Dark theme small action text: #82ACFF; status text: #59D8AF. Filled primary buttons remain brand blue with white labels.
- Typography: Manrope for display/headings; Inter for body, controls and metadata.
- Spacing: 4 px base grid. Mobile gutter 20 px; desktop gutter 80 px; minimum control height 44 px.
- Responsive intent: 390 px mobile and 1440 px desktop reference widths; listing grid adapts from 1 to 3 columns.

## Screens found in the 18-page PDF export

1–5. Mobile Home, one page per theme.
6. Mobile Search/results.
7. Mobile Property Details.
8. Saved homes.
9. Schedule a visit.
10. Profile overview.
11. Desktop marketing homepage — primary landing-page reference.
12. Desktop search results.
13. Desktop property details.
14. Alternate desktop landing page concept. Do not combine both concepts arbitrarily; use page 11 as primary unless the owner explicitly chooses page 14.
15. Admin dashboard.
16. Admin listing management. Adapt the manual review queue to the agreed business rule: valid listings publish immediately by default; manual moderation is for flagged or policy-violating listings.
17. Theme selector.
18. Design system and component recipes.

## Known gaps to implement using the existing Figma system

- Dedicated sign-in, sign-up and password recovery screens.
- Complete profile editing.
- Multi-step create/edit property listing flow and owner listing management.
- Owner enquiries and visit lifecycle screens.
- Notification inbox.
- Full admin users, reports, plans and settings screens.
- Subscription plan, renewal and expiry states. Payment checkout remains disabled in initial launch.
- Exact approved logo asset must be used. If the original approved asset is not in the repo, keep the explicit placeholder; never replace it with a generic monogram or invented mark.

## Acceptance checklist for each screen

- [ ] Match the correct Figma frame, not a Stitch alternative.
- [ ] Use approved logo and actual supplied image assets where available.
- [ ] Match content hierarchy, copy, typography, sizes, spacing, borders, radius and shadows.
- [ ] Verify all five themes and System default.
- [ ] Verify reference viewport and responsive breakpoints.
- [ ] Wire interactions to real APIs only when those APIs exist; otherwise label the state honestly.
- [ ] Capture screenshots at reference viewport and compare with the Figma PDF before marking the screen complete.
- [ ] Never claim pixel-perfect fidelity without screenshot comparison.
