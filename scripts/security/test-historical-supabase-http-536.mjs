// P0 #536 — intentionally ephemeral HTTP Auth/RLS/Storage test for the last-LIVE code.
// Run ONLY from a disposable local Supabase instance using locally generated keys.
// Refuse all remote hosts and never print tokens, secrets, passwords or user records.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const statusText = execFileSync("supabase", ["status", "-o", "json"], {
  encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"],
});
const jsonStart = statusText.indexOf("{");
if (jsonStart < 0) throw new Error("Supabase local status is not JSON");
const status = JSON.parse(statusText.slice(jsonStart));
const url = status.API_URL ?? status.api_url;
const anon = status.ANON_KEY ?? status.anon_key;
const adminKey = status.SERVICE_ROLE_KEY ?? status.service_role_key;
const endpoint = new URL(url ?? "http://invalid.local/");
if (!["127.0.0.1", "localhost"].includes(endpoint.hostname) ||
    endpoint.protocol !== "http:" || endpoint.port !== "54321" ||
    !anon || !adminKey || adminKey === anon ||
    process.env.DATABASE_URL || process.env.SUPABASE_ACCESS_TOKEN ||
    process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("ABORT: only an isolated local Supabase stack may be exercised.");
}

function clientWithCookies() {
  const jar = new Map();
  const adapter = () => ({
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (items) => {
      for (const { name, value, options } of items) {
        if (options?.maxAge === 0 || !value) jar.delete(name);
        else jar.set(name, value);
      }
    },
  });
  const client = () => createServerClient(url, anon, {
    cookies: adapter(),
    auth: { autoRefreshToken: false, persistSession: true },
  });
  return { jar, client };
}
const syntheticPassword = "local-test-" + randomUUID() + "-Aa7!";
const createdUserIds = [];
const suffix = randomUUID().slice(0, 8);
const users = [0, 1].map((i) => ({
  email: `p0-fallback-${suffix}-${i}@example.test`,
  password: syntheticPassword,
}));
const admin = createClient(url, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
async function safeCheck(name, fn) {
  await fn();
  process.stdout.write("PASS: " + name + "\n");
}
for (const u of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email, password: u.password, email_confirm: true,
  });
  assert.ifError(error);
  assert.ok(data?.user?.id);
  u.id = data.user.id;
  createdUserIds.push(u.id);
}
const a = clientWithCookies(), b = clientWithCookies();
let ca = a.client(), cb = b.client();
for (const [u, client] of [[users[0], ca], [users[1], cb]]) {
  const { data, error } = await client.auth.signInWithPassword({
    email: u.email, password: u.password,
  });
  assert.ifError(error);
  assert.equal(data?.user?.id, u.id);
}
await safeCheck("local HTTP password Auth for two synthetic users", async () => {
  assert.ok(a.jar.size > 0 && b.jar.size > 0);
  assert.notDeepEqual([...a.jar.values()], [...b.jar.values()]);
  // A fresh SSR server-client reads only the request cookie jar.
  ca = a.client();
  cb = b.client();
  const [ra, rb, claimsA, claimsB] = await Promise.all([
    ca.auth.getUser(), cb.auth.getUser(),
    ca.auth.getClaims(), cb.auth.getClaims(),
  ]);
  assert.ifError(ra.error); assert.ifError(rb.error);
  assert.ifError(claimsA.error); assert.ifError(claimsB.error);
  assert.equal(ra.data.user.id, users[0].id);
  assert.equal(rb.data.user.id, users[1].id);
  assert.equal(claimsA.data.claims.sub, users[0].id);
  assert.equal(claimsB.data.claims.sub, users[1].id);
});
const first = "p0-536-grimoire-" + suffix;
await safeCheck("HTTP PostgREST authenticated ownership and cross-user RLS", async () => {
  const ins = await ca.from("grimoires").insert({ owner_id: users[0].id, title: first }).select("id").single();
  assert.ifError(ins.error);
  assert.ok(ins.data?.id);
  users[0].grimoire = ins.data.id;
  const owner = await ca.from("grimoires").select("id").eq("id", ins.data.id);
  const other = await cb.from("grimoires").select("id").eq("id", ins.data.id);
  assert.ifError(owner.error); assert.ifError(other.error);
  assert.equal(owner.data.length, 1);
  assert.equal(other.data.length, 0);
  const forbidden = await cb.from("grimoires").insert({
    owner_id: users[0].id, title: "forged-other-owner",
  });
  assert.ok(forbidden.error, "RLS should reject spoofed owner_id");
  const anonClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const anonymous = await anonClient.from("grimoires").select("id").limit(1);
  assert.ok(anonymous.error || (anonymous.data ?? []).length === 0);
});
await safeCheck("HTTP Feedback RLS and protected owner insertion", async () => {
  const ins = await ca.from("feedback_responses").insert({
    user_id: users[0].id, email: users[0].email, feedback: "Synthetic local HTTP test",
  }).select("id").single();
  assert.ifError(ins.error);
  assert.ok(ins.data?.id);
  const other = await cb.from("feedback_responses").select("id").eq("id", ins.data.id);
  assert.ifError(other.error);
  assert.equal(other.data.length, 0);
  const forged = await cb.from("feedback_responses").insert({
    user_id: users[0].id, email: users[1].email, feedback: "spoof",
  });
  assert.ok(forged.error);
});
const img = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Z7N8nEAAAAASUVORK5CYII=",
  "base64"
);
const pathA = users[0].id + "/p0-536-" + suffix + ".png";
const pathB = users[1].id + "/p0-536-" + suffix + ".png";
await safeCheck("HTTP private Storage upload/download and cross-user denial", async () => {
  const ownUpload = await ca.storage.from("grimoire-covers").upload(pathA, img, {
    contentType: "image/png", upsert: false,
  });
  assert.ifError(ownUpload.error);
  const ownRead = await ca.storage.from("grimoire-covers").download(pathA);
  assert.ifError(ownRead.error);
  assert.ok((await ownRead.data.arrayBuffer()).byteLength > 0);
  const otherRead = await cb.storage.from("grimoire-covers").download(pathA);
  assert.ok(otherRead.error, "Cross-user Storage download must fail");
  const anonClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const noAuthRead = await anonClient.storage.from("grimoire-covers").download(pathA);
  assert.ok(noAuthRead.error, "Anonymous private Storage download must fail");
  const wrongUpload = await cb.storage.from("grimoire-covers").upload(users[0].id + "/spoof-" + suffix + ".png", img, {
    contentType: "image/png",
  });
  assert.ok(wrongUpload.error, "Cross-user Storage path spoof must fail");
  const ownB = await cb.storage.from("grimoire-covers").upload(pathB, img, { contentType: "image/png" });
  assert.ifError(ownB.error);
  const ownUpsert = await ca.storage.from("grimoire-covers").upload(pathA, img, {
    contentType: "image/png", upsert: true,
  });
  assert.ifError(ownUpsert.error);
});
await safeCheck("SSR cookie-backed Auth logout and local teardown", async () => {
  const logout = await ca.auth.signOut();
  assert.ifError(logout.error);
  const reopened = a.client();
  const session = await reopened.auth.getSession();
  assert.ifError(session.error);
  assert.equal(session.data.session, null);
  const ownRead = await reopened.from("grimoires").select("id").eq("id", users[0].grimoire);
  assert.ok(ownRead.error || (ownRead.data ?? []).length === 0);
  // Synthetic data and users never leave the ephemeral stack. Optional cleanup:
  await cb.storage.from("grimoire-covers").remove([pathB]);
});
console.log("All locally-scoped HTTP Auth, SSR cookie bridge, RLS and Storage tests passed.");
