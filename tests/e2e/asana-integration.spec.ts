import { expect, test } from "@playwright/test";

test.describe("Asana integration", () => {
  test("exposes Asana in the integration hub without claiming a live connection", async ({ page }) => {
    const response = await page.goto("/integracoes");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Asana" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Gerenciar conexão do Asana" })).toHaveAttribute(
      "href",
      "/integracoes/asana",
    );
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
