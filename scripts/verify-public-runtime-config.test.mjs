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
const validKey = "sb_publishable_" + "A".repeat(22) + "_" + "B".repeat(8);

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
        { NEXT_PUBLIC_SUPABASE_URL: "https://existing.supabase.co" },
        directory,
      );

      expect(environment.NEXT_PUBLIC_SUPABASE_URL).toBe("https://existing.supabase.co");
      expect(environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(validKey);
      expect(environment.LOCAL_ONLY).toBe("value-from-file");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("accepts a valid Supabase URL and publishable key", () => {
    expect(() => validateSupabaseProductionConfiguration(validUrl, validKey)).not.toThrow();
  });

  it("rejects malformed public configuration", () => {
    expect(() =>
      validateSupabaseProductionConfiguration("https://example.supabase.co", validKey),
    ).toThrow(/valid HTTPS Supabase project URL/);

    expect(() =>
      validateSupabaseProductionConfiguration(validUrl, "sb_publishable_"),
    ).toThrow(/expected sb_publishable/);
  });

  it("rejects incomplete runtime configuration", () => {
    expect(() => verifyPublicRuntimeConfig({ RENDER: "true" })).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("accepts a complete Render configuration", () => {
    expect(
      verifyPublicRuntimeConfig({
        RENDER: "true",
        RENDER_ENVIRONMENT: "production",
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
