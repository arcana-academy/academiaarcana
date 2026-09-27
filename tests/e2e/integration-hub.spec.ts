import { expect, test } from "@playwright/test";

test.describe("integration hub", () => {
  test("shows the real integration status and live GitHub verification", async ({
    page,
  }) => {
    const response = await page.goto("/integracoes");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Hub de integrações da Academia Arcana" })).toBeVisible();
    await expect(page.getByText("114 plugins registrados")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Conexões verificadas" })).toBeVisible();
    await expect(page.getByText("GitHub", { exact: true })).toBeVisible();
    await expect(page.getByText("Verificado", { exact: true })).toBeVisible();
    await expect(
      page.getByText("A conexão externa foi verificada em runtime.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("serves the status API with a connected GitHub provider", async ({
    request,
  }) => {
    const response = await request.get("/api/integrations/status");

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      catalogSize: 114,
      connectedCount: 1,
      errorCount: 0,
    });

    const github = body.entries.find(
      (entry: { name: string }) => entry.name === "GitHub",
    );

    expect(github).toMatchObject({
      name: "GitHub",
      status: "connected",
      verification: {
        providerId: "github",
        repository: "arcana-academy/academiaarcana",
      },
    });
  });
});
