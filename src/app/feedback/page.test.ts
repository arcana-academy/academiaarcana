// @vitest-environment jsdom

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

describe("Feedback page design-system integration", () => {
  test("uses the canonical semantic CSS stack instead of legacy theme variables or Tailwind utilities", () => {
    const source = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");

    expect(source).not.toContain("aa-color-");
    expect(source).not.toContain("min-h-screen");
    expect(source).not.toContain("bg-");
    expect(source).not.toContain("text-");
    expect(source).not.toContain("grid-cols-");
    expect(source).toContain("aa-feedback-page");
    expect(source).toContain("aa-feedback-grid");
  });
});
