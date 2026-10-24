import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Fail closed: only an explicit opt-in and the ephemeral loopback Supabase
// project reported by the local CLI are accepted. Never use hosted credentials.
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
assert.equal(api.protocol, "http:");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(api.hostname));
assert.equal(api.pathname, "/");
assert.equal(api.search, "");
assert.equal(api.hash, "");
assert.equal(api.username, "");
assert.equal(api.password, "");
assert.ok(variables.ANON_KEY, "Local Supabase must provide its synthetic anon key");

const localClient = () => createClient(api.toString(), variables.ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createSyntheticIdentity(label) {
  const email = `ai-rate-${label}-${randomUUID()}@example.test`;
  const password = `LocalRate-${randomBytes(24).toString("hex")}!`;
  const client = localClient(email, password);
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(`Synthetic local ${label} signup failed: ${error.message}`);
  assert.ok(data.user?.id && data.session?.access_token);
  return client;
}

async function consume(client) {
  const { data, error } = await client.rpc("consume_open_source_ai_rate_limit");
  if (error) throw new Error(`Local rate-limit RPC failed: ${error.message}`);
  assert.ok(Array.isArray(data) && data.length === 1);
  const [result] = data;
  assert.equal(typeof result.allowed, "boolean");
  assert.equal(result.rate_limit, 20);
  assert.ok(Number.isInteger(result.remaining));
  assert.ok(Number.isInteger(result.retry_after_seconds));
  return result;
}

const userA = await createSyntheticIdentity("a");
const userB = await createSyntheticIdentity("b");
const burst = await Promise.all(Array.from({ length: 24 }, () => consume(userA)));
const allowed = burst.filter(({ allowed: isAllowed }) => isAllowed);
const limited = burst.filter(({ allowed: isAllowed }) => !isAllowed);
assert.equal(allowed.length, 20, "Atomic limiter must grant exactly 20 concurrent slots");
assert.equal(limited.length, 4, "Excess concurrent requests must be denied");
assert.ok(limited.every(({ remaining, retry_after_seconds }) =>
  remaining === 0 && retry_after_seconds >= 1 && retry_after_seconds <= 60));

const independentUser = await consume(userB);
assert.equal(independentUser.allowed, true, "A second account has an independent quota");
assert.equal(independentUser.remaining, 19);

console.log("PASS: 24 parallel synthetic local requests yielded exactly 20 slots and 4 denials");
console.log("PASS: separate synthetic account received an independent durable quota");
