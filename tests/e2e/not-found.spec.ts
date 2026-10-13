import { expect, test } from "@playwright/test";

test("unknown route provides a safe recovery path without authentication", async ({ page }) => {
  const response = await page.goto("/rota-inexistente-validacao-404");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("main", { name: "Página não encontrada" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Recuperar a navegação" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Abrir Santuário" })).toHaveAttribute("href", "/santuario");
  await expect(page.locator('img[alt=""]')).toHaveCount(1);
});

for (const width of [320, 375, 768, 1440]) {
  test(`404 recovery reflows without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/rota-inexistente-validacao-404");

    const main = page.getByRole("main", { name: "Página não encontrada" });
    const card = main.locator("section");
    await expect(card).toBeVisible();
    const box = await card.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.x, "card must not touch the left viewport edge").toBeGreaterThanOrEqual(12);
    expect(
      width - (box!.x + box!.width),
      "card must not touch the right viewport edge",
    ).toBeGreaterThanOrEqual(12);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}
