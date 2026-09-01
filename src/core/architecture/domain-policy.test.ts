```ts id="q7f4mk"
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_LAYERS,
  DOMAIN_DEPENDENCY_DIRECTION,
  DOMAIN_POLICIES,
} from "./domain-policy";
import { CORE_DOMAINS } from "./domains";

describe("domain architecture policy", () => {
  it("defines exactly the approved domains", () => {
    expect(Object.keys(DOMAIN_POLICIES).sort()).toEqual(
      [...CORE_DOMAINS].sort(),
    );
  });

  it("defines the intended dependency direction", () => {
    expect(DOMAIN_DEPENDENCY_DIRECTION).toEqual([
      "ui -> application",
      "application -> domain",
      "domain -> ports",
      "infrastructure -> ports",
    ]);
  });

  it("keeps domain policy free from presentation and infrastructure dependencies", () => {
    for (const [domain, policy] of Object.entries(DOMAIN_POLICIES)) {
      expect(policy.prohibitedDependencies).toEqual(
        expect.arrayContaining(["React"]),
      );
      expect(policy.prohibitedDependencies).toEqual(
        expect.arrayContaining(["Next.js UI"]),
      );
      expect(policy.prohibitedDependencies).toEqual(
        expect.arrayContaining(["Supabase client"]),
      );
      expect(domain).toBeTruthy();
    }
  });

  it("keeps identity, context and authorization responsibilities distinct", () => {
    expect(DOMAIN_POLICIES.identity.excludes).toEqual(
      expect.arrayContaining([
        "authorization",
        "context membership",
        "full profile",
      ]),
    );

    expect(DOMAIN_POLICIES.context.excludes).toEqual(
      expect.arrayContaining([
        "authorization decisions",
        "authentication",
      ]),
    );

    expect(DOMAIN_POLICIES.authorization.excludes).toEqual(
      expect.arrayContaining([
        "authentication",
        "context ownership",
      ]),
    );
  });

  it("keeps infrastructure behind ports and prevents data from becoming a universal domain owner", () => {
    expect(ARCHITECTURE_LAYERS).toEqual([
      "ui",
      "application",
      "domain",
      "ports",
      "infrastructure",
    ]);

    expect(DOMAIN_POLICIES.data.excludes).toEqual(
      expect.arrayContaining([
        "domain business invariants",
        "authorization policy ownership",
      ]),
    );

    expect(DOMAIN_POLICIES.intelligence.prohibitedDependencies).toEqual(
      expect.arrayContaining([
        "direct database access",
        "unscoped domain access",
      ]),
    );

    expect(DOMAIN_POLICIES.flonts.prohibitedDependencies).toEqual(
      expect.arrayContaining([
        "direct database access",
        "unscoped domain access",
      ]),
    );
  });

  it("does not introduce a separate domain for UI or infrastructure concerns", () => {
    expect(CORE_DOMAINS).not.toContain("ui" as never);
    expect(CORE_DOMAINS).not.toContain("infrastructure" as never);
  });
});
```
