/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { describe, it } = require("node:test");
const guardPath = path.join(__dirname, "assert-build-secret-isolation-536.cjs");
const { isSensitiveName, exposedNames, verify } = require(guardPath);
const root = path.resolve(__dirname, "../..");

describe("P0 #536 build secret isolation fail-closed contract", () => {
  it("accepts only explicit browser-public keys and nonsensitive build controls", () => {
    for (const name of ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_HONEYBADGER_API_KEY"]) {
      assert.equal(isSensitiveName(name), false);
    }
    verify({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.example",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-only",
      NEXT_PUBLIC_HONEYBADGER_API_KEY: "public-test-only",
      NPM_CONFIG_IGNORE_SCRIPTS: "true",
    });
  });

  it("refuses API keys, OAuth secrets, cloud tokens, database and deploy hook credentials", () => {
    for (const name of [
      "OPENAI_API_KEY", "PARALLEL_API_KEY", "EXA_API_KEY",
      "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_ACCESS_TOKEN",
      "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_SECRET", "MICROSOFT_CLIENT_SECRET",
      "DATABASE_URL", "DB_PASSWORD", "AWS_SECRET_ACCESS_KEY",
      "AWS_ACCESS_KEY_ID", "POSTGRES_URL", "REDIS_URL",
      "MONGODB_URI", "DATABASE_URI", "DATABASE_CONNECTION_STRING",
      "RENDER_API_KEY", "RENDER_DEPLOY_HOOK_URL", "GHCR_TOKEN",
      "SENTRY_AUTH_TOKEN", "JWT_SIGNING_KEY", "NEXT_PUBLIC_SECRET_KEY",
    ]) {
      assert.equal(isSensitiveName(name), true, name);
      assert.deepEqual(exposedNames({ [name]: "synthetic-canary" }), [name]);
      assert.throws(() => verify({ [name]: "synthetic-canary" }), /refusing build/);
    }
  });

  it("does not reject absent or empty credential variables", () => {
    verify({ OPENAI_API_KEY: "", DATABASE_URL: "" });
    verify({});
  });

  it("never prints the synthetic credential name or value on failure", () => {
    const marker = "sensitive-canary-never-print";
    const run = spawnSync(process.execPath, [guardPath], {
      env: { NODE_ENV: "production", OPENAI_API_KEY: marker },
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(run.status, 1);
    assert.equal(run.stdout.includes(marker), false);
    assert.equal(run.stderr.includes(marker), false);
    assert.equal(run.stderr.includes("OPENAI_API_KEY"), false);
    assert.match(run.stderr, /FAIL CLOSED/);
  });

  it("requires protection before any Render install/build and at npm prebuild", () => {
    const render = fs.readFileSync(path.join(root, "render.yaml"), "utf8");
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const buildLine = render.split(/\r?\n/).find(line => /^\s*buildCommand:\s*/.test(line));
    assert.ok(buildLine, "Render build command must exist");
    assert.match(buildLine, /^\s*buildCommand:\s*node scripts\/security\/assert-build-secret-isolation-536\.cjs\s*&&/);
    assert.match(pkg.scripts.prebuild, /^node scripts\/security\/assert-build-secret-isolation-536\.cjs\s*&&/);
  });
});
