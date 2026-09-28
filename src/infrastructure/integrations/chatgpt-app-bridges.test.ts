import { describe, expect, it } from "vitest";

import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import {
  CHATGPT_APP_BRIDGES,
  ONE_BILLION_BRAIN_CELLS_APP_ID,
  ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL,
} from "./chatgpt-app-bridges";

describe("ChatGPT app bridges", () => {
  it("defines the 1 Billion Brain Cells bridge without credentials", () => {
    expect(CHATGPT_APP_BRIDGES[ONE_BILLION_BRAIN_CELLS_APP_ID]).toEqual({
      providerId: ONE_BILLION_BRAIN_CELLS_APP_ID,
      displayName: "1 Billion Brain Cells",
      appUrl: ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL,
    });

    expect(ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL).toMatch(
      /^https:\/\/chatgpt\.com\//,
    );
  });

  it("keeps every bridge anchored to a catalog entry and a unique official ChatGPT URL", () => {
    const catalogNames = new Set(CHATGPT_PLUGIN_CATALOG.map((entry) => entry.name));
    const bridges = Object.values(CHATGPT_APP_BRIDGES);
    const bridgeUrls = bridges.map((bridge) => bridge.appUrl);

    expect(bridges.every((bridge) => catalogNames.has(bridge.displayName))).toBe(
      true,
    );
    expect(new Set(bridgeUrls).size).toBe(bridgeUrls.length);
    expect(
      bridges.every((bridge) => {
        const url = new URL(bridge.appUrl);
        return url.protocol === "https:" && url.hostname === "chatgpt.com";
      }),
    ).toBe(true);
  });

  it("does not store credential material in bridge metadata", () => {
    for (const bridge of Object.values(CHATGPT_APP_BRIDGES)) {
      expect(bridge).not.toHaveProperty("apiKey");
      expect(bridge).not.toHaveProperty("accessToken");
      expect(bridge).not.toHaveProperty("clientSecret");
      expect(bridge).not.toHaveProperty("authorization");
    }
  });
});
