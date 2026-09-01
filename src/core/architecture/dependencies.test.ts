import { describe, expect, it } from "vitest";
import { CORE_DOMAINS } from "./domains";
import { DOMAIN_DEPENDENCIES, assertAcyclicDomainGraph } from "./dependencies";

describe("domain dependency architecture", () => {
  it("registers exactly the approved domains with no cycles", () => {
    expect(Object.keys(DOMAIN_DEPENDENCIES).sort()).toEqual([...CORE_DOMAINS].sort());
    expect(() => assertAcyclicDomainGraph(DOMAIN_DEPENDENCIES)).not.toThrow();

    for (const domain of CORE_DOMAINS) {
      expect(DOMAIN_DEPENDENCIES[domain]).not.toContain(domain);
    }
  });
});
