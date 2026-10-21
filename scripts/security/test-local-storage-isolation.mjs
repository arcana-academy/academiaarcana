import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// C64: Never run this harness against hosted Supabase or a production identity.
const APP_SHA = "6621977d477f65acc11f73e96697eb2e272bddec";
const QA_REF = "refs/heads/work/aa360-c64-local-storage-isolation-20261021";
assert.equal(process.env.GITHUB_ACTIONS, "true");
assert.equal(process.env.GITHUB_REPOSITORY, "arcana-academy/academiaarcana");
assert.equal(process.env.GITHUB_EVENT_NAME, "workflow_dispatch");
assert.equal(process.env.GITHUB_REF, QA_REF);
assert.equal(process.env.AA_C64_LOCAL_STORAGE_QA, "1");
assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), APP_SHA);

const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8", timeout: 30_000 });
const env = Object.fromEntries(raw.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^["']|["']$/g, "")]] : [];
}));
assert.ok(env.API_URL && env.ANON_KEY, "Missing disposable local Supabase details");
const api = new URL(env.API_URL);
assert.equal(api.protocol, "http:");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(api.hostname));
assert.equal(api.pathname, "/");
assert.equal(api.search, "");
assert.equal(api.hash, "");
assert.equal(api.username, "");
assert.equal(api.password, "");
for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]) {
  if (process.env[name]) {
    assert.equal(new URL(process.env[name]).origin, api.origin,
      "Refusing a non-local Supabase URL in " + name);
  }
}
const bucket = "grimoire-covers";
const key = env.ANON_KEY;
const makeClient = () => createClient(api.toString(), key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const a = makeClient();
const b = makeClient();
const anonymous = makeClient();
const password = "C64-" + randomBytes(18).toString("hex") + "!aA9";
function success(response, label) {
  assert.ifError(response.error, label + ": " + (response.error?.message ?? ""));
  return response.data;
}
function denied(response, label) {
  assert.ok(response.error, label + " must be denied");
}
function found(items, filename) {
  return (items ?? []).some((item) => item.name === filename);
}
function blobEqual(blob, expected, label) {
  return blob.arrayBuffer().then((bytes) => {
    assert.deepEqual(Buffer.from(bytes), expected, label);
  });
}

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nEsAAAAASUVORK5CYII=", "base64");
const replacement = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nEsAAAAASUVORK5CYII=", "base64");
assert.ok(png.length > 0);

async function main() {
  const emailA = "c64-a-" + randomUUID() + "@example.test";
  const emailB = "c64-b-" + randomUUID() + "@example.test";
  const accountA = success(await a.auth.signUp({ email: emailA, password }), "signup A");
  const accountB = success(await b.auth.signUp({ email: emailB, password }), "signup B");
  const uidA = accountA.user?.id, uidB = accountB.user?.id;
  assert.ok(uidA && uidB && accountA.session?.access_token && accountB.session?.access_token);
  assert.notEqual(uidA, uidB);
  const nonce = randomUUID();
  const fileA = "c64-" + nonce + "-a.png";
  const fileB = "c64-" + nonce + "-b.png";
  const pathA = uidA + "/" + fileA;
  const pathB = uidB + "/" + fileB;
  const coversA = a.storage.from(bucket);
  const coversB = b.storage.from(bucket);
  const coversGuest = anonymous.storage.from(bucket);
  const options = { contentType: "image/png", upsert: false };

  // Owner create/read/list; a second owner can independently create/read/list.
  success(await coversA.upload(pathA, png, options), "A uploads own cover");
  success(await coversB.upload(pathB, png, options), "B uploads own cover");
  assert.ok(found(success(await coversA.list(uidA), "A lists own folder"), fileA));
  assert.ok(found(success(await coversB.list(uidB), "B lists own folder"), fileB));
  await blobEqual(success(await coversA.download(pathA), "A downloads own cover"), png, "A bytes intact");
  await blobEqual(success(await coversB.download(pathB), "B downloads own cover"), png, "B bytes intact");
  console.log("PASS C64: each synthetic identity can create, list, read its own files");

  // Cross-user reads/listing must not reveal object data or names.
  assert.ok(!found(success(await coversA.list(uidB), "A lists B folder"), fileB));
  assert.ok(!found(success(await coversB.list(uidA), "B lists A folder"), fileA));
  denied(await coversA.download(pathB), "A download B object");
  denied(await coversB.download(pathA), "B download A object");
  denied(await coversGuest.download(pathA), "anonymous download A object");
  const unauthenticatedPublic = await fetch(new URL(
    "/storage/v1/object/public/" + bucket + "/" + pathA,
    api,
  ));
  assert.ok(!unauthenticatedPublic.ok, "private bucket must not serve a public URL");
  console.log("PASS C64: private bucket, anonymous access, cross-owner read/list blocked");

  // Folder policy must reject foreign and non-owner object creation.
  denied(await coversB.upload(uidA + "/forged-" + nonce + ".png", png, options), "B upload into A folder");
  denied(await coversA.upload(uidB + "/forged-" + nonce + ".png", png, options), "A upload into B folder");
  denied(await coversB.upload("shared/c64-" + nonce + ".png", png, options), "B upload outside own folder");
  denied(await coversB.upload(uidB + "/../" + uidA + "/escape-" + nonce + ".png", png, options),
    "B traversal into A folder");
  console.log("PASS C64: forbidden owner-folder and manipulated paths blocked");

  // UPDATE/upsert/move/copy require access to source object; denial must preserve owner bytes.
  success(await coversA.update(pathA, png, { contentType: "image/png" }), "A updates own cover");
  success(await coversB.update(pathB, png, { contentType: "image/png" }), "B updates own cover");
  denied(await coversB.update(pathA, png, { contentType: "image/png" }), "B updates A cover");
  denied(await coversB.upload(pathA, png, { contentType: "image/png", upsert: true }), "B upserts A cover");
  denied(await coversB.move(pathA, uidB + "/stolen-" + nonce + ".png"), "B moves A cover");
  denied(await coversB.copy(pathA, uidB + "/copied-" + nonce + ".png"), "B copies A cover");
  const foreignDelete = await coversB.remove([pathA]);
  // Storage may return success with an empty array for an invisible object.
  if (!foreignDelete.error) {
    assert.equal((foreignDelete.data ?? []).length, 0, "B remove must not report deleting A object");
  }
  await blobEqual(success(await coversA.download(pathA), "A object survives B attacks"), png,
    "B must never overwrite/delete A content");
  assert.ok(!found(success(await coversB.list(uidB), "B folder after foreign attempts"), "stolen-" + nonce + ".png"));
  assert.ok(!found(success(await coversB.list(uidB), "B folder after copy denial"), "copied-" + nonce + ".png"));
  console.log("PASS C64: owner update allowed; cross-owner update/upsert/move/copy/delete ineffective");

  // Bucket constraints are part of actual Storage API enforcement.
  denied(await coversA.upload(uidA + "/bad-" + nonce + ".txt", Buffer.from("not an image"),
    { contentType: "text/plain" }), "non-image MIME");
  denied(await coversA.upload(uidA + "/oversize-" + nonce + ".png", Buffer.alloc(5 * 1024 * 1024 + 1),
    { contentType: "image/png" }), "5 MiB limit");
  console.log("PASS C64: MIME allowlist and max object size enforced by local Storage API");

  success(await coversA.remove([pathA]), "A removes own object");
  success(await coversB.remove([pathB]), "B removes own object");
  denied(await coversA.download(pathA), "deleted A file no longer readable");
  denied(await coversB.download(pathB), "deleted B file no longer readable");
  console.log("PASS C64: owners can delete own objects; deleted objects inaccessible");
  console.log("PASS C64: dynamic private Storage authorization with two synthetic users (local only)");
}
main().catch((error) => { console.error("FAIL C64:", error.message); process.exitCode = 1; });
