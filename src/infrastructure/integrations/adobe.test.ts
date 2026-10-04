import { afterEach, describe, expect, it } from "vitest";

import {
  getAdobeFontsStylesheetUrl,
  getAdobeRuntimeConfig,
} from "./adobe";

describe("Adobe runtime configuration", () => {
  const original = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID;
    } else {
      process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID = original;
    }
  });

  it("treats the Fonts kit as optional public configuration", () => {
    delete process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID;

    expect(getAdobeRuntimeConfig()).toEqual({ fontsKitId: null });
    expect(getAdobeFontsStylesheetUrl()).toBeNull();
  });

  it("builds the official Adobe Fonts stylesheet URL when configured", () => {
    process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID = "abc123";

    expect(getAdobeRuntimeConfig()).toEqual({ fontsKitId: "abc123" });
    expect(getAdobeFontsStylesheetUrl()).toBe(
      "https://use.typekit.net/abc123.css",
    );
  });
});
