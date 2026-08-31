import { describe, expect, it } from "vitest";
import { CORE_DOMAINS, type CoreDomain } from "./domains";

describe("Academia Arcana architecture", () => {
  it("defines the approved core domains explicitly", () => {
    const expected: CoreDomain[] = [
      "identity",
      "context",
      "authorization",
      "learning",
      "planning",
      "gamification",
      "education",
      "social",
      "adaptive",
      "intelligence",
      "flonts",
      "trust",
      "data",
    ];

    expect(CORE_DOMAINS).toEqual(expected);
  });
});
