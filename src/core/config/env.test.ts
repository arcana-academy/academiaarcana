import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicRuntimeConfig } from "./env";

describe("runtime configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the required public configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    expect(getPublicRuntimeConfig()).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "publishable-key",
    });
  });

  it.each([
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_URL"],
  ])("fails when %s is missing", (missingName, presentName) => {
    vi.stubEnv(presentName, "configured");
    vi.stubEnv(missingName, "");

    expect(() => getPublicRuntimeConfig()).toThrow(
      `Missing required environment variable: ${missingName}`,
    );
  });
});
