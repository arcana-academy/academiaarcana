import { describe, expect, it } from "vitest";
import { themePresets } from "./presets";
import { FEATURED_THEME_CHOICES } from "./featured-themes";

describe("curated fixed theme mapping", () => {
  it("reuses existing theme presets without introducing another source of tokens", () => {
    expect(FEATURED_THEME_CHOICES).toHaveLength(4);
    expect(new Set(FEATURED_THEME_CHOICES.map((choice) => choice.id)).size).toBe(4);
    for (const choice of FEATURED_THEME_CHOICES) {
      expect(themePresets[choice.presetId]).toBeDefined();
      expect(themePresets[choice.presetId].id).toBe(choice.presetId);
    }
  });
});
