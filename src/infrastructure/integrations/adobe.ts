/**
 * Vendor-neutral Adobe configuration boundary.
 *
 * The ChatGPT Adobe connector is a creative/development capability, not proof
 * of a public web-runtime Adobe API. Keep the runtime contract configuration-
 * driven and avoid importing connector credentials into the application.
 */

export type AdobeRuntimeConfig = {
  readonly fontsKitId: string | null;
};

export function getAdobeRuntimeConfig(): AdobeRuntimeConfig {
  const fontsKitId = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID?.trim();

  return {
    fontsKitId: fontsKitId || null,
  };
}

export function getAdobeFontsStylesheetUrl(
  config: AdobeRuntimeConfig = getAdobeRuntimeConfig(),
): string | null {
  if (!config.fontsKitId) return null;

  return `https://use.typekit.net/${encodeURIComponent(config.fontsKitId)}.css`;
}
