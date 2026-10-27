# Apna Ghar — Approved Design Sources

This folder is the canonical location for the approved Figma source and PDF export.

## Required source files

- `Untitled.fig` — editable Figma source (currently in ChatGPT Library; not yet committed here).
- `Untitled.pdf` — 18-page export of the Figma design (currently in ChatGPT Library; not yet committed here).

## Design implementation rules

1. Treat the supplied Figma frames and components as the primary visual source of truth.
2. Use the PDF export as a visual reference when inspecting the Figma file is not convenient.
3. Google Stitch HTML prototypes are supporting references only; do not introduce a competing design system.
4. Preserve the approved brand colors, typography, spacing, component geometry, navigation and five themes.
5. Do not invent or replace the approved Apna Ghar logo. If the approved asset is unavailable, keep the explicit placeholder specified in the handoff.
6. Where a screen is not present in Figma, extend the existing design tokens and component patterns consistently and document the gap.
7. Verify mobile and desktop layouts against the source before calling a screen complete.

## Add the binary design files

From the repository root, copy the original files into this directory, then run:

```powershell
git add docs/design/Untitled.fig docs/design/Untitled.pdf
git commit -m "docs: add approved Figma source and PDF export"
git push origin feat/phase-1-monorepo-foundation
```

Keep the original files unchanged. Do not export/rename a replacement and label it as the original source.
