import { describe, expect, test } from "vitest";

import { THEME_IDS, themePresets } from "../themes/presets";

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Expected six-digit hex color, received: ${hex}`);
  }

  const [red, green, blue] = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function expectAaContrast(
  themeId: (typeof THEME_IDS)[number],
  label: string,
  foreground: string,
  background: string,
): void {
  expect(
    contrastRatio(foreground, background),
    `${themeId}: ${label} must remain at least 4.5:1`,
  ).toBeGreaterThanOrEqual(4.5);
}

describe("theme semantic contrast", () => {
  test.each(THEME_IDS)("%s preserves AA contrast for proven text pairings", (themeId) => {
    const theme = themePresets[themeId];

    expectAaContrast(themeId, "text.primary / surfaces.canvas", theme.text.primary, theme.surfaces.canvas);
    expectAaContrast(themeId, "text.primary / surfaces.panel", theme.text.primary, theme.surfaces.panel);
    expectAaContrast(themeId, "text.primary / surfaces.elevated", theme.text.primary, theme.surfaces.elevated);
    expectAaContrast(themeId, "text.primary / surfaces.inset", theme.text.primary, theme.surfaces.inset);
    expectAaContrast(themeId, "text.secondary / surfaces.canvas", theme.text.secondary, theme.surfaces.canvas);
    expectAaContrast(themeId, "text.secondary / surfaces.panel", theme.text.secondary, theme.surfaces.panel);
    expectAaContrast(themeId, "text.inverse / accent.primary", theme.text.inverse, theme.accent.primary);
    expectAaContrast(themeId, "text.inverse / status.danger", theme.text.inverse, theme.status.danger);
  });
});
