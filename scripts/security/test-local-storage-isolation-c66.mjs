import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// C66: only the ephemeral checkout of PR #766, never a hosted instance.
const pinnedSha = "f769d0f4bc2d065c39480264e13c2a244a544c62";
const qaBranch = "refs/heads/work/aa360-c66-storage-loopback-qa-20261021";
assert.equal(process.env.GITHUB_ACTIONS, "true");
assert.equal(process.env.GITHUB_EVENT_NAME, "push");
assert.equal(process.env.GITHUB_REPOSITORY, "arcana-academy/academiaarcana");
assert.equal(process.env.GITHUB_REF, qaBranch);
assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), pinnedSha);
for (const key of ["SUPABASE_ACCESS_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
  assert.equal(process.env[key], undefined, "Refusing a preconfigured Supabase environment: " + key);
}
const output = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8", timeout: 20000 });
const cfg = Object.fromEntries(output.split(/\r?\n/).flatMap(line => {
  const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return m ? [[m[1], m[2].replace(/^["']|["']$/g, "")]] : [];
}));
assert.ok(cfg.API_URL && cfg.ANON_KEY, "Missing local public Supabase configuration");
const api = new URL(cfg.API_URL);
assert.equal(api.protocol, "http:");
assert.equal(api.hostname, "127.0.0.1");
assert.equal(api.port, "54321");
assert.equal(api.pathname, "/");
assert.equal(api.search, "");
assert.equal(api.hash, "");

function client() {
  const state = new Map();
  return createClient(api.toString(), cfg.ANON_KEY, { auth: {
    autoRefreshToken: false, persistSession: true, detectSessionInUrl: false,
    storage: { getItem: k => state.get(k) ?? null, setItem: (k, v) => state.set(k, v),
      removeItem: k => state.delete(k) },
  } });
}
function accepted(res, description) {
  if (res.error) throw new Error(description + ": " + res.error.message);
  return res.data;
}
async function denied(res, description) {
  // Storage list/remove may silently return empty results under RLS. For
  // read/update/move/copy, require a failed operation, not a bare HTTP success.
  assert.ok(res.error, description + " unexpectedly succeeded");
}
async function readBytes(storage, path, label) {
  const data = accepted(await storage.download(path), label);
  return Buffer.from(await data.arrayBuffer());
}

async function run() {
  const seed = randomUUID();
  const password = "C66-isolated-" + randomBytes(18).toString("hex") + "!";
  const a = client(), b = client(), guest = client();
  const aa = accepted(await a.auth.signUp({ email: "c64-a-" + seed + "@example.test", password }), "signup A");
  const bb = accepted(await b.auth.signUp({ email: "c64-b-" + seed + "@example.test", password }), "signup B");
  assert.ok(aa.user?.id && aa.session?.access_token && bb.user?.id && bb.session?.access_token);
  assert.notEqual(aa.user.id, bb.user.id);
  const uidA = aa.user.id, uidB = bb.user.id;
  const A = a.storage.from("grimoire-covers");
  const B = b.storage.from("grimoire-covers");
  const G = guest.storage.from("grimoire-covers");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLqUQAAAABJRU5ErkJggg==", "base64");
  const first = "c64-" + seed + ".png";
  const pathA = uidA + "/" + first, pathB = uidB + "/" + first;
  const movedOwn = uidA + "/nested/" + first;
  const foreignTarget = uidA + "/c64-foreign-" + seed + ".png";
  const foreignCopy = uidA + "/nested/c64-copy-" + seed + ".png";
  const nestedForged = uidA + "/nested/c64-inject-" + seed + ".png";
  const encodedForged = uidA + "/%2F" + first;
  const cleanupA = new Set(), cleanupB = new Set();

  try {
    accepted(await A.upload(pathA, png, { contentType: "image/png", upsert: false }), "A creates synthetic file");
    cleanupA.add(pathA);
    accepted(await B.upload(pathB, png, { contentType: "image/png", upsert: false }), "B creates synthetic file");
    cleanupB.add(pathB);
    assert.deepEqual(await readBytes(A, pathA, "A reads own"), png);
    assert.deepEqual(await readBytes(B, pathB, "B reads own"), png);
    console.log("PASS C66: two separate authenticated owners can create and read their own synthetic PNGs");

    const ownListing = accepted(await A.list(uidA, { limit: 100 }), "A lists own directory");
    assert.ok(ownListing.some(x => x.name === first), "A should list its own file");
    const crossListing = await B.list(uidA, { limit: 100 });
    assert.ok(crossListing.error || !(crossListing.data ?? []).some(x => x.name === first),
      "B must not see A objects in foreign folder listing");
    const guestListing = await G.list(uidA, { limit: 100 });
    assert.ok(guestListing.error || !(guestListing.data ?? []).some(x => x.name === first),
      "Guest must not list A private objects");
    await denied(await B.createSignedUrl(pathA, 60), "B signs URL for A object");
    await denied(await G.createSignedUrl(pathA, 60), "Guest signs URL for A object");
    const signed = accepted(await A.createSignedUrl(pathA, 60), "A signs own private object");
    assert.ok(signed.signedUrl);
    const signedUrl = new URL(signed.signedUrl, api);
    assert.equal(signedUrl.origin, api.origin, "Signed URL must be entirely local");
    const signedRead = await fetch(signedUrl, { signal: AbortSignal.timeout(12000) });
    assert.equal(signedRead.status, 200, "Owner-generated signed URL must work");
    assert.deepEqual(Buffer.from(await signedRead.arrayBuffer()), png);
    const publicUrl = A.getPublicUrl(pathA).data.publicUrl;
    const publicParsed = new URL(publicUrl);
    assert.equal(publicParsed.origin, api.origin);
    const forbiddenPublic = await fetch(publicParsed, { signal: AbortSignal.timeout(12000) });
    assert.notEqual(forbiddenPublic.status, 200, "Private object must not be publicly accessible");
    console.log("PASS C66: owner listing/signed URLs and private-object public/foreign denial");

    await denied(await B.upload(nestedForged, png, { contentType: "image/png", upsert: false }),
      "B injects nested file into A folder");
    await denied(await B.upload(encodedForged, png, { contentType: "image/png", upsert: false }),
      "B injects encoded filename into A folder");
    await denied(await B.copy(pathB, foreignCopy), "B copies own object into A folder");
    await denied(await B.update(pathA, png, { contentType: "image/png" }), "B overwrites A object");
    await B.remove([pathA]);
    assert.deepEqual(await readBytes(A, pathA, "A object must survive B delete attempt"), png);
    console.log("PASS C66: nested/encoded upload and foreign copy/overwrite/delete denial");

    accepted(await A.move(pathA, movedOwn), "A moves own object inside owner folder");
    cleanupA.delete(pathA);
    cleanupA.add(movedOwn);
    assert.deepEqual(await readBytes(A, movedOwn, "A reads moved own object"), png);
    // Critical regression: UPDATE must not let an owner put their objects
    // under another account's namespace (owner_id alone is insufficient).
    const crossMove = await B.move(pathB, foreignTarget);
    if (!crossMove.error) {
      cleanupB.delete(pathB);
      cleanupB.add(foreignTarget);
      throw new Error("SECURITY C66: B moved an owned object into A namespace: UPDATE permits forged folder");
    }
    assert.deepEqual(await readBytes(B, pathB, "B own file survives rejected move"), png);
    const foreignList = accepted(await A.list(uidA, { limit: 100 }), "A lists after B move denial");
    assert.ok(!foreignList.some(x => x.name === "c64-foreign-" + seed + ".png"));
    console.log("PASS C66: same-owner move accepted, cross-owner destination move denied");

    await denied(await A.upload(uidA + "/not-image-" + seed + ".txt", Buffer.from("not an image"),
      { contentType: "text/plain", upsert: false }), "disallowed MIME");
    await denied(await A.upload(uidA + "/oversized-" + seed + ".png", Buffer.alloc(5 * 1024 * 1024 + 1),
      { contentType: "image/png", upsert: false }), "oversized PNG");
    console.log("PASS C66: bucket MIME allowlist and 5 MB limit enforced");
  } finally {
    // Local container is destroyed; best-effort cleanup is additional hygiene.
    await Promise.allSettled([...cleanupA].map(p => A.remove([p])));
    await Promise.allSettled([...cleanupB].map(p => B.remove([p])));
  }
  console.log("PASS C66: incremental Storage ACL tests complete (ephemeral only)");
}
run().catch(error => { console.error("FAIL C66:", error.message); process.exitCode = 1; });
