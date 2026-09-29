import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  loadBuildEnvironment,
  validateSupabaseProductionConfiguration,
  verifyPublicRuntimeConfig,
} from "./verify-public-runtime-config.mjs";

const validUrl = "https://abcdefghijklmnopqrst.supabase.co";
const publishablePrefix = ["sb", "publishable"].join("_") + "_";
const validKey = publishablePrefix + "A".repeat(22) + "_" + "B".repeat(7);

describe("verify-public-runtime-config", () => {
  it("loads missing runtime values from .env.local without overriding process env", () => {
    const directory = mkdtempSync(join(tmpdir(), "academia-arcana-env-"));

    try {
      writeFileSync(
        join(directory, ".env.local"),
        [
          `NEXT_PUBLIC_SUPABASE_URL=${validUrl}`,
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${validKey}`,
          "LOCAL_ONLY=value-from-file",
        ].join("\n"),
      );

      const environment = loadBuildEnvironment(
        {
          NEXT_PUBLIC_SUPABASE_URL: "https://existing.supabase.co",
        },
        directory,
      );

      expect(environment.NEXT_PUBLIC_SUPABASE_URL).toBe(
        "https://existing.supabase.co",
      );
      expect(environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(validKey);
      expect(environment.LOCAL_ONLY).toBe("value-from-file");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("accepts a valid Supabase URL and publishable key", () => {
    expect(() =>
      validateSupabaseProductionConfiguration(validUrl, validKey),
    ).not.toThrow();
  });

  it("rejects a malformed Supabase URL", () => {
    expect(() =>
      validateSupabaseProductionConfiguration(
        "https://.supabase.co",
        validKey,
      ),
    ).toThrow(/valid HTTPS Supabase project URL/);
  });

  it("rejects a non-production-length project reference", () => {
    expect(() =>
      validateSupabaseProductionConfiguration(
        "https://example.supabase.co",
        validKey,
      ),
    ).toThrow(/valid HTTPS Supabase project URL/);
  });

  it("rejects an empty or malformed publishable key", () => {
    expect(() =>
      validateSupabaseProductionConfiguration(
        validUrl,
        "sb_publishable_",
      ),
    ).toThrow(/expected sb_publishable/);

    expect(() =>
      validateSupabaseProductionConfiguration(
        validUrl,
        "sb_publishable_valid-but-wrong-shape",
      ),
    ).toThrow(/expected sb_publishable/);
  });

  it.each(["preview", "production", "development"])(
    "requires both public Supabase values in %s",
    (vercelEnvironment) => {
      expect(() =>
        verifyPublicRuntimeConfig({
          VERCEL_ENV: vercelEnvironment,
        }),
      ).toThrow("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
    },
  );

  it("rejects preview configuration with only one public Supabase value", () => {
    expect(() =>
      verifyPublicRuntimeConfig({
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validKey,
      }),
    ).toThrow("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  });

  it("rejects production configuration with malformed public values", () => {
    expect(() =>
      verifyPublicRuntimeConfig({
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validKey,
      }),
    ).toThrow(/valid HTTPS Supabase project URL/);
  });

  it("accepts a complete preview configuration", () => {
    expect(
      verifyPublicRuntimeConfig({
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SUPABASE_URL: validUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validKey,
      }),
    ).toEqual({
      integration: "supabase-public-runtime",
      verified: true,
      environment: "preview",
      configuration: "environment",
    });
  });

  it("accepts a complete production configuration", () => {
    expect(
      verifyPublicRuntimeConfig({
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: validUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validKey,
      }),
    ).toEqual({
      integration: "supabase-public-runtime",
      verified: true,
      environment: "production",
      configuration: "environment",
    });
  });
});
