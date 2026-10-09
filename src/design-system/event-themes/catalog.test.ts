import { describe, expect, it } from "vitest";
import { EVENT_THEME_IDS, eventThemes, resolveEventTheme } from "./catalog";

describe("seasonal theme catalog", () => {
  it("uses a unique stable identifier for each theme", () => {
    expect(new Set(EVENT_THEME_IDS).size).toBe(EVENT_THEME_IDS.length);
    for (const id of EVENT_THEME_IDS) {
      expect(resolveEventTheme(id)).toEqual(eventThemes[id]);
      expect(eventThemes[id].name.trim()).not.toBe("");
    }
  });
  it("rejects unknown or prototype property identifiers", () => {
    expect(resolveEventTheme(undefined)).toBeNull();
    expect(resolveEventTheme("__proto__")).toBeNull();
    expect(resolveEventTheme("desconhecido")).toBeNull();
  });
});
