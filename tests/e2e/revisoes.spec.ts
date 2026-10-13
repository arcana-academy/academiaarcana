import { expect, test } from "@playwright/test";

test("Revisões requires an authenticated session", async ({ page }) => {
  await page.goto("/revisoes");
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
});
