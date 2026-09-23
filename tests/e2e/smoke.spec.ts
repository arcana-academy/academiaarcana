import { expect, test } from "@playwright/test";

test("application root redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Academia Arcana/i);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});
