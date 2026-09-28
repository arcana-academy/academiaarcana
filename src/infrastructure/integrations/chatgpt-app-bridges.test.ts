import { describe, expect, it } from "vitest";

import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import {
  A_Z_DICTIONARY_APP_ID,
  A_Z_DICTIONARY_CHATGPT_APP_URL,
  A_Z_HOLY_BIBLE_APP_ID,
  A_Z_HOLY_BIBLE_CHATGPT_APP_URL,
  ACADEMIC_WRITING_TOOLKIT_APP_ID,
  ACADEMIC_WRITING_TOOLKIT_CHATGPT_APP_URL,
  ASTROLOGIC_APP_ID,
  ASTROLOGIC_CHATGPT_APP_URL,
  CHATGPT_APP_BRIDGES,
  ONE_BILLION_BRAIN_CELLS_APP_ID,
  ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL,
  QUIZLET_APP_ID,
  QUIZLET_CHATGPT_APP_URL,
  SPOTIFY_APP_ID,
  SPOTIFY_CHATGPT_APP_URL,
  TARTEEL_APP_ID,
  TARTEEL_CHATGPT_APP_URL,
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

  it("defines the A-Z Dictionary bridge without credentials", () => {
    expect(CHATGPT_APP_BRIDGES[A_Z_DICTIONARY_APP_ID]).toEqual({
      providerId: A_Z_DICTIONARY_APP_ID,
      displayName: "A-Z Dictionary",
      appUrl: A_Z_DICTIONARY_CHATGPT_APP_URL,
    });

    expect(A_Z_DICTIONARY_CHATGPT_APP_URL).toMatch(
      /^https:\/\/chatgpt\.com\//,
    );
  });

  it("defines the A-Z Holy Bible bridge without credentials", () => {
    expect(CHATGPT_APP_BRIDGES[A_Z_HOLY_BIBLE_APP_ID]).toEqual({
      providerId: A_Z_HOLY_BIBLE_APP_ID,
      displayName: "A-Z Holy Bible",
      appUrl: A_Z_HOLY_BIBLE_CHATGPT_APP_URL,
    });

    expect(A_Z_HOLY_BIBLE_CHATGPT_APP_URL).toMatch(
      /^https:\/\/chatgpt\.com\//,
    );
  });

  it("defines the Academic Writing Toolkit bridge without credentials", () => {
    expect(CHATGPT_APP_BRIDGES[ACADEMIC_WRITING_TOOLKIT_APP_ID]).toEqual({
      providerId: ACADEMIC_WRITING_TOOLKIT_APP_ID,
      displayName: "Academic Writing Toolkit",
      appUrl: ACADEMIC_WRITING_TOOLKIT_CHATGPT_APP_URL,
    });

    expect(ACADEMIC_WRITING_TOOLKIT_CHATGPT_APP_URL).toBe(
      "https://chatgpt.com/plugins/plugin_asdk_app_6a04f88a5fbc8191b8679c1ae31f2779",
    );
  });

  it("registers Astrologic without claiming an unverified web-runtime endpoint", () => {
    expect(CHATGPT_APP_BRIDGES[ASTROLOGIC_APP_ID]).toEqual({
      providerId: ASTROLOGIC_APP_ID,
      displayName: "Astrologic",
    });
    expect(ASTROLOGIC_CHATGPT_APP_URL).toBeUndefined();
  });

  it("defines the Spotify bridge with the official ChatGPT app URL", () => {
    expect(CHATGPT_APP_BRIDGES[SPOTIFY_APP_ID]).toEqual({
      providerId: SPOTIFY_APP_ID,
      displayName: "Spotify",
      appUrl: SPOTIFY_CHATGPT_APP_URL,
    });

    expect(SPOTIFY_CHATGPT_APP_URL).toBe(
      "https://chatgpt.com/plugins/plugin_asdk_app_68de829bf7648191acd70a907364c67c",
    );
  });

  it("defines the Quizlet bridge with the official ChatGPT app URL", () => {
    expect(CHATGPT_APP_BRIDGES[QUIZLET_APP_ID]).toEqual({
      providerId: QUIZLET_APP_ID,
      displayName: "Quizlet",
      appUrl: QUIZLET_CHATGPT_APP_URL,
    });

    expect(QUIZLET_CHATGPT_APP_URL).toBe(
      "https://chatgpt.com/plugins/plugin_asdk_app_694336f3c5088191bcdfe35bb532ad83",
    );
  });

  it("catalogues Tarteel without inventing a launch URL", () => {
    expect(CHATGPT_APP_BRIDGES[TARTEEL_APP_ID]).toEqual({
      providerId: TARTEEL_APP_ID,
      displayName: "Tarteel",
    });
    expect(TARTEEL_CHATGPT_APP_URL).toBeUndefined();
  });

  it("keeps every bridge anchored to a catalog entry and a unique official ChatGPT URL", () => {
    const catalogNames = new Set(CHATGPT_PLUGIN_CATALOG.map((entry) => entry.name));
    const bridges = Object.values(CHATGPT_APP_BRIDGES);
    const bridgeUrls: string[] = [];
    for (const bridge of bridges) {
      if (typeof bridge.appUrl === "string") {
        bridgeUrls.push(bridge.appUrl);
      }
    }

    expect(bridges.every((bridge) => catalogNames.has(bridge.displayName))).toBe(
      true,
    );
    expect(new Set(bridgeUrls).size).toBe(bridgeUrls.length);
    expect(
      bridgeUrls.every((appUrl) => {
        const url = new URL(appUrl);
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
