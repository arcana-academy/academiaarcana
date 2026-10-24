import { expect, test } from "@playwright/test";

test.describe("runtime smoke routes", () => {
  const publicRoutes = ["/", "/login", "/cadastro", "/recuperar-senha"] as const;

  const protectedRoutes = [
    "/redefinir-senha",
    "/santuario",
    "/workspace",
    // Feedback is persisted against an authenticated owner, so the form must not
    // be reachable anonymously.
    "/feedback",
  ] as const;

  for (const route of publicRoutes) {
    test(`serves ${route} successfully`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(route);
    });
  }

  for (const route of protectedRoutes) {
    test(`redirects anonymous users from ${route} to login`, async ({ page }) => {
      // The proxy must answer with a real redirect before the streamed shell is
      // flushed; a `200` document plus meta refresh would violate that contract.
      const guarded = await page.request.get(route, { maxRedirects: 0 });

      expect(guarded.status()).toBe(307);
      expect(guarded.headers()["location"]).toBe("/login");
      expect(await guarded.text()).not.toContain("__next-page-redirect");

      await page.goto(route);

      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("redirects an incomplete auth callback to login", async ({ page }) => {
    const response = await page.goto("/auth/callback");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login\?error=auth$/);
  });
});
