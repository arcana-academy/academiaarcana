import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

// P0 #536 — disposable Next.js 16 dev HTTP/browser + local Supabase only.
// Never point this test at a hosted Supabase project or the LIVE Render URL.
for (const forbidden of ["DATABASE_URL", "SUPABASE_ACCESS_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "OPENAI_API_KEY"]) {
  assert.ok(!process.env[forbidden], "Forbidden hosted credential or URL environment: " + forbidden);
}
const env = execFileSync("supabase", ["status", "-o", "env"], {
  timeout: 25000, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
});
const entries = Object.fromEntries(env.split(/\r?\n/).flatMap((line) => {
  const matched = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return matched ? [[matched[1], matched[2].replace(/^["']|["']$/g, "")]] : [];
}));
assert.ok(entries.API_URL && entries.ANON_KEY, "Local API_URL/ANON_KEY must exist");
const localUrl = new URL(entries.API_URL);
assert.equal(localUrl.protocol, "http:");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(localUrl.hostname));
assert.equal(localUrl.port, "54321");
assert.equal(localUrl.pathname, "/");
const origin = "http://127.0.0.1:3000";
const authKey = entries.ANON_KEY;
const password = "Only-local-" + randomBytes(17).toString("hex") + "!Aa3";
const instance = randomUUID();
const emailA = "historic-browser-a-" + instance + "@example.test";
const emailB = "historic-browser-b-" + instance + "@example.test";
const client = () => createClient(entries.API_URL, authKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const a = client(), b = client();
function unwrap(result, what) {
  if (result.error) throw Error(what + ": " + result.error.message);
  return result.data;
}
function safeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/sb_[a-z]+_[A-Za-z0-9_-]+/g, "[REDACTED]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_.-]+/g, "[JWT-REDACTED]")
    .replace(/Only-local-\w+/g, "[PASSWORD-REDACTED]");
}
async function waitForNext(child) {
  for (let i = 0; i < 160; i++) {
    if (child.exitCode !== null) throw Error("Historical Next.js process exited during startup");
    try {
      const result = await fetch(origin + "/api/health", {
        signal: AbortSignal.timeout(5000),
        redirect: "manual",
      });
      if (result.ok && (await result.json()).status === "ok") return;
    } catch { /* Next is compiling the local route; retry with bounded timeout. */ }
    await sleep(1000);
  }
  throw Error("Historical Next.js did not become healthy after 160 seconds");
}
function restrictBrowser(context) {
  return context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname)
        && ["3000", "54321"].includes(url.port)) {
      return route.continue();
    }
    return route.abort();
  });
}
async function loginViaRealUI(page, email) {
  await page.goto(origin + "/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Entrar" }).waitFor();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/santuario(?:[?#]|$)/, { timeout: 90000 });
}
async function verifyLibrary(page, ownTitle, otherTitle) {
  await page.goto(origin + "/grimorios", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Grimórios", exact: true }).waitFor();
  await page.getByRole("heading", { name: ownTitle, exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: otherTitle, exact: true }).count(), 0,
    "Cross-account Grimoire leaked through historical Next.js SSR");
  assert.equal(await page.getByRole("alert", { name: "Não foi possível carregar os grimórios" }).count(), 0);
}
let server, browser;
const output = [];
try {
  const createdA = unwrap(await a.auth.signUp({ email: emailA, password }), "local A signup");
  const createdB = unwrap(await b.auth.signUp({ email: emailB, password }), "local B signup");
  assert.ok(createdA.user?.id && createdA.session?.access_token, "Local A signup auto-confirmation required");
  assert.ok(createdB.user?.id && createdB.session?.access_token, "Local B signup auto-confirmation required");
  assert.notEqual(createdA.user.id, createdB.user.id);
  const uidA = createdA.user.id, uidB = createdB.user.id;
  const titleA = "P0-536 Grimoire A " + instance;
  const titleB = "P0-536 Grimoire B " + instance;
  unwrap(await a.from("grimoires").insert({ owner_id: uidA, title: titleA }).select("id").single(),
    "seed A owned grimoire");
  unwrap(await b.from("grimoires").insert({ owner_id: uidB, title: titleB }).select("id").single(),
    "seed B owned grimoire");

  const nextEnv = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: entries.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: authKey,
    NEXT_PUBLIC_HONEYBADGER_API_KEY: "",
    NEXT_PUBLIC_HONEYBADGER_ASSETS_URL: "",
    RENDER_GIT_COMMIT: "17fb81477fbd3eed14b93103641004a766eb9ac1",
    NEXT_TELEMETRY_DISABLED: "1",
    CI: "true",
  };
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-H", "127.0.0.1", "-p", "3000"], {
    cwd: process.cwd(), env: nextEnv, stdio: ["ignore", "pipe", "pipe"], detached: false,
  });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", chunk => {
      output.push(String(chunk).replace(/eyJ[A-Za-z0-9_.-]+/g, "[JWT-REDACTED]"));
      if (output.length > 110) output.shift();
    });
  }
  await waitForNext(server);
  const health = await fetch(origin + "/api/health");
  const info = await health.json();
  assert.equal(info.revision, "17fb81477fbd3eed14b93103641004a766eb9ac1");
  console.log("PASS: pinned historical Next.js starts on localhost with local-only Supabase");

  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const contextAnon = await browser.newContext({ baseURL: origin });
  const contextA = await browser.newContext({ baseURL: origin });
  const contextB = await browser.newContext({ baseURL: origin });
  await Promise.all([restrictBrowser(contextAnon), restrictBrowser(contextA), restrictBrowser(contextB)]);
  const anonymousPage = await contextAnon.newPage();
  await anonymousPage.goto(origin + "/grimorios", { waitUntil: "domcontentloaded" });
  await anonymousPage.waitForURL(/\/login(?:[?#]|$)/);
  assert.equal(await anonymousPage.getByRole("heading", { name: titleA }).count(), 0);
  console.log("PASS: real historical Next.js protected route redirects anonymous browser");

  const pageA = await contextA.newPage(), pageB = await contextB.newPage();
  await loginViaRealUI(pageA, emailA);
  await loginViaRealUI(pageB, emailB);
  const cookiesA = (await contextA.cookies(origin)).filter(c => c.name.startsWith("sb-"));
  const cookiesB = (await contextB.cookies(origin)).filter(c => c.name.startsWith("sb-"));
  assert.ok(cookiesA.length && cookiesB.length, "Real browser Supabase auth cookies expected");
  assert.ok(cookiesA.some(c => !cookiesB.some(d => d.name === c.name && d.value === c.value)),
    "A and B must not share an identical browser session");
  console.log("PASS: real login form, two separate Chromium contexts and actual Supabase SSR cookies");

  await verifyLibrary(pageA, titleA, titleB);
  await verifyLibrary(pageB, titleB, titleA);
  await pageA.reload({ waitUntil: "domcontentloaded" });
  await verifyLibrary(pageA, titleA, titleB);
  console.log("PASS: SSR Grimoire route enforces A/B RLS across reload with session cookies");

  const fakePng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLqUQAAAABJRU5ErkJggg==", "base64"
  );
  const fileA = uidA + "/p0-browser-e2e-" + instance + ".png";
  const fileB = uidB + "/p0-browser-e2e-" + instance + ".png";
  unwrap(await a.storage.from("grimoire-covers").upload(fileA, fakePng, { contentType: "image/png" }), "A storage");
  unwrap(await b.storage.from("grimoire-covers").upload(fileB, fakePng, { contentType: "image/png" }), "B storage");
  unwrap(await a.storage.from("grimoire-covers").download(fileA), "A own file");
  assert.ok((await b.storage.from("grimoire-covers").download(fileA)).error,
    "Other user may not read private Storage");
  assert.ok((await b.storage.from("grimoire-covers").upload(uidA + "/forged-" + instance + ".png", fakePng,
    { contentType: "image/png" })).error, "Other user may not upload into A folder");
  const guest = client();
  assert.ok((await guest.storage.from("grimoire-covers").download(fileA)).error,
    "Guest may not download private asset");
  console.log("PASS: same synthetic A/B identities denied cross-owner Storage via local HTTP API");

  await pageA.getByRole("button", { name: "Sair", exact: true }).click();
  await pageA.waitForURL(/\/login(?:[?#]|$)/, { timeout: 35000 });
  await pageA.goto(origin + "/grimorios", { waitUntil: "domcontentloaded" });
  await pageA.waitForURL(/\/login(?:[?#]|$)/);
  await verifyLibrary(pageB, titleB, titleA);
  console.log("PASS: Next.js server action sign-out revokes A protected access and preserves B session");
  console.log("CHECKPOINT P0-536: real historical Next.js browser login/cookies/SSR/RLS/logout + local Storage PASS");
} catch (error) {
  console.error("FAIL: isolated historical browser E2E:", safeError(error));
  if (server && server.exitCode !== null) console.error("Next.js exited during test");
  // Preserve only server readiness diagnostics, never user passwords or token values.
  for (const line of output.slice(-4)) {
    if (/(?:error|fail|ready)/i.test(line)) console.error("Sanitized Next.js: " + line.slice(0,250));
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) {
    server.kill("SIGTERM");
    await sleep(750);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
}