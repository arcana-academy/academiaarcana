import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "./csp";

describe("createContentSecurityPolicy", () => {
  it("keeps the production policy strict", () => {
    const csp = createContentSecurityPolicy("abc123", "production");

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

  it("permits only the development capabilities required by Next and local Supabase", () => {
    const csp = createContentSecurityPolicy("dev123", "development");

    expect(csp).toContain(
      "script-src 'self' 'nonce-dev123' 'strict-dynamic' 'unsafe-eval'",
    );
    expect(csp).toContain("http://127.0.0.1:*");
    expect(csp).toContain("http://localhost:*");
    expect(csp).toContain("ws://127.0.0.1:*");
    expect(csp).toContain("ws://localhost:*");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("'unsafe-inline'");
  });
});
