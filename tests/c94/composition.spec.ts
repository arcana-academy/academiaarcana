import { test, expect } from "@playwright/test";

test("composed parchment and medieval frame remain legible under high contrast", async ({ page }) => {
  await page.goto("/c94-proof");
  const paper = page.getByRole("combobox", { name: "Estilo do papel desta página" });
  const frame = page.getByRole("combobox", { name: "Moldura desta página" });
  await paper.selectOption("pergaminho-antigo");
  await frame.selectOption("medieval");

  const article = page.locator(".workspace-page-editor[data-aa-paper-style='pergaminho-antigo'] .workspace-page-frame[data-aa-frame-style='medieval'] > article");
  await expect(article).toBeVisible();
  const initial = await article.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    shadow: getComputedStyle(el).boxShadow,
  }));
  expect(initial.background).toBe("rgb(237, 227, 217)");
  expect(initial.shadow).not.toBe("none");

  await page.getByText("Mais ajustes").click();
  await page.getByRole("checkbox", { name: /Contraste reforçado/ }).check();
  await expect(page.locator("html")).toHaveAttribute("data-aa-contrast", "high");
  const contrasted = await article.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    text: getComputedStyle(el).color,
    shadow: getComputedStyle(el).boxShadow,
  }));
  expect(contrasted.background).toBe("rgb(16, 16, 20)");
  expect(contrasted.text).toBe("rgb(255, 255, 255)");
  expect(contrasted.shadow).not.toBe("none");
});

test("mobile combined toolbar and templates preserve unsaved authoring", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/c94-proof");
  await page.getByRole("button", { name: "Tema claro C94" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "pergaminho-claro");

  const paper = page.getByRole("combobox", { name: "Estilo do papel desta página" });
  await paper.selectOption("lilas");
  await page.getByRole("combobox", { name: "Moldura desta página" }).selectOption("ornamental");
  await page.getByRole("button", { name: "Ampliar tamanho do texto" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-aa-text-size", "large");

  await page.getByRole("combobox", { name: "Modelo inicial" }).selectOption("notes");
  await page.getByRole("button", { name: "Aplicar modelo" }).click();
  await expect(page.getByLabel("Bloco 1")).toHaveValue("Tema e objetivo:");
  await page.getByLabel("Bloco 1").fill("Meu estudo permanece editável.");
  await expect(page.getByTestId("c94-save-count")).toHaveText("0");
  await paper.selectOption("arcano-escuro");
  await expect(page.getByLabel("Bloco 1")).toHaveValue("Meu estudo permanece editável.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(376);

  await page.getByRole("button", { name: "Salvar página" }).click();
  await expect(page.getByTestId("c94-save-count")).toHaveText("1");
});
