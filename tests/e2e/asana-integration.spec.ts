import { expect, test } from "@playwright/test";

test.describe("Asana integration", () => {
  test("shows Asana as a runtime integration in the hub", async ({ page }) => {
    const response = await page.goto("/integracoes");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Asana", exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gerenciar conexão do Asana" }),
    ).toBeVisible();
  });

  test("protects the authenticated Asana management page", async ({ page }) => {
    await page.goto("/integracoes/asana");
    await expect(page).toHaveURL(/\/login/);
  });

  test("protects the Asana status endpoint", async ({ request }) => {
    const response = await request.get("/api/integrations/asana/status");
    expect([401, 403]).toContain(response.status());
  });
});
