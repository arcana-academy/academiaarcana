# Academia Arcana — Adobe Creative Layer

## Purpose

Adobe is the project's visual-production layer. It owns the creation and maintenance of brand assets, illustrations, vector artwork, educational documents, PDFs, typography and promotional media.

The Next.js application remains the runtime source of truth. Adobe connector actions available in ChatGPT are not treated as a hidden web-runtime dependency.

## Runtime boundary

The repository exposes a small vendor-neutral Adobe configuration boundary:

- Adobe Fonts kit identifier may be supplied through `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`.
- The kit identifier is public configuration, not a secret.
- No Adobe OAuth token, Creative Cloud credential or connector credential is committed to Git.
- If the kit identifier is absent, the application uses its local/system typography fallbacks and remains fully functional.
- When configured, the root layout loads the Adobe Fonts kit stylesheet from Adobe's official `use.typekit.net` host.

This keeps Adobe optional during local development while making the production configuration explicit.

## Asset contract

Approved visual assets should be organized under:

```text
public/assets/
  brand/
  backgrounds/
  characters/
  grimoires/
  missions/
  achievements/
  sanctuary/
  education/
  icons/
  marketing/
```

Each asset should have a stable semantic filename, documented provenance when externally licensed, and an explicit usage scope.

## Recommended production workflow

1. Create or refine the asset in Adobe.
2. Validate composition, accessibility implications and licensing.
3. Export an optimized web-ready format.
4. Place the approved asset in the corresponding `public/assets` category.
5. Reference the asset from the application through a stable path.
6. Run visual, accessibility and build validation.
7. Commit the asset and its source metadata when the source is intended to be reproducible.

## Typography

The current design system exposes:

- `--aa-typography-body`
- `--aa-typography-heading`

These remain fallback-safe. Adobe Fonts can override them through the published kit without making the application dependent on Adobe at runtime.

The Adobe catalog was consulted for the project's academic/arcane typography direction. Font selection remains a design-system decision and should be validated against WCAG contrast, legibility, language coverage and responsive rendering before becoming mandatory.

## What is deliberately not claimed

The Adobe ChatGPT connector does not by itself prove that the Academia Arcana web runtime can invoke Adobe APIs. The repository therefore does not invent a Firefly API endpoint, scrape Adobe, store connector credentials, or mark Adobe as a live runtime provider without a documented server-side API/OAuth contract.

If Adobe later provides a verified application-facing API contract required by the product, it belongs behind `src/infrastructure/integrations/adobe.ts` and must receive provider health, authorization, representative-operation, security and E2E coverage before being promoted to a live runtime integration.

## Vercel handoff

The only deployment-specific Adobe value is the optional public Fonts kit identifier:

```text
NEXT_PUBLIC_ADOBE_FONTS_KIT_ID
```

No Vercel mutation is performed by this integration work.
