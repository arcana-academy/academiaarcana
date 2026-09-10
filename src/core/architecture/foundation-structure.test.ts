import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CORE_DOMAINS } from "./domains";

const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const domainsRoot = join(srcRoot, "domains");
const coreRoot = join(srcRoot, "core");
const crossCuttingDomains = ["identity", "context", "authorization"] as const;
const businessDomains = CORE_DOMAINS.filter(
  (domain) =>
    !crossCuttingDomains.some(
      (crossCuttingDomain) => crossCuttingDomain === domain,
    ),
);

function expectRegularFile(path: string): void {
  expect(existsSync(path), path).toBe(true);
  expect(statSync(path).isFile(), path).toBe(true);
}

function expectContractsReExport(indexPath: string): void {
  expectRegularFile(indexPath);

  const source = readFileSync(indexPath, "utf8");
  expect(source, `${indexPath} must re-export its public contracts`).toMatch(
    /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']\.\/contracts["']/,
  );
}

describe("Foundation 1 — modular structure", () => {
  it("contains exactly the approved business-domain modules", () => {
    const actualDomains = readdirSync(domainsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const approvedDomains = [...businessDomains].sort();

    expect(actualDomains).toEqual(approvedDomains);
  });

  it("contains the approved cross-cutting core identity/context/authorization modules", () => {
    for (const domain of crossCuttingDomains) {
      const domainRoot = join(coreRoot, domain);

      expect(existsSync(domainRoot), domainRoot).toBe(true);
      expect(statSync(domainRoot).isDirectory(), domainRoot).toBe(true);
      expectRegularFile(join(domainRoot, "index.ts"));
      expectRegularFile(join(domainRoot, "contracts.ts"));
    }
  });

  it("gives every approved business domain contracts and a public index barrel", () => {
    for (const domain of businessDomains) {
      const domainRoot = join(domainsRoot, domain);
      expectRegularFile(join(domainRoot, "contracts.ts"));
      expectRegularFile(join(domainRoot, "index.ts"));
    }
  });

  it("exposes each domain contract through its public index barrel", () => {
    for (const domain of crossCuttingDomains) {
      expectContractsReExport(join(coreRoot, domain, "index.ts"));
    }

    for (const domain of businessDomains) {
      expectContractsReExport(join(domainsRoot, domain, "index.ts"));
    }
  });

  it("keeps architecture policy as a single source of truth", async () => {
    const architectureIndex = join(srcRoot, "core", "architecture", "index.ts");
    expectRegularFile(architectureIndex);

    const architectureExports = readFileSync(architectureIndex, "utf8");
    expect(architectureExports).toMatch(
      /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']\.\/domains["']/,
    );
    expect(architectureExports).toMatch(
      /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']\.\/domain-policy["']/,
    );

    const { DOMAIN_POLICIES } = await import("./domain-policy");
    expect(Object.keys(DOMAIN_POLICIES).sort()).toEqual([...CORE_DOMAINS].sort());

    const requiredPolicyCollections = [
      "owns",
      "excludes",
      "entities",
      "useCases",
      "prohibitedDependencies",
      "events",
      "infrastructure",
    ] as const;

    for (const [domain, policy] of Object.entries(DOMAIN_POLICIES)) {
      expect(policy.responsibility.trim().length, `${domain}.responsibility`).toBeGreaterThan(0);

      for (const field of requiredPolicyCollections) {
        expect(policy[field].length, `${domain}.${field}`).toBeGreaterThan(0);
      }

      for (const dependency of policy.allowedDependencies) {
        expect(CORE_DOMAINS, `${domain}.allowedDependencies includes ${dependency}`).toContain(dependency);
        expect(dependency, `${domain} must not depend on itself`).not.toBe(domain);
      }
    }
  });
});
