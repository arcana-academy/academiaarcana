import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// The standard CI suite skips these tests; the isolated workflow supplies local Auth.
const enabled = process.env.P1_LOCAL_AUTH_E2E === "1";
test.skip(!enabled, "Requires disposable local Supabase");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
if (enabled) {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
    throw new Error("P1 tests refuse a hosted Supabase URL");
  }
}
function client() {
  const storage = new Map<string, string>();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (k) => storage.get(k) ?? null,
        setItem: (k, v) => { storage.set(k, v); },
        removeItem: (k) => { storage.delete(k); },
      },
    },
  });
}
async function newIdentity() {
  const person = client();
  const suffix = Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  const email = "p1-e2e-" + suffix + "@example.test";
  const password = "P1-Disposable-Test-2026!";
  const result = await person.auth.signUp({ email, password });
  expect(result.error).toBeNull();
  expect(result.data.session).not.toBeNull();
  return { person, email, password };
}
async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/santuario/);
  await expect(page.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
}
function isAuthCookie(name: string) {
  const storageKey = "sb-" + new URL(url).hostname.split(".")[0] + "-auth-token";
  return name === storageKey || (name.startsWith(storageKey + ".") &&
    /^(0|[1-9]\d*)$/.test(name.slice(storageKey.length + 1)));
}

test("AUTH-P1-022/023/027/030: browser logout A1 revokes A2, preserves B and clears browser cookies", async ({ page, context }) => {
  const a = await newIdentity();
  const b = await newIdentity();
  const a2 = client();
  expect((await a2.auth.signInWithPassword({ email: a.email, password: a.password })).error).toBeNull();
  await login(page, a.email, a.password);
  expect((await context.cookies()).some(({ name }) => isAuthCookie(name))).toBe(true);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  expect((await context.cookies()).filter(({ name }) => isAuthCookie(name))).toHaveLength(0);
  await page.goto("/santuario");
  await expect(page).toHaveURL(/\/login/);
  expect((await a2.auth.refreshSession()).error).not.toBeNull();
  expect((await b.person.auth.refreshSession()).error).toBeNull();
});

test("AUTH-P1-014/030: cleanup expires extra auth fragments, not unrelated cookies", async ({ page, context }) => {
  const a = await newIdentity();
  await login(page, a.email, a.password);
  const storageKey = "sb-" + new URL(url).hostname.split(".")[0] + "-auth-token";
  await context.addCookies([
    { name: storageKey + ".18", value: "synthetic-extra", url: "http://127.0.0.1:3000" },
    { name: "p1-unrelated", value: "preserve", url: "http://127.0.0.1:3000" },
  ]);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  const after = await context.cookies();
  expect(after.filter(({ name }) => isAuthCookie(name))).toHaveLength(0);
  expect(after.find(({ name }) => name === "p1-unrelated")?.value).toBe("preserve");
});

test("AUTH-P1-033: other tab rechecking server state converges to login", async ({ page, context }) => {
  const a = await newIdentity();
  await login(page, a.email, a.password);
  const other = await context.newPage();
  await other.goto("/santuario");
  await expect(other.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await other.goto("/santuario");
  await expect(other).toHaveURL(/\/login/);
});
