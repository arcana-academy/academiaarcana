import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "./csp";

describe("createContentSecurityPolicy", () => {
  it("keeps the default policy strict", () => {
    const csp = createContentSecurityPolicy("abc123", {
      NODE_ENV: "production",
    });

    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-abc123' https://use.typekit.net");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("connect-src 'self' https: wss:");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("http://127.0.0.1");
    expect(csp).not.toContain("http://localhost");
  });

  it("permits localhost connections only for explicit CI E2E", () => {
    const csp = createContentSecurityPolicy("e2e123", {
      CI: "true",
      E2E_LOCAL_RUNTIME: "1",
      NODE_ENV: "production",
    });

    expect(csp).toContain("script-src 'self' 'nonce-e2e123' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-e2e123' https://use.typekit.net");
    expect(csp).toContain("http://127.0.0.1:*");
    expect(csp).toContain("http://localhost:*");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("'unsafe-inline'");
  });

  it("does not enable the local exception when CI is absent", () => {
    const csp = createContentSecurityPolicy("no-ci", {
      E2E_LOCAL_RUNTIME: "1",
      NODE_ENV: "production",
    });

    expect(csp).toContain("connect-src 'self' https: wss:");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("http://127.0.0.1");
  });
});
