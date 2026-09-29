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

  it("uses the project URL and public key as Vercel preview fallbacks", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(getPublicRuntimeConfig()).toEqual({
      supabaseUrl: "https://fichnalpbcfjywwhixid.supabase.co",
      supabasePublishableKey: "sb_publishable_0yFN7N7ikHBDY6m6P3FICw_u1lL6ppI",
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
