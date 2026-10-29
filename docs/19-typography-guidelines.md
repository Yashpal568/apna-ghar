# Apna Ghar Typography Guidelines

## Purpose

Use one consistent, readable typography system across the Apna Ghar web experience and the planned React Native app. Typography must support property discovery, listing details, forms, account pages, broker/seller flows, and the admin experience.

## Approved font system

Use Google Fonts for the web application:

- **Inter** — primary body/UI font for paragraphs, labels, forms, navigation, property metadata, tables, and buttons.
- **Plus Jakarta Sans** — heading/display font for page titles, section headings, and brand wordmarks.
- **Material Symbols Outlined** — icons only; never use it as a text font.

This keeps the product to two text families, in line with the design rule of using no more than two fonts. Do not introduce Roboto, Montserrat, Proxima Nova, or Manrope as additional web text families. SF Pro is an Apple platform font, not a Google Font, so it is not the web font source.

### Google Fonts import

The web stylesheet loads Inter and Plus Jakarta Sans from Google Fonts. If the external font request fails, the CSS fallback stack must preserve legibility.

## Type scale and readability

- Body text: **16px**, line-height **1.55** (approximately 24.8px).
- Small supporting text: 14px minimum for normal, important content where layout allows.
- Form labels and metadata: aim for 14px; avoid making essential text tiny.
- Page title: typically 32–40px desktop and 28–34px mobile.
- Section heading: typically 22–28px desktop and 20–24px mobile.
- Card title: typically 18–22px, depending on hierarchy.
- Buttons and inputs: 16px by default; keep interactive targets comfortably sized.
- Use font weights 400, 500, 600, 700, and 800 only where the font file supports them.
- Prefer normal sentence case. Reserve all-caps for short, low-priority badges only.
- Use a restrained hierarchy: size, weight, and spacing should communicate priority without excessive letter spacing.

## Responsive and accessibility rules

- Use fluid sizing or responsive breakpoints for display headings; body text must remain comfortable on narrow screens.
- Keep body line-height between 1.5 and 1.6.
- Do not communicate status through font weight or color alone.
- Maintain sufficient text/background contrast in all supported themes.
- Preserve visible keyboard focus, text zoom, and natural wrapping for long addresses, prices, and property titles.
- Avoid clipping user-generated property titles, addresses, broker names, and form errors.
- Use the same hierarchy in light and dark themes; change color tokens, not typography semantics.

## Mobile app rule

The React Native Community CLI app is currently a foundation shell and remains behind the approved web-first delivery sequence. When the mobile UI phase starts, use the same semantic type scale and weights. To use Google Fonts in native builds, bundle licensed Inter/Plus Jakarta Sans font files in the app and configure React Native font assets; a Google Fonts CSS import only works on the web and does not load fonts into native Text components. Use platform system fallbacks until bundled font assets are added. Do not add Expo-only font packages to this Community CLI project.

## Implementation

- Web source: `apps/web/src/app/globals.css`
- Shared color/spacing tokens: `styles/design-tokens.css`
- This guide: `docs/19-typography-guidelines.md`

When adding a new page or component, inherit the body font by default. Use the heading font only for semantic headings and approved brand text. Avoid component-level font-family overrides unless the component is a dedicated icon font.
