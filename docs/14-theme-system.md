# Apna Ghar Theme System

## Product decision
Support **five named themes** across the public Next.js website, admin dashboard, and React Native Community CLI app:
1. **Light** — existing brand baseline; light grey canvas, white surfaces, blue primary, green accent.
2. **Midnight** — deep navy surfaces, cool blue accents, premium feel.
3. **Graphite** — charcoal/neutral dark surfaces, subtle blue and green accents.
4. **Forest** — deep green undertone for a calm, nature-inspired dark appearance.
5. **AMOLED Black** — true-black page background with near-black cards for OLED displays.

These are five choices in total: one light theme and four dark themes.

## Theme behavior
- Add a visible theme picker under Profile → Appearance on mobile and Profile/Settings → Appearance on web/admin.
- Offer **Light**, **Midnight**, **Graphite**, **Forest**, **AMOLED Black**, and **System default** as the selectable choices. System default follows OS preference; explicit selection overrides it.
- Preview each theme with a small swatch and accessible label; don't make users identify themes by color alone.
- Persist the user's explicit choice locally. If signed in, sync the preference to their profile when profile preferences are implemented. Do not block rendering while waiting for the server.
- Prevent a light/dark flash on page load; apply the selected theme before first paint when practical.
- On mobile, theme changes should apply immediately without restarting the app.
- Respect reduced-motion preferences. Keep transitions subtle (about 140–220 ms).
- The selected theme must not alter listing data, image brightness, prices, or seller content.

## Semantic tokens
Use semantic tokens rather than hard-coded colors for page background, card/surface levels, raised surfaces, primary text, secondary text, muted text, borders, inputs, overlay, focus ring, primary action, and green accent. Web tokens live in `styles/design-tokens.css`; mirror the same token names and values in a typed native theme module when the RN app is scaffolded.

## Accessibility and quality
- Target WCAG 2.2 AA contrast: 4.5:1 for normal text, 3:1 for large text and meaningful UI boundaries/icons.
- Focus indicators must remain visible in every theme; never rely on color alone to convey status.
- Keep form fields, dropdowns, sheets, dialogs, toasts, skeletons, empty states, error states, charts, and admin tables theme-aware.
- Property photos and videos must retain their natural colors; don't apply a theme filter to media.
- Ensure status colors remain distinguishable in all themes: success, warning, error, and informational.
- Avoid pure-white text on saturated accent buttons if the chosen accent fails contrast; adjust the token for that theme.
- Test mobile widths, desktop layouts, long Hindi/English labels, and system theme changes.

## Figma/Stitch deliverables
Create a theme comparison page with all five themes shown side by side on the same representative screens: Home/Search, Search Results, Property Detail, Create Listing, Profile/Appearance, Admin Dashboard. Include component states for default, hover/focus, selected, disabled, loading, empty, error, and modal/sheet. Use identical content and layout across themes so color and surface differences can be compared directly.

## Implementation status
The semantic web token CSS supports the five theme attribute values. The current starter UI is not yet a complete theme picker; wire selection/persistence when implementing the settings/profile flows. React Native tokens and runtime switching must be added with the native app scaffold.
