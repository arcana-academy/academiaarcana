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
const validKey = publishablePrefix + "A".repeat(22) + "_" + "B".repeat(8);

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

  it("accepts a valid production URL and publishable key", () => {
    expect(() =>
      validateSupabaseProductionConfiguration(validUrl, validKey),
    ).not.toThrow();
  });

  it("rejects a malformed Supabase production URL", () => {
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

  it("uses loaded local configuration for a production verification", () => {
    const directory = mkdtempSync(join(tmpdir(), "academia-arcana-env-"));

    try {
      writeFileSync(
        join(directory, ".env.local"),
        [
          `NEXT_PUBLIC_SUPABASE_URL=${validUrl}`,
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${validKey}`,
        ].join("\n"),
      );

      const environment = loadBuildEnvironment(
        { VERCEL_ENV: "production" },
        directory,
      );

      expect(verifyPublicRuntimeConfig(environment)).toEqual({
        integration: "supabase-public-runtime",
        verified: true,
        environment: "production",
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
