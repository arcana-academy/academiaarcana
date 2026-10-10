import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// P0 #536 — one-shot, synthetic ONLY, running from immutable last-LIVE source.
// Fatal guard: neither remote URLs nor service-role/admin keys may be used.
assert.equal(process.env.SUPABASE_ACCESS_TOKEN, undefined, "hosted access token not allowed");
assert.equal(process.env.DATABASE_URL, undefined, "remote database URL not allowed");

const raw = execFileSync("supabase", ["status", "-o", "env"], {
  encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "pipe"],
});
const config = Object.fromEntries(raw.split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^["']|["']$/g, "")]] : [];
}));
assert.ok(config.API_URL && config.ANON_KEY, "local Supabase public config required");
const api = new URL(config.API_URL);
assert.equal(api.protocol, "http:");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(api.hostname));
assert.equal(api.port, "54321", "CI must target only default isolated Supabase port");
assert.equal(api.pathname, "/");
const key = config.ANON_KEY; // Local-only test ANON key; NEVER read service-role key.

const opts = {
  auth: {
    autoRefreshToken: false, persistSession: true, detectSessionInUrl: false,
    storage: (() => {
      const values = new Map();
      return {
        getItem: k => values.get(k) ?? null,
        setItem: (k, v) => values.set(k, v),
        removeItem: k => values.delete(k),
      };
    })(),
  },
};
const client = () => createClient(api.toString(), key, {
  auth: { ...opts.auth, storage: (() => {
    const jar = new Map();
    return { getItem: k => jar.get(k) ?? null,
      setItem: (k,v) => jar.set(k,v), removeItem: k => jar.delete(k) };
  })() },
});
const ok = (result, label) => {
  if (result.error) throw new Error(label + ": " + result.error.message);
  return result.data;
};
const seed = randomUUID();
const password = "P0-isolated-only-" + randomBytes(18).toString("hex") + "!";
const emailA = "p0-http-a-" + seed + "@example.test";
const emailB = "p0-http-b-" + seed + "@example.test";
const a = client(), b = client(), anonymous = client();

const cookies = new Map();
const cookieState = {
  getAll() { return [...cookies].map(([name, c]) => ({ name, value: c.value })); },
  setAll(items) {
    for (const { name, value, options } of items) {
      assert.ok(typeof name === "string" && typeof value === "string");
      if (options?.maxAge === 0 || !value) cookies.delete(name);
      else cookies.set(name, { value, options });
    }
  },
};
const ssr = () => createServerClient(api.toString(), key, {
  cookies: cookieState,
  auth: { autoRefreshToken: false, detectSessionInUrl: false },
});

