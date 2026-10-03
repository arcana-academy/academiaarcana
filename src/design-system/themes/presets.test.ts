import { describe, expect, test } from "vitest";
import { THEME_IDS, themePresets } from "./presets";

const requiredTokenPaths = [
  "surfaces.canvas",
  "surfaces.panel",
  "surfaces.elevated",
  "surfaces.inset",
  "text.primary",
  "text.secondary",
  "text.muted",
  "text.inverse",
  "border.default",
  "border.strong",
  "accent.primary",
  "accent.secondary",
  "status.success",
  "status.warning",
  "status.danger",
  "status.info",
  "focus.ring",
  "focus.width",
  "focus.offset",
  "radius.sm",
  "radius.md",
  "radius.lg",
  "radius.xl",
  "radius.pill",
  "spacing.xs",
  "spacing.sm",
  "spacing.md",
  "spacing.lg",
  "spacing.xl",
  "spacing.2xl",
  "spacing.3xl",
  "typography.body",
  "typography.heading",
  "sizing.controlSm",
  "sizing.controlMd",
  "sizing.controlLg",
  "sizing.iconSm",
  "sizing.iconMd",
  "sizing.iconLg",
  "sizing.contentMax",
  "sizing.pageMax",
  "typography.display",
  "typography.label",
  "typography.caption",
  "typography.code",
  "typography.numeric",
  "typeScale.xs",
  "typeScale.sm",
  "typeScale.md",
  "typeScale.lg",
  "typeScale.xl",
  "typeScale.2xl",
  "typeScale.3xl",
  "typeScale.4xl",
  "typeScale.5xl",
  "lineHeight.tight",
  "lineHeight.normal",
  "lineHeight.relaxed",
  "motion.fast",
  "motion.normal",
  "motion.slow",
  "motion.easingStandard",
  "motion.easingEmphasized",
  "breakpoints.sm",
  "breakpoints.md",
  "breakpoints.lg",
  "breakpoints.xl",
  "zIndex.base",
  "zIndex.sticky",
  "zIndex.dropdown",
  "zIndex.modal",
  "zIndex.toast",
  "opacity.muted",
  "opacity.disabled",
  "opacity.overlay",
  "shadows.sm",
  "shadows.md",
  "motion.reduced",
  "density.compact",
  "density.comfortable",
  "effects.glow",
  "effects.texture",
] as const;

const approvedThemeIds = [
  "mago-classico",
  "escuro",
  "estudioso",
  "natural",
  "cinematic",
  "delicado",
  "gamer",
  "cozy-cafe",
  "noturno",
  "romantico",
  "ebullient",
  "nebula",
  "solarized",
  "gruvbox",
  "poimandres",
  "kanagawa-paper",
  "adwaita",
  "claude-warm",
  "aura",
  "nordic",
  "void",
  "things",
  "soft-paper",
  "minimal-studio",
  "apple-notes",
  "macos",
  "vauxhall",
  "rose-pine",
  "material-ocean",
  "nightfox",
  "vesper",
  "brutalist",
  "retro-windows",
  "pixel",
  "cyberglow",
  "nature",
  "bamboo",
  "sacred-geometry",
  "glass",
  "paper-light",
] as const;


function relativeLuminance(hex: string): number {
  const channels = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index + 1, index + 3), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

describe("Academia Arcana theme presets", () => {
  // Contrast tests cover both locally overridden and shared status tokens.
  test("registers the curated reference-derived theme set", () => {
    expect(THEME_IDS).toEqual(approvedThemeIds);
    expect(Object.keys(themePresets)).toHaveLength(approvedThemeIds.length);
  });

  test("defines every approved theme with a complete semantic token contract", () => {
    for (const themeId of THEME_IDS) {
      const preset = themePresets[themeId];
      expect(preset, `${themeId} preset`).toBeDefined();

      for (const path of requiredTokenPaths) {
        expect(readPath(preset, path), `${themeId}.${path}`).toBeTruthy();
      }
    }
  });

  test("never uses pure white in UI surface or primary text tokens", () => {
    for (const themeId of THEME_IDS) {
      const preset = themePresets[themeId];
      expect(preset.surfaces.canvas.toUpperCase(), `${themeId} canvas`).not.toBe("#FFFFFF");
      expect(preset.text.primary.toUpperCase(), `${themeId} primary text`).not.toBe("#FFFFFF");
    }
  });


  test("keeps the default border token at or above 3:1 against every theme surface", () => {
    for (const themeId of THEME_IDS) {
      const preset = themePresets[themeId];

      for (const surface of Object.values(preset.surfaces)) {
        expect(
          contrastRatio(preset.border.default, surface),
          `${themeId}.border.default vs ${surface}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });


  test("keeps primary, secondary and muted text at or above 4.5:1 against every theme surface", () => {
    for (const themeId of THEME_IDS) {
      const preset = themePresets[themeId];

      for (const foreground of [
        preset.text.primary,
        preset.text.secondary,
        preset.text.muted,
      ]) {
        for (const surface of Object.values(preset.surfaces)) {
          expect(
            contrastRatio(foreground, surface),
            `${themeId}.text vs ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });


  test("keeps status colors at or above 4.5:1 against every theme surface", () => {
    for (const themeId of THEME_IDS) {
      const preset = themePresets[themeId];

      for (const statusColor of Object.values(preset.status)) {
        for (const surface of Object.values(preset.surfaces)) {
          expect(
            contrastRatio(statusColor, surface),
            `${themeId}.status vs ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });


  test("keeps button text combinations at or above 4.5:1", () => {
    for (const themeId of THEME_IDS) {
      const preset = themePresets[themeId];

      expect(
        contrastRatio(preset.text.inverse, preset.accent.primary),
        `${themeId}.primary button`,
      ).toBeGreaterThanOrEqual(4.5);

      expect(
        contrastRatio(preset.text.primary, preset.surfaces.elevated),
        `${themeId}.secondary button`,
      ).toBeGreaterThanOrEqual(4.5);

      expect(
        contrastRatio(preset.text.inverse, preset.status.danger),
        `${themeId}.danger button`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("keeps reference-derived presets independent of vendor-specific token structure", () => {
    for (const themeId of THEME_IDS.slice(10)) {
      const preset = themePresets[themeId];
      expect(preset).not.toHaveProperty("vendor");
      expect(preset).not.toHaveProperty("obsidian");
    }
  });
});
