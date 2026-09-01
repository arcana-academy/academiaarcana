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
  "radius.sm",
  "radius.md",
  "radius.lg",
  "spacing.xs",
  "spacing.sm",
  "spacing.md",
  "spacing.lg",
  "typography.body",
  "typography.heading",
  "shadows.sm",
  "shadows.md",
  "motion.duration",
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

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

describe("Academia Arcana theme presets", () => {
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

  test("keeps reference-derived presets independent of vendor-specific token structure", () => {
    for (const themeId of THEME_IDS.slice(10)) {
      const preset = themePresets[themeId];
      expect(preset).not.toHaveProperty("vendor");
      expect(preset).not.toHaveProperty("obsidian");
    }
  });
});
