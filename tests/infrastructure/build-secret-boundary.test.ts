import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const guard = resolve(root, "scripts/security/verify-build-secret-boundary.cjs");
const firstRenderBuildStep = resolve(root, "scripts/verify-dependency-lifecycle-scripts.cjs");

function run(file: string, extra: Record<string, string> = {}) {
  return spawnSync(process.execPath, [file], {
    cwd: root,
    env: {
      PATH: process.env.PATH ?? "",
      NODE_ENV: "production",
      NPM_CONFIG_IGNORE_SCRIPTS: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.test",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-only-test-key",
      NEXT_PUBLIC_HONEYBADGER_API_KEY: "public-only-test-key",
      ...extra,
    },
    encoding: "utf8",
    timeout: 10000,
  });
}

describe("build-time runtime-secret isolation", () => {
  it("accepts explicitly public synthetic build inputs", () => {
    const result = run(guard);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("PASS");
  });

  it.each([
    "OPENAI_API_KEY",
    "PARALLEL_API_KEY",
    "EXA_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "TODOIST_CLIENT_SECRET",
    "MICROSOFT_ENTRA_CLIENT_SECRET",
    "OUTLOOK_CALENDAR_SESSION_SECRET",
    "CUSTOM_ACCESS_TOKEN",
    "ANOTHER_CLIENT_SECRET",
    "DATABASE_URL",
    "RENDER_DEPLOY_HOOK_URL",
  ])("fails safely for %s before the build", name => {
    const syntheticSecret = "synthetic-never-log-value";
    const result = run(guard, { [name]: syntheticSecret });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("BUILD SECRET BOUNDARY NO-GO");
    expect(result.stdout + result.stderr).not.toContain(syntheticSecret);
  });

  it("rejects even an empty but configured runtime variable", () => {
    expect(run(guard, { OPENAI_API_KEY: "" }).status).toBe(1);
  });

  it("enforces this guard as the first Render command before npm", () => {
    const blueprint = readFileSync(resolve(root, "render.yaml"), "utf8");
    expect(blueprint).toContain(
      "buildCommand: node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci",
    );
    const entry = readFileSync(firstRenderBuildStep, "utf8");
    expect(entry.indexOf("assertBuildSecretIsolation(process.env)")).toBeGreaterThan(0);
    expect(entry.indexOf("assertBuildSecretIsolation(process.env)")).toBeLessThan(
      entry.indexOf("lockPath"),
    );
    expect(run(firstRenderBuildStep).status).toBe(0);
    const denied = run(firstRenderBuildStep, { OPENAI_API_KEY: "synthetic-canary" });
    expect(denied.status).toBe(1);
    expect(denied.stdout + denied.stderr).not.toContain("synthetic-canary");
  });
});
