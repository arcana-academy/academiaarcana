import { test, expect } from "@playwright/test";

test("first unhydrated paint matches the device scheme without Javascript", async ({ browser }) => {
  for (const scheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme: scheme, javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      const response = await page.goto("/c88-firstpaint");
      expect(response?.ok()).toBe(true);
      const computed = await page.evaluate(() => ({
        scheme: getComputedStyle(document.documentElement).colorScheme,
        background: getComputedStyle(document.body).backgroundColor,
      }));
      expect(computed.scheme).toContain(scheme);
      expect(computed.background).toBe(
        scheme === "light" ? "rgb(247, 241, 232)" : "rgb(23, 21, 28)",
      );
    } finally {
      await context.close();
    }
  }
});
