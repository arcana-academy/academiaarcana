import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// Fail closed: never direct synthetic-account tests at a hosted database.
const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
const variables = Object.fromEntries(raw.split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^["']|["']$/g, "")]] : [];
}));
const url = new URL(variables.API_URL);
assert.equal(url.protocol, "http:");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
assert.ok(variables.ANON_KEY);

function client() {
  const entries = new Map();
  return createClient(url.toString(), variables.ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: true, detectSessionInUrl: false,
      storage: { getItem: k => entries.get(k) ?? null,
        setItem: (k, v) => entries.set(k, v), removeItem: k => entries.delete(k) } },
  });
}
function ok(result) { assert.ifError(result.error); return result.data; }
function sessionId(jwt) {
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
  assert.ok(payload.exp && payload.session_id);
  return payload.session_id;
}
async function main() {
  const a1 = client(), a2 = client(), b = client();
  const seed = `${Date.now()}-${process.pid}`;
  const emailA = `a-${seed}@example.test`, emailB = `b-${seed}@example.test`;
  const password = "Isolated-Auth-QA-2026!";
  const aa = ok(await a1.auth.signUp({ email: emailA, password }));
  const bb = ok(await b.auth.signUp({ email: emailB, password }));
  assert.ok(aa.user && aa.session && bb.user && bb.session);
  const second = ok(await a2.auth.signInWithPassword({ email: emailA, password }));
  assert.ok(second.session);
  assert.notEqual(sessionId(aa.session.access_token), sessionId(second.session.access_token));
  assert.notEqual(aa.user.id, bb.user.id);

  const rowA = ok(await a2.from("grimoires").insert({ owner_id: aa.user.id, title: "test A" }).select("id").single());
  const rowB = ok(await b.from("grimoires").insert({ owner_id: bb.user.id, title: "test B" }).select("id").single());
  const aRows = ok(await a2.from("grimoires").select("id"));
  const bRows = ok(await b.from("grimoires").select("id"));
  assert.deepEqual(aRows.map(x => x.id), [rowA.id]);
  assert.deepEqual(bRows.map(x => x.id), [rowB.id]);
  const attempted = ok(await a2.from("grimoires").update({ title: "denied" }).eq("id", rowB.id).select("id"));
  assert.equal(attempted.length, 0);
  console.log("PASS: isolated two-account RLS behavior");

  ok(await a1.auth.signOut({ scope: "global" }));
  assert.ok((await a2.auth.refreshSession()).error, "Session A2 must not refresh");
  assert.ok(ok(await b.auth.refreshSession()).session, "Independent B session must survive");
  console.log("PASS: global sign-out revokes other refresh token; B remains signed in");
  console.log("NOTE: old access JWT validity until exp is not asserted or misreported");
}
main().catch(error => { console.error("FAIL: local Auth QA:", error.message); process.exitCode = 1; });
