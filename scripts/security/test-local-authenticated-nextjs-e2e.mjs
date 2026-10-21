import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Fail closed: this scenario is limited to a synthetic PR runner and a
// loopback-only Supabase instance. No hosted project or real credentials.
assert.equal(process.env.GITHUB_ACTIONS, "true");
if (process.env.GITHUB_EVENT_NAME === "workflow_dispatch") {
  assert.equal(process.env.GITHUB_REF, "refs/heads/work/aa360-c60-auth-e2e-exact-sha-dispatch-20261021");
  assert.equal(process.env.AA_AUTH_DISPATCH_CANDIDATE_SHA, "c13748a5122b777b221ebc0325037ea967bc6d20");
  assert.equal(
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    "c13748a5122b777b221ebc0325037ea967bc6d20",
    "Refusing to run the manual harness on a different application revision",
  );
} else {
  assert.equal(process.env.GITHUB_EVENT_NAME, "pull_request");
}
assert.equal(process.env.AA_LOCAL_SUPABASE_E2E, "1");

const raw = execFileSync("supabase", ["status", "-o", "env"], {
  encoding: "utf8",
  timeout: 30_000,
});
const variables = Object.fromEntries(raw.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^["']|["']$/g, "")]] : [];
}));
const api = new URL(variables.API_URL);
assert.equal(api.protocol, "http:", "Supabase must be local HTTP before TLS proxying");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(api.hostname));
assert.equal(api.pathname, "/");
assert.equal(api.search, "");
assert.equal(api.hash, "");
assert.equal(api.username, "");
assert.equal(api.password, "");
assert.ok(variables.ANON_KEY);
for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]) {
  if (process.env[name]) {
    assert.equal(new URL(process.env[name]).origin, api.origin,
      "Refusing to override an existing non-local " + name);
  }
}

const email = "c26-" + randomUUID() + "@example.test";
const password = "LocalC26-" + randomBytes(20).toString("hex") + "!";
const client = createClient(api.toString(), variables.ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: account, error: signupError } = await client.auth.signUp({
  email,
  password,
});
if (signupError) throw new Error("Synthetic signup failed: " + signupError.message);
assert.ok(account.user?.id && account.session?.access_token);

const { data: grimoire, error: seedError } = await client
  .from("grimoires")
  .insert({ owner_id: account.user.id, title: "Grimório sintético C26" })
  .select("id")
  .single();
if (seedError) throw new Error("Synthetic grimoire seed failed: " + seedError.message);
assert.ok(grimoire?.id);
console.log("PASS: ephemeral local-only Auth identity and owned grimoire seeded");

// The production CSP requires HTTPS for cross-origin Supabase requests.
// Use a disposable TLS bridge instead of weakening CSP or disabling checks.
// Only locally generated TLS files are trusted by the test process.
const dir = mkdtempSync(join(tmpdir(), "aa-c26-local-tls-"));
const keyFile = join(dir, "localhost.key");
const certFile = join(dir, "localhost.crt");
let proxy;
const proxyPort = 54443;

function isProxyListening() {
  return new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port: proxyPort });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => { socket.destroy(); resolve(false); });
  });
}

try {
  execFileSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-sha256", "-nodes",
    "-days", "1", "-keyout", keyFile, "-out", certFile,
    "-subj", "/CN=localhost",
    "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ], { stdio: "ignore", timeout: 20_000 });

  proxy = spawn(process.execPath, [
    process.env.GITHUB_EVENT_NAME === "workflow_dispatch"
      ? "scripts/security/local-supabase-https-proxy-dispatch.mjs"
      : "scripts/security/local-supabase-https-proxy.mjs",
  ], {
    stdio: ["ignore", "inherit", "inherit"],
    env: {
      ...process.env,
      AA_LOCAL_SUPABASE_ORIGIN: api.origin,
      AA_LOCAL_TLS_KEY_FILE: keyFile,
      AA_LOCAL_TLS_CERT_FILE: certFile,
      AA_LOCAL_TLS_PORT: String(proxyPort),
    },
  });
  let ready = false;
  for (let retry = 0; retry < 30; retry += 1) {
    if (proxy.exitCode !== null) break;
    if (await isProxyListening()) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, "Loopback HTTPS test gateway failed to start");

  // Compile a disposable LOCAL synthetic build, not a release artifact.
  // Production "npm run build" remains subject to its hosted HTTPS guard in
  // the separate canonical Quality Gate; no production credentials exist here.
  const syntheticEnvironment = {
    ...process.env,
    NODE_EXTRA_CA_CERTS: certFile,
    NEXT_PUBLIC_SUPABASE_URL: "https://127.0.0.1:" + proxyPort + "/",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: variables.ANON_KEY,
    E2E_EMAIL: email,
    E2E_PASSWORD: password,
  };
  const build = spawnSync("npm", ["exec", "--", "next", "build", "--webpack"], {
    stdio: "inherit",
    timeout: 8 * 60_000,
    env: syntheticEnvironment,
  });
  if (build.error) throw build.error;
  assert.equal(build.signal, null, "Local Next.js build was interrupted");
  assert.equal(build.status, 0, "Local Next.js build failed");
  console.log("PASS: disposable local Next.js build compiled with unmodified production CSP");

  const result = spawnSync("npm", [
    "exec", "--", "playwright", "test",
    "tests/e2e/grimoires-workspace.spec.ts",
    "tests/e2e/practice.spec.ts",
    "tests/e2e/sanctuary.spec.ts",
    "--config=playwright.local-auth.config.ts",
  ], {
    stdio: "inherit",
    timeout: 11 * 60_000,
    env: syntheticEnvironment,
  });
  if (result.error) throw result.error;
  assert.equal(result.signal, null, "Authenticated Next.js E2E was interrupted");
  assert.equal(result.status, 0, "Authenticated Next.js E2E failed");
  console.log("PASS: authenticated Next.js journeys with unchanged CSP and local-only HTTPS");
} finally {
  if (proxy && proxy.exitCode === null) proxy.kill();
  rmSync(dir, { recursive: true, force: true });
}
