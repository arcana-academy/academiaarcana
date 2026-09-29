import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicRuntimeConfig } from "./env";

describe("runtime configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads configured public values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    expect(getPublicRuntimeConfig()).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "publishable-key",
    });
  });

  it("uses the project values as a fallback when Vercel configuration is absent", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(getPublicRuntimeConfig()).toEqual({
      supabaseUrl: "https://fichnalpbcfjywwhixid.supabase.co",
      supabasePublishableKey:
        "sb_publishable_0yFN7N7ikHBDY6m6P3FICw_u1lL6ppI",
    });
  });
});
