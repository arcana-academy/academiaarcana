import { describe, expect, it } from "vitest";
import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";

describe("ChatGPT plugin catalog", () => {
  it("registers the complete user-supplied catalog without duplicate names", () => {
    const names = CHATGPT_PLUGIN_CATALOG.map((entry) => entry.name);

    expect(names).toHaveLength(114);
    expect(new Set(names).size).toBe(names.length);
  });

  it("marks every catalog entry with the stable catalog source", () => {
    expect(
      CHATGPT_PLUGIN_CATALOG.every((entry) => entry.source === "chatgpt-catalog"),
    ).toBe(true);
  });

  it("does not expose credentials or runtime endpoints in catalog metadata", () => {
    for (const entry of CHATGPT_PLUGIN_CATALOG) {
      expect(entry).not.toHaveProperty("apiKey");
      expect(entry).not.toHaveProperty("accessToken");
      expect(entry).not.toHaveProperty("clientSecret");
      expect(entry).not.toHaveProperty("endpoint");
    }
  });
});
