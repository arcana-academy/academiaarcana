import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";

for (const name of ["SUPABASE_ACCESS_TOKEN", "DATABASE_URL", "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "RENDER_API_KEY"]) {
  assert.ok(!process.env[name], "Remote/admin environment is forbidden");
}
const raw = execFileSync("supabase", ["status", "-o", "env"], {
  encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "pipe"],
});
const config = Object.fromEntries(raw.split(/\r?\n/).flatMap(line => {
  const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return m ? [[m[1], m[2].replace(/^["']|["']$/g, "")]] : [];
}));
const api = new URL(config.API_URL);
assert.equal(api.protocol, "http:");
assert.equal(api.hostname, "127.0.0.1");
assert.equal(api.port, "54321");
assert.ok(config.ANON_KEY);
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, api.toString());
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, config.ANON_KEY);
const app = "http://127.0.0.1:3100";
const client = () => createClient(api.toString(), config.ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});
const a = client(), b = client();
const password = "isolated-" + randomBytes(18).toString("hex") + "!";
const token = randomUUID();
const emailA = "next-owner-a-" + token + "@example.test";
const emailB = "next-owner-b-" + token + "@example.test";
const signupA = await a.auth.signUp({ email: emailA, password });
const signupB = await b.auth.signUp({ email: emailB, password });
assert.ifError(signupA.error);
assert.ifError(signupB.error);
const ownerA = signupA.data.user?.id, ownerB = signupB.data.user?.id;
assert.ok(ownerA && ownerB && ownerA !== ownerB);
assert.ok(signupA.data.session && signupB.data.session);
const titleA = "Browser Owner A " + token;
const titleB = "Browser Owner B " + token;
assert.ifError((await a.from("grimoires").insert({
  owner_id: ownerA, title: titleA,
})).error);
assert.ifError((await b.from("grimoires").insert({
  owner_id: ownerB, title: titleB,
})).error);
console.log("PASS: synthetic GoTrue users and two owner-scoped grimoires");

const browser = await chromium.launch({ headless: true });
try {
  // Only Chromium test contexts bypass CSP: unchanged historical connect-src
  // allows HTTPS, not local Supabase HTTP on a second localhost port.
  const contextA = await browser.newContext({ bypassCSP: true });
  const contextB = await browser.newContext({ bypassCSP: true });
  const guestContext = await browser.newContext({ bypassCSP: true });
  try {
    const guest = await guestContext.newPage();
    const first = await guest.goto(app + "/login");
    assert.equal(first.status(), 200);
    assert.ok(first.headers()["content-security-policy"]?.includes("connect-src"));
    await guest.goto(app + "/academia");
    await expect(guest).toHaveURL(/\/login(?:[?#]|$)/, { timeout: 30000 });
    console.log("PASS: Next.js public login and server-side anonymous protected-route redirect");

    async function signInAndCheck(context, email, mine, foreign) {
      const page = await context.newPage();
      await page.goto(app + "/login");
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(page).toHaveURL(/\/santuario(?:[?#]|$)/, { timeout: 60000 });
      await page.goto(app + "/academia");
      await expect(page.getByRole("heading", { name: "Sua jornada de aprendizagem" })).toBeVisible();
      const cookies = await context.cookies(app);
      assert.ok(cookies.some(c => c.name.includes("auth-token")),
        "Real browser must persist Supabase auth cookies");
      const loaded = await page.goto(app + "/grimorios");
      assert.equal(loaded.status(), 200);
      await expect(page.getByText(mine, { exact: true })).toBeVisible();
      await expect(page.getByText(foreign, { exact: true })).toHaveCount(0);
      return page;
    }
    const pageA = await signInAndCheck(contextA, emailA, titleA, titleB);
    const pageB = await signInAndCheck(contextB, emailB, titleB, titleA);
    console.log("PASS: actual Next.js AuthForm login, browser HTTP cookies and two-account SSR RLS");

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLqUQAAAABJRU5ErkJggg==",
      "base64",
    );
    const path = ownerA + "/browser-" + token + ".png";
    assert.ifError((await a.storage.from("grimoire-covers").upload(
      path, png, { contentType: "image/png", upsert: false },
    )).error);
    const location = new URL("storage/v1/object/authenticated/grimoire-covers/" + path, api).toString();
    const headers = { apikey: config.ANON_KEY };
    const own = await contextA.request.get(location, { headers: {
      ...headers, Authorization: "Bearer " + signupA.data.session.access_token,
    } });
    const foreign = await contextB.request.get(location, { headers: {
      ...headers, Authorization: "Bearer " + signupB.data.session.access_token,
    } });
    const guestRead = await guestContext.request.get(location, { headers: {
      ...headers, Authorization: "Bearer " + config.ANON_KEY,
    } });
    assert.equal(own.status(), 200);
    assert.deepEqual(Buffer.from(await own.body()), png);
    assert.ok(!foreign.ok() && !guestRead.ok());
    assert.ifError((await a.storage.from("grimoire-covers").remove([path])).error);
    console.log("PASS: browser-context HTTP Storage isolation with synthetic local JWTs");

    await contextA.clearCookies();
    await pageA.goto(app + "/academia");
    await expect(pageA).toHaveURL(/\/login(?:[?#]|$)/, { timeout: 30000 });
    await pageB.goto(app + "/grimorios");
    await expect(pageB.getByText(titleB, { exact: true })).toBeVisible();
    console.log("PASS: clearing real browser auth cookies revokes A while B remains signed in");
    console.log("CHECKPOINT P0-536: historical Next.js browser HTTP E2E PASS in local-only sandbox");
  } finally {
    await contextA.close();
    await contextB.close();
    await guestContext.close();
  }
} finally {
  await browser.close();
}
