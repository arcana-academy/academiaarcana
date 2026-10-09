import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
const settings = Object.fromEntries(raw.split(/\r?\n/).flatMap((line) => {
  const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return m ? [[m[1], m[2].replace(/^["']|["']$/g, "")]] : [];
}));
assert.ok(settings.API_URL && settings.ANON_KEY);
const base = new URL(settings.API_URL);
assert.equal(base.protocol, "http:", "Only disposable local Auth is permitted");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname));

function client(failOnce = false) {
  const storage = new Map();
  let blocked = failOnce;
  return createClient(base.toString(), settings.ANON_KEY, {
    global: { fetch: async (input, init) => {
      if (blocked && String(input).includes("/auth/v1/logout?scope=global")) {
        blocked = false;
        return new Response(JSON.stringify({ code: "local_test_503", msg: "temporary" }), {
          status: 503, headers: { "content-type": "application/json" },
        });
      }
      return fetch(input, init);
    } },
    auth: {
      autoRefreshToken: false, persistSession: true, detectSessionInUrl: false,
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => { storage.set(key, value); },
        removeItem: (key) => { storage.delete(key); },
      },
    },
  });
}
function ok(result) { assert.ifError(result.error); return result.data; }
function claim(jwt, name) {
  return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"))[name];
}
async function jwtRows(jwt) {
  const url = new URL("/rest/v1/grimoires?select=id", base);
  const response = await fetch(url, {
    headers: { apikey: settings.ANON_KEY, Authorization: "Bearer " + jwt },
  });
  assert.equal(response.status, 200, "PostgREST retained access JWT");
  return response.json();
}
async function main() {
  const a1 = client(true), a2 = client(), b = client();
  const tag = Date.now() + "-" + process.pid;
  const emailA = "p1-a-" + tag + "@example.test";
  const emailB = "p1-b-" + tag + "@example.test";
  const password = "P1-Synthetic-Local-2026!";
  const aa = ok(await a1.auth.signUp({ email: emailA, password }));
  const bb = ok(await b.auth.signUp({ email: emailB, password }));
  assert.ok(aa.user && aa.session && bb.user && bb.session);
  const second = ok(await a2.auth.signInWithPassword({ email: emailA, password }));
  assert.ok(second.session);
  assert.notEqual(claim(aa.session.access_token, "session_id"), claim(second.session.access_token, "session_id"));
  assert.notEqual(aa.user.id, bb.user.id);
  const rowA = ok(await a2.from("grimoires").insert({ owner_id: aa.user.id, title: "P1 A" }).select("id").single());
  const rowB = ok(await b.from("grimoires").insert({ owner_id: bb.user.id, title: "P1 B" }).select("id").single());
  assert.deepEqual(ok(await a2.from("grimoires").select("id")).map((x) => x.id), [rowA.id]);
  assert.deepEqual(ok(await b.from("grimoires").select("id")).map((x) => x.id), [rowB.id]);
  const denied = ok(await a2.from("grimoires").update({ title: "denied" }).eq("id", rowB.id).select("id"));
  assert.equal(denied.length, 0);
  console.log("PASS AUTH-P1-021/024: A1/A2/B independent sessions and RLS");

  const original = ok(await a1.auth.getSession()).session;
  assert.ok(original?.access_token && original.refresh_token);
  const failure = await a1.auth.admin.signOut(original.access_token, "global");
  assert.equal(failure.error?.status, 503);
  const retained = ok(await a1.auth.getSession()).session;
  assert.equal(retained?.access_token, original.access_token);
  assert.equal(retained?.refresh_token, original.refresh_token);
  assert.ok(ok(await a2.auth.refreshSession()).session);
  console.log("PASS AUTH-P1-026: injected error keeps the original refresh credential");

  const previousJwt = ok(await a2.auth.getSession()).session.access_token;
  assert.ok(claim(previousJwt, "exp") > Math.floor(Date.now() / 1000));
  const revoked = await a1.auth.admin.signOut(original.access_token, "global");
  assert.ifError(revoked.error);
  assert.ok((await a1.auth.refreshSession()).error, "A1 refresh must be rejected");
  assert.ok((await a2.auth.refreshSession()).error, "A2 refresh must be rejected");
  assert.ok(ok(await b.auth.refreshSession()).session, "B must remain active");
  console.log("PASS AUTH-P1-022/023: remote global revocation removes A1/A2 but not B");

  assert.deepEqual((await jwtRows(previousJwt)).map((x) => x.id), [rowA.id]);
  console.log("PASS AUTH-P1-025: previously issued access JWT remains valid until exp");
}
main().catch((error) => {
  console.error("FAIL P1 local proof:", error.name);
  process.exitCode = 1;
});
