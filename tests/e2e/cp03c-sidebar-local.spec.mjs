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
  const { frontend, supabase } = validateCp03cIsolation(process.env, { requireUser: true });
  // Test-only CSP adaptation: production allows HTTPS cross-origin Auth, while
  // Supabase CLI intentionally serves HTTP on another loopback port.
  // Preserve the nonce, strict script policy and all other directives.
  // Neither src/lib/security/csp.ts nor the actual server response is changed.
  await page.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (!(requestUrl.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(requestUrl.hostname))) {
      blockedHosts.push({ host: requestUrl.hostname, path: requestUrl.pathname });
      return route.abort("blockedbyclient");
    }
    if (requestUrl.origin === supabase) {
      // Only the disposable local Auth API is permitted: preserve the original
      // payload and status, adapt CORS response headers strictly in Playwright.
      // No changes to Supabase service, the application or production policy.
      const cors = {
        "access-control-allow-origin": frontend,
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "access-control-allow-private-network": "true",
        "vary": "Origin",
      };
      if (route.request().method() === "OPTIONS") {
        const wanted = route.request().headers()["access-control-request-headers"];
        return route.fulfill({ status: 204, headers: {
          ...cors,
          "access-control-allow-headers": wanted || "authorization, apikey, content-type, x-client-info",
        } });
      }
      const response = await route.fetch();
      return route.fulfill({ response, headers: { ...response.headers(), ...cors } });
    }
    if (route.request().isNavigationRequest() && requestUrl.origin === frontend) {
      const response = await route.fetch();
      const headers = response.headers();
      const original = headers["content-security-policy"] ?? "";
      const connectSrc = "connect-src 'self' https: wss:";
      if (!original.includes(connectSrc) || !original.includes("upgrade-insecure-requests") ||
          !original.includes("'strict-dynamic'") || !original.includes("'nonce-")) {
        throw new Error("CP03C BLOCKED: unexpected production CSP, refusing test-only adaptation");
      }
      const localPolicy = original
        .replace(connectSrc, `${connectSrc} ${supabase}`)
        .replace(/;\s*upgrade-insecure-requests\b/, "");
      return route.fulfill({ response, headers: { ...headers, "content-security-policy": localPolicy } });
    }
    return route.continue();
  });
  const localAuth = [];
  const blockedHosts = [];
  const browserErrors = [];
  page.on("pageerror", error => browserErrors.push({ source: "pageerror", type: error.name }));
  page.on("console", event => {
    if (event.type() !== "error") return;
    const message = event.text().toLowerCase();
    const category = message.includes("cors") || message.includes("access-control-allow")
      ? "cors"
      : message.includes("content security policy") || message.includes("connect-src") || message.includes("refused to connect")
        ? "csp"
        : message.includes("private network access")
          ? "private-network-access"
          : message.includes("mixed content") || message.includes("upgrade-insecure-requests")
            ? "mixed-content"
            : message.includes("err_failed")
              ? "network-err-failed"
              : "other";
    browserErrors.push({ source: "console", type: category });
  });
  await page.addInitScript(() => {
    window.__cp03cFetchTargets = [];
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      try {
        const source = typeof args[0] === "string" ? args[0] : args[0]?.url;
        const u = new URL(source, window.location.origin);
        window.__cp03cFetchTargets.push({ host: u.hostname, port: u.port, path: u.pathname });
      } catch {}
      return originalFetch.apply(this, args);
    };
  });
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
    const fetchTargets = await page.evaluate(() => window.__cp03cFetchTargets ?? []);
    throw new Error(`CP03C browser login did not reach Sanctuary: ${JSON.stringify({ path: new URL(page.url()).pathname, alerts: alerts.map(s => s.slice(0,120)), localAuth, fetchTargets: fetchTargets.slice(-15), blockedHosts: blockedHosts.slice(-15), browserErrors: browserErrors.slice(-10) })}`);
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


test.describe("CP03D Chromium 200% zoom and responsive equivalent on composed PRs", () => {
  test.skip(!enabled, "Only a disposable loopback Supabase stack can run this spec");
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    validateCp03cIsolation(process.env, { requireUser: true });
    await verifyLocalAuthReady(process.env);
  });

  for (const viewport of medium) {
    test(`Chromium compositor zoom 200% ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      const cdp = await page.context().newCDPSession(page);
      try {
        await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
        await expect.poll(async () => page.evaluate(() => window.visualViewport?.scale ?? 0))
          .toBeGreaterThanOrEqual(1.95);
        const sidebar = page.locator(".aa-sidebar");
        await expect(sidebar).toBeVisible();
        const nav = sidebar.getByRole("navigation", { name: "Navegação principal" });
        await expect(nav.getByRole("link")).toHaveCount(15);
        const last = nav.getByRole("link", { name: "Configurações" });
        await last.scrollIntoViewIfNeeded();
        await last.focus();
        await expect(last).toBeFocused();
        await noHorizontalOverflow(page);
        const visualViewportScale = await page.evaluate(() => window.visualViewport?.scale ?? 0);
        console.log(`CP03D PASS compositor pinch scale: viewport ${viewport.width}x${viewport.height}, factor ${visualViewportScale}`);
      } finally {
        await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
        await cdp.detach();
      }
    });

    test(`layout reflow at 200%-equivalent CSS viewport ${viewport.width}x${viewport.height}`, async ({ page }) => {
      const equivalent = { width: viewport.width / 2, height: viewport.height / 2 };
      await page.setViewportSize(equivalent);
      await login(page);
      const sidebar = page.locator(".aa-sidebar");
      await expect(sidebar).toBeHidden();
      const disclosure = page.locator("details.aa-mobile-navigation");
      const trigger = disclosure.locator("summary");
      await trigger.focus();
      await expect(trigger).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(disclosure).toHaveAttribute("open", "");
      const nav = disclosure.getByRole("navigation", { name: "Navegação móvel" });
      await expect(nav.getByRole("link")).toHaveCount(15);
      const last = nav.getByRole("link", { name: "Configurações" });
      await last.scrollIntoViewIfNeeded();
      await last.focus();
      await expect(last).toBeInViewport();
      await noHorizontalOverflow(page);
      console.log(`CP03D PASS 200%-equivalent reflow ${equivalent.width}x${equivalent.height}`);
    });
  }
});
