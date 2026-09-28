import { describe, expect, it } from "vitest";

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
});
