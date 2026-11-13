import { describe, expect, it } from "vitest";
import { verifyPublicRuntimeConfig } from "./verify-public-runtime-config.mjs";

describe("isolated MVP prebuild fail-closed contract", () => {
  it("accepts synthetic-only mode without database configuration", () => {
    expect(verifyPublicRuntimeConfig({ ARCANA_DEMO_ISOLATED: "1" })).toEqual({
      integration: "synthetic-only",
      verified: true,
      environment: "preview",
      configuration: "no-backend",
    });
  });

  it("refuses any Supabase or DB configuration in isolated mode", () => {
    expect(() => verifyPublicRuntimeConfig({
      ARCANA_DEMO_ISOLATED: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid",
    })).toThrow(/must not configure database or Supabase/);
    expect(() => verifyPublicRuntimeConfig({
      ARCANA_DEMO_ISOLATED: "1",
      DATABASE_URL: "not-a-real-database",
    })).toThrow(/must not configure database or Supabase/);
  });

  it("does not bypass the normal public-runtime configuration contract", () => {
    expect(() => verifyPublicRuntimeConfig({ ARCANA_DEMO_ISOLATED: "0" })).toThrow(
      /Missing required environment variable/,
    );
  });
});
