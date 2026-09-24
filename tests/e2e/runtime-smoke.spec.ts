import { expect, test } from "@playwright/test";

test.describe("runtime smoke routes", () => {
  const publicRoutes = [
    "/login",
    "/cadastro",
    "/recuperar-senha",
  ] as const;

  const protectedRoutes = [
    "/",
    "/redefinir-senha",
    "/santuario",
    "/workspace",
  ] as const;

  for (const route of publicRoutes) {
    test(`serves ${route} successfully`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}$`));
    });
  }

  for (const route of protectedRoutes) {
    test(`redirects anonymous users from ${route} to login`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("redirects an incomplete auth callback to login", async ({ page }) => {
    const response = await page.goto("/auth/callback");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login\?error=auth$/);
  });
});
