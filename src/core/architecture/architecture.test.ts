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

  it("maps every canonical domain to exactly one canonical source barrel", () => {
    const sourceRoot = resolve(process.cwd(), "src");
    const sourceRootByDomain: Record<CoreDomain, "core" | "domains"> = {
      identity: "core",
      context: "core",
      authorization: "core",
      learning: "domains",
      planning: "domains",
      gamification: "domains",
      education: "domains",
      social: "domains",
      adaptive: "domains",
      intelligence: "domains",
      flonts: "domains",
      trust: "domains",
      data: "domains",
      sanctuary: "domains",
    };

    const locations = CORE_DOMAINS.map((domain) => {
      const root = sourceRootByDomain[domain];
      const candidate = resolve(sourceRoot, root, domain, "index.ts");
      const alternative = resolve(sourceRoot, root, domain, "index.tsx");

      return {
        domain,
        root,
        files: [candidate, alternative].filter((file) => existsSync(file)),
      };
    });

    for (const { domain, root, files } of locations) {
      expect(
        files.length,
        `Domain ${domain} must expose exactly one public barrel in src/${root}/${domain}.`,
      ).toBe(1);
    }

    expect(new Set(locations.map(({ domain }) => domain)).size).toBe(
      CORE_DOMAINS.length,
    );
    expect(locations.map(({ root }) => root)).toEqual([
      "core",
      "core",
      "core",
      "domains",
      "domains",
      "domains",
      "domains",
      "domains",
      "domains",
      "domains",
      "domains",
      "domains",
      "domains",
      "domains",
    ]);
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
