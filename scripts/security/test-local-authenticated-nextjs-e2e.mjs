import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Fail closed: this CI scenario may never run with a hosted Supabase or
// repository/production credentials. The runner is ephemeral and PR-scoped.
assert.equal(process.env.GITHUB_ACTIONS, "true");
assert.equal(process.env.GITHUB_EVENT_NAME, "pull_request");
assert.equal(process.env.AA_LOCAL_SUPABASE_E2E, "1");

const raw = execFileSync("supabase", ["status", "-o", "env"], {
  encoding: "utf8",
  timeout: 30_000,
});
const variables = Object.fromEntries(raw.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^[\"']|[\"']$/g, "")]] : [];
}));

const api = new URL(variables.API_URL);
assert.equal(api.protocol, "http:", "Hosted HTTPS backends are not permitted");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(api.hostname));
assert.equal(api.pathname, "/");
assert.equal(api.search, "");
assert.equal(api.hash, "");
assert.equal(api.username, "");
assert.equal(api.password, "");
assert.ok(variables.ANON_KEY, "Local Supabase anon key was not returned");
for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]) {
  if (process.env[name]) {
    assert.equal(new URL(process.env[name]).origin, api.origin,
      `Refusing to override non-local ${name}`);
  }
}

// Credentials belong to a disposable account and are passed to the browser
// test process only; they are never committed, printed or uploaded as an artifact.
const email = `c26-${randomUUID()}@example.test`;
const password = `LocalC26-${randomBytes(20).toString("hex")}!`;
const client = createClient(api.toString(), variables.ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: account, error: signupError } = await client.auth.signUp({
  email,
  password,
});
if (signupError) throw new Error(`Local synthetic account creation failed: ${signupError.message}`);
assert.ok(account.user?.id && account.session?.access_token,
  "Local Auth must create an immediately authenticated synthetic identity");

const { data: grimoire, error: seedError } = await client
  .from("grimoires")
  .insert({
    owner_id: account.user.id,
    title: "Grimório sintético C26",
  })
  .select("id")
  .single();
if (seedError) throw new Error(`Local fixture creation failed: ${seedError.message}`);
assert.ok(grimoire?.id);
console.log("PASS: ephemeral local-only Auth identity and owned grimoire seeded");

const result = spawnSync("npm", [
  "exec", "--", "playwright", "test",
  "tests/e2e/grimoires-workspace.spec.ts",
  "tests/e2e/practice.spec.ts",
  "tests/e2e/sanctuary.spec.ts",
  "--config=playwright.local-auth.config.ts",
], {
  stdio: "inherit",
  timeout: 11 * 60_000,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: api.toString(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: variables.ANON_KEY,
    E2E_EMAIL: email,
    E2E_PASSWORD: password,
  },
});

if (result.error) throw result.error;
assert.equal(result.signal, null, "Local authenticated Next.js E2E was interrupted");
assert.equal(result.status, 0, "Local authenticated Next.js E2E failed");
console.log("PASS: authenticated Grimórios, Prática and Santuário Next.js journeys on disposable local Supabase");
