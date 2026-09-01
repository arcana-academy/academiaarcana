import { describe, expect, it } from "vitest";
import { getPublicEnv, getSupabaseServerEnv } from "./env";

describe("environment boundary", () => {
  it("exposes only public environment variables to public consumers", () => {
    const env = {
      NEXT_PUBLIC_APP_URL: "https://example.test",
      SUPABASE_URL: "https://secret.example",
      SUPABASE_ANON_KEY: "secret-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
    };

    expect(getPublicEnv(env)).toEqual({
      NEXT_PUBLIC_APP_URL: "https://example.test",
    });
  });

  it("rejects incomplete Supabase server configuration", () => {
    expect(() => getSupabaseServerEnv({ SUPABASE_URL: "" })).toThrowError(
      expect.objectContaining({ code: "CONFIG_MISSING" }),
    );
  });
});
