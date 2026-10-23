import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("keyboard-initiated private TXT download includes unsaved author text and accessibility labels", async ({ page }) => {
  await page.goto("/c97-export");
  await page.getByRole("textbox", { name: "Bloco 1", exact: true }).fill("Anotação nova ainda não salva.");

  const button = page.getByRole("button", { name: "Baixar texto acessível desta página (.txt)" });
  await button.focus();
  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("anotacoes-sobre-astronomia.txt");
  const path = await download.path();
  expect(path).not.toBeNull();
  const content = await readFile(path!, "utf8");
  expect(content).toContain("Anotação nova ainda não salva.");
  expect(content).toContain("Descrição da imagem: Órbitas circulares descritas em palavras.");
  expect(content).not.toContain("Ornamento decorativo fictício");
  expect(content).toContain("não contém mídias");
  await expect(page.getByTestId("c97-saves")).toHaveText("0");
  await expect(page.getByText("Página salva.")).toHaveCount(0);
});
