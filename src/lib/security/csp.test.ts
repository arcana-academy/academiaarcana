import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "./csp";

describe("createContentSecurityPolicy", () => {
  it("uses the request nonce and removes unsafe script execution", () => {
    const csp = createContentSecurityPolicy("abc123");

    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-abc123' https://use.typekit.net");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("'unsafe-inline'");
  });
});
