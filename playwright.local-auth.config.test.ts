// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.unstubAllEnvs(); });

describe("isolated authenticated Playwright configuration", () => {
  it.each([undefined, "0", "true"])("requires the explicit local opt-in rather than %s", async (value) => {
    vi.stubEnv("AA_LOCAL_SUPABASE_E2E", value);
    await expect(import("./playwright.local-auth.config"))
      .rejects.toThrow("Local authenticated E2E requires AA_LOCAL_SUPABASE_E2E=1.");
  });

  it("starts its own loopback server and preserves the canonical browser settings", async () => {
    vi.stubEnv("AA_LOCAL_SUPABASE_E2E", "1");
    const { default: base } = await import("./playwright.config");
    const { default: local } = await import("./playwright.local-auth.config");
    expect(local.webServer).toMatchObject({
      command: "npm run start -- --hostname 127.0.0.1",
      url: "http://127.0.0.1:3000/login", reuseExistingServer: false,
    });
    expect(local.use).toEqual({ ...base.use, ignoreHTTPSErrors: true });
    expect(local.projects).toEqual(base.projects);
    expect(base.use).not.toHaveProperty("ignoreHTTPSErrors");
    expect(base.webServer).toMatchObject({ command: "npm run start" });
  });
});
