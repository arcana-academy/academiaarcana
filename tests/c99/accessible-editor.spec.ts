import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("C99 keyboard reading, preserved alternatives, text export and explicit save", async ({ page }) => {
  await page.goto("/c99-accessibility-proof");
  await expect(page.getByRole("heading", { name: /C99 — Prova sintética/ })).toBeVisible();
  await expect(page.getByTestId("c99-save-count")).toHaveText("0");

  const accessibility = page.locator("summary").filter({ hasText: "Acessibilidade do bloco 1" });
  await accessibility.focus();
  await page.keyboard.press("Enter");
  const type = page.getByRole("combobox", { name: "Tipo do bloco 1" });
  await expect(type).toBeVisible();
  await type.selectOption("audio");
  const transcript = page.getByRole("textbox", { name: "Transcrição ou descrição do áudio" });
  await expect(transcript).toHaveValue("Descrição autoral original.");
  await transcript.fill("Transcrição autoral revisada após mudança de tipo.");
  await expect(page.getByTestId("c99-save-count")).toHaveText("0");

  const previewDisclosure = page.locator("summary").filter({
    hasText: "Ver prévia de leitura acessível (rascunho local)",
  });
  await previewDisclosure.focus();
  await page.keyboard.press("Enter");
  const preview = page.getByRole("region", { name: "Leitura estruturada da página" });
  await expect(preview).toBeVisible();
  await expect(preview.getByRole("heading", { name: /Bloco 1 — Áudio — referência textual/ })).toBeVisible();
  await expect(preview.getByText("Transcrição autoral revisada após mudança de tipo.")).toBeVisible();
  await expect(preview.getByRole("heading", { name: /Bloco 2 — Tipo livre: notation-experimental/ })).toBeVisible();
  await expect(preview.getByText("Três notas ascendentes.")).toBeVisible();
  await expect(preview.getByText("moldura-decorativa-ficticia.png")).toHaveCount(0);
  await expect(preview.locator("audio, video, iframe, img")).toHaveCount(0);

  const downloadButton = page.getByRole("button", {
    name: "Baixar texto acessível desta página (.txt)",
  });
  await downloadButton.focus();
  const promisedDownload = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const download = await promisedDownload;
  expect(download.suggestedFilename()).toBe("aula-sintetica-acessivel.txt");
  const path = await download.path();
  expect(path).not.toBeNull();
  const text = await readFile(path!, "utf8");
  expect(text).toContain("Bloco 1 — Áudio — referência textual");
  expect(text).toContain("Transcrição autoral revisada após mudança de tipo.");
  expect(text).toContain("Bloco 2 — Tipo livre: notation-experimental");
  expect(text).not.toContain("moldura-decorativa-ficticia.png");
  await expect(page.getByTestId("c99-save-count")).toHaveText("0");

  const save = page.getByRole("button", { name: "Salvar página" });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("c99-save-count")).toHaveText("1");
});
