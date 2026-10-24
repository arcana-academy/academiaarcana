import { describe, expect, it } from "vitest";
import { safeExternalUrl } from "./external-url";

describe("safeExternalUrl", () => {
  it("accepts absolute HTTPS links from provider APIs", () => {
    expect(safeExternalUrl("https://www.notion.so/page/123")).toBe(
      "https://www.notion.so/page/123",
    );
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://notion.example/page",
    "//attacker.example/path",
    "https://user:password@notion.example/page",
    "notion.example/page",
    null,
    123,
  ])("rejects unsafe or non-URL input: %s", (input) => {
    expect(safeExternalUrl(input)).toBeNull();
  });
});
