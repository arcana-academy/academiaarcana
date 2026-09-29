import { expect, test } from "@playwright/test";

test.describe("Tarot integration", () => {
  test("shows Tarot as a catalogued ChatGPT bridge", async ({ page }) => {
    const response = await page.goto("/integracoes");

    expect(response?.status()).toBe(200);

    const tarotCard = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Tarot", exact: true }) });

    await expect(tarotCard).toBeVisible();
    await expect(tarotCard.getByText("Tarot", { exact: true })).toBeVisible();
    await expect(tarotCard.getByText("Catalogado", { exact: true })).toBeVisible();

    const launchLink = tarotCard.getByRole("link", {
      name: "Abrir no ChatGPT",
    });

    await expect(launchLink).toBeVisible();
    await expect(launchLink).toHaveAttribute("target", "_blank");
    await expect(launchLink).toHaveAttribute("rel", "noreferrer");
  });

  test("reports Tarot in the public integration status API", async ({
    request,
  }) => {
    const response = await request.get("/api/integrations/status");

    expect(response.status()).toBe(200);
    const body = await response.json();

    const tarot = body.entries.find(
      (entry: { name: string }) => entry.name === "Tarot",
    );

    expect(tarot).toMatchObject({
      name: "Tarot",
      status: "catalogued",
      executionMode: "catalog-only",
      verification: null,
    });
    expect(tarot.chatgptAppUrl).toContain("chatgpt.com");
  });
});
