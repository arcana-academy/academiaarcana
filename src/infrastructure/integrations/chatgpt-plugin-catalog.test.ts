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
  it("provides the official ChatGPT app bridge for 1 Billion Brain Cells", () => {
    const brainCells = CHATGPT_PLUGIN_CATALOG.find(
      (entry) => entry.name === "1 Billion Brain Cells",
    );

    expect(brainCells).toMatchObject({
      name: "1 Billion Brain Cells",
      chatgptAppUrl:
        "https://chatgpt.com/plugins/plugin_asdk_app_69cd086370708191905606fa0641d238",
    });
  });

});
