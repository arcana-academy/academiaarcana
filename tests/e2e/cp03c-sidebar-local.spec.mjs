/**
 * CP-03C — real authenticated browser test, opt-in and fail-closed.
 * Reuses the existing production frontend in a disposable, loopback-only stack.
 */
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { validateCp03cIsolation, verifyLocalAuthReady } from "../../scripts/cp03c-local-boundary.mjs";

const enabled = process.env.CP03C_LOCAL_AUTH_ENABLED === "1";
const medium = [
  { width: 900, height: 700 },
  { width: 1024, height: 650 },
];
const small = [
  { width: 450, height: 350 },
  { width: 512, height: 325 },
  { width: 320, height: 225 },
];

async function login(page) {
  const { frontend } = validateCp03cIsolation(process.env, { requireUser: true });
  // Route before navigation: reject every off-machine document, image, script, XHR, etc.
  await page.route("**/*", (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(requestUrl.hostname)) {
      return route.continue();
    }
    return route.abort("blockedbyclient");
  });
  const localAuth = [];
  page.on("response", response => {
    const u = new URL(response.url());
    if (["127.0.0.1", "localhost"].includes(u.hostname) && u.pathname.startsWith("/auth/v1/")) {
      localAuth.push({ path: u.pathname, status: response.status(), method: response.request().method() });
    }
  });
  page.on("requestfailed", request => {
    const u = new URL(request.url());
    if (["127.0.0.1", "localhost"].includes(u.hostname) && u.pathname.startsWith("/auth/v1/")) {
      localAuth.push({ path: u.pathname, failed: request.failure()?.errorText ?? "unknown" });
    }
  });
  await page.goto(`${frontend}/login`);
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL);
  await page.getByLabel("Senha").fill(process.env.E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  try {
    await expect(page).toHaveURL(/\/santuario(?:\?|$)/);
  } catch {
    const alerts = await page.locator('[role="alert"]').allTextContents();
    throw new Error(`CP03C browser login did not reach Sanctuary: ${JSON.stringify({ path: new URL(page.url()).pathname, alerts: alerts.map(s => s.slice(0,120)), localAuth })}`);
  }
}

async function noHorizontalOverflow(page) {
  const { documentWidth, viewportWidth } = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 1);
}

test.describe("CP03C local-only authenticated sidebar", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "CP03C_LOCAL_AUTH_ENABLED=1 is required; no real user or hosted Supabase allowed");
  test.beforeAll(async () => {
    validateCp03cIsolation(process.env, { requireUser: true });
    await verifyLocalAuthReady(process.env);
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.auth.signInWithPassword({ email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD });
    if (error) throw new Error(`CP03C local GoTrue password verification failed: status ${error.status}, code ${error.code ?? "unknown"}`);
    await client.auth.signOut();
    console.log("CP03C: local password authentication confirmed through Supabase API");
  });

  for (const viewport of medium) {
    test(`auth, keyboard, scroll, focus and overflow ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      const sidebar = page.locator(".aa-sidebar");
      await expect(sidebar).toBeVisible();
      const nav = sidebar.getByRole("navigation", { name: "Navegação principal" });
      const links = nav.getByRole("link");
      await expect(links).toHaveCount(15);
      await expect(nav.getByRole("link", { name: "Santuário" })).toHaveAttribute("aria-current", "page");

      const metrics = await sidebar.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return { width: rect.width, height: rect.height, clientWidth: el.clientWidth, clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight, overflowY: style.overflowY };
      });
      expect(metrics.width).toBeGreaterThanOrEqual(198);
      expect(metrics.width).toBeLessThanOrEqual(220);
      expect(metrics.overflowY).toBe("auto");
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

      await sidebar.getByRole("link", { name: "Academia Arcana — Santuário" }).focus();
      for (let i = 0; i < 15; i++) await page.keyboard.press("Tab");
      const last = nav.getByRole("link", { name: "Configurações" });
      await expect(last).toBeFocused();
      await expect(last).toBeInViewport();
      const focus = await last.evaluate((node) => {
        const rectangle = node.getBoundingClientRect();
        const top = document.elementFromPoint(rectangle.x + rectangle.width/2, rectangle.y + rectangle.height/2);
        return { visible: parseFloat(getComputedStyle(node).outlineWidth) > 0, uncovered: top === node || node.contains(top) };
      });
      expect(focus.visible).toBe(true);
      expect(focus.uncovered).toBe(true);
      await noHorizontalOverflow(page);
    });
  }

  for (const viewport of small) {
    test(`responsive mobile disclosure proxy ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await expect(page.locator(".aa-sidebar")).toBeHidden();
      const details = page.locator("details.aa-mobile-navigation");
      const summary = details.locator("summary");
      await summary.focus();
      await expect(summary).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("open", "");
      const nav = details.getByRole("navigation", { name: "Navegação móvel" });
      await expect(nav.getByRole("link", { name: "Santuário" })).toHaveAttribute("aria-current", "page");
      const last = nav.getByRole("link", { name: "Configurações" });
      await last.scrollIntoViewIfNeeded();
      await last.focus();
      await expect(last).toBeInViewport();
      await noHorizontalOverflow(page);
    });
  }
});