async function rawApi(identityJwt, path) {
  const res = await fetch(new URL(path, api), {
    headers: {
      apikey: key,
      Authorization: "Bearer " + identityJwt,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  return { response: res, body: await res.json().catch(() => null) };
}

async function main() {
  const registeredA = ok(await a.auth.signUp({ email: emailA, password }), "create local user A");
  const registeredB = ok(await b.auth.signUp({ email: emailB, password }), "create local user B");
  assert.ok(registeredA.user?.id && registeredA.session?.access_token);
  assert.ok(registeredB.user?.id && registeredB.session?.access_token);
  assert.notEqual(registeredA.user.id, registeredB.user.id);
  const uidA = registeredA.user.id, uidB = registeredB.user.id;
  const jwtA = registeredA.session.access_token, jwtB = registeredB.session.access_token;
  console.log("PASS: Auth HTTP creates two isolated synthetic users");

  const getA = await rawApi(jwtA, "/auth/v1/user");
  const getB = await rawApi(jwtB, "/auth/v1/user");
  assert.equal(getA.response.status, 200);
  assert.equal(getB.response.status, 200);
  assert.equal(getA.body.id, uidA);
  assert.equal(getB.body.id, uidB);
  const noUser = await rawApi(key, "/auth/v1/user");
  assert.notEqual(noUser.response.status, 200);
  console.log("PASS: HTTP Auth requires valid user JWT and preserves identity");

  // Supabase SSR sets/carries auth cookies; simulate Next's getAll/setAll
  // adapter and confirm the session survives a fresh server-client instance.
  const authViaCookie = ok(await ssr().auth.signInWithPassword({
    email: emailA, password,
  }), "SSR session cookie sign-in");
  assert.equal(authViaCookie.user.id, uidA);
  assert.ok(cookies.size > 0, "SSR setAll must persist session cookie(s)");
  const keys = [...cookies.keys()];
  assert.ok(keys.every(n => !n.includes("service_role")));
  const sessionFromCookie = await ssr().auth.getClaims();
  assert.ifError(sessionFromCookie.error);
  assert.equal(sessionFromCookie.data?.claims?.sub, uidA);
  const userFromCookie = await ssr().auth.getUser();
  assert.ifError(userFromCookie.error);
  assert.equal(userFromCookie.data?.user?.id, uidA);
  cookies.clear();
  const afterCookieLoss = await ssr().auth.getUser();
  assert.ok(afterCookieLoss.error || !afterCookieLoss.data?.user,
    "Missing session cookie must not authenticate the request");
  console.log("PASS: @supabase/ssr cookie write, replay, getClaims/getUser and missing-cookie denial");

  // PostgREST HTTP is the actual Data API, not a SQL mock.
  const rowA = ok(await a.from("grimoires").insert({
    owner_id: uidA, title: "Synthetic HTTP owner A",
  }).select("id").single(), "A create grimoire");
  const rowB = ok(await b.from("grimoires").insert({
    owner_id: uidB, title: "Synthetic HTTP owner B",
  }).select("id").single(), "B create grimoire");
  const restA = await rawApi(jwtA, "/rest/v1/grimoires?select=id&order=id.asc");
  const restB = await rawApi(jwtB, "/rest/v1/grimoires?select=id&order=id.asc");
  assert.equal(restA.response.status, 200);
  assert.equal(restB.response.status, 200);
  assert.deepEqual(restA.body.map(r => r.id), [rowA.id]);
  assert.deepEqual(restB.body.map(r => r.id), [rowB.id]);
  const unauth = await rawApi(key, "/rest/v1/grimoires?select=id");
  assert.ok(unauth.response.status === 200 || unauth.response.status === 401 ||
    unauth.response.status === 403);
  assert.ok(!Array.isArray(unauth.body) || unauth.body.length === 0,
    "Anonymous client must not read owned grimoire rows");
  const forged = await a.from("grimoires").insert({
    owner_id: uidB, title: "Denied cross-user grimoire",
  }).select("id");
  assert.ok(forged.error, "RLS must reject forged owner on INSERT");
  const invisibleUpdate = ok(await b.from("grimoires")
    .update({ title: "Illegal cross-user edit" }).eq("id", rowA.id)
    .select("id"), "B tries modifying A grimoire");
  assert.equal(invisibleUpdate.length, 0);
  console.log("PASS: PostgREST HTTP anonymous denial, two-account SELECT and cross-owner INSERT/UPDATE");

  // The tracked bucket only permits images. No real photos, accounts or files.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLqUQAAAABJRU5ErkJggg==",
    "base64",
  );
  const filename = "p0-536-" + seed + ".png";
  const pathA = uidA + "/" + filename;
  const pathB = uidB + "/" + filename;
  const bucketA = a.storage.from("grimoire-covers");
  const bucketB = b.storage.from("grimoire-covers");
  const bucketGuest = anonymous.storage.from("grimoire-covers");
  ok(await bucketA.upload(pathA, png, { contentType: "image/png", upsert: false }),
    "A upload synthetic PNG in own folder");
  ok(await bucketB.upload(pathB, png, { contentType: "image/png", upsert: false }),
    "B upload synthetic PNG in own folder");
  const owned = ok(await bucketA.download(pathA), "A read own private PNG");
  assert.deepEqual(Buffer.from(await owned.arrayBuffer()), png);
  const foreign = await bucketB.download(pathA);
  assert.ok(foreign.error, "B must be forbidden from reading A private PNG");
  const visitor = await bucketGuest.download(pathA);
  assert.ok(visitor.error, "Anonymous must not read A private PNG");
  const badUpload = await bucketB.upload(uidA + "/forged-" + filename, png,
    { contentType: "image/png", upsert: false });
  assert.ok(badUpload.error, "B must not upload under A's folder");
  const wrongUpdate = await bucketB.update(pathA, png, { contentType: "image/png" });
  assert.ok(wrongUpdate.error, "B must not overwrite A private PNG");
  ok(await bucketA.update(pathA, png, { contentType: "image/png" }),
    "A updates own private PNG");
  // A cross-owner DELETE may return an empty-list success under RLS;
  // check the protected object's actual survival, not the HTTP status.
  await bucketB.remove([pathA]);
  const survivedCrossDelete = ok(await bucketA.download(pathA),
    "A still reads own PNG after B tries cross-owner DELETE");
  assert.deepEqual(Buffer.from(await survivedCrossDelete.arrayBuffer()), png,
    "B must not delete or corrupt A's private PNG");
  const removeA = ok(await bucketA.remove([pathA]), "A deletes own synthetic PNG");
  assert.ok(Array.isArray(removeA));
  ok(await bucketB.remove([pathB]), "B deletes own synthetic PNG");
  console.log("PASS: Storage HTTP private bucket owner-only upload/download/replace/delete and cross-user denial");
  console.log("CHECKPOINT P0-536: synthetic HTTP Auth, cookie replay, PostgREST and Storage PASS, local only");
}

main().catch(error => {
  // Never print tokens, passwords, cookie values, or Supabase CLI environment.
  console.error("FAIL: isolated HTTP proof:", error.message);
  process.exitCode = 1;
});
