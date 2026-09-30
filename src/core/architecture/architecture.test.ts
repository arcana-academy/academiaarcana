import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CORE_DOMAINS, type CoreDomain } from "./domains";
import { DOMAIN_POLICIES } from "./domain-policy";

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
      "sanctuary",
    ];

    expect(CORE_DOMAINS).toEqual(expected);
  });

  it("maps every canonical domain to a public module barrel", () => {
    const sourceRoot = resolve(process.cwd(), "src");

    for (const domain of CORE_DOMAINS) {
      const candidates = [
        resolve(sourceRoot, "core", domain, "index.ts"),
        resolve(sourceRoot, "core", domain, "index.tsx"),
        resolve(sourceRoot, "domains", domain, "index.ts"),
        resolve(sourceRoot, "domains", domain, "index.tsx"),
      ];

      expect(
        candidates.some((candidate) => existsSync(candidate)),
        `Domain ${domain} must expose a public module barrel.`,
      ).toBe(true);
    }
  });

  it("keeps every canonical domain policy complete", () => {
    for (const domain of CORE_DOMAINS) {
      const policy = DOMAIN_POLICIES[domain];

      expect(policy.responsibility.trim()).not.toBe("");
      expect(policy.owns.length).toBeGreaterThan(0);
      expect(policy.excludes.length).toBeGreaterThan(0);
      expect(policy.entities.length).toBeGreaterThan(0);
      expect(policy.useCases.length).toBeGreaterThan(0);
      expect(policy.infrastructure.length).toBeGreaterThan(0);
    }
  });
});
