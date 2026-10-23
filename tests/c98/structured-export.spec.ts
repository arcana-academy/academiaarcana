import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("keyboard JSON export retains structured draft and accessibility without server save", async ({ page }) => {
  await page.goto("/c98-structured-export");
  await page.getByRole("textbox", { name: "Bloco 1", exact: true })
    .fill("Texto recém-editado sem salvar.");

  const button = page.getByRole("button", {
    name: "Baixar dados estruturados desta página (.json)",
  });
  await button.focus();
  const waiting = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const download = await waiting;
  expect(download.suggestedFilename()).toBe("pesquisa-interdisciplinar.json");

  const path = await download.path();
  expect(path).not.toBeNull();
  const text = await readFile(path!, "utf8");
  const json = JSON.parse(text);
  expect(json.format).toBe("academia-arcana-page-draft");
  expect(json.version).toBe(1);
  expect(json.title).toBe("Pesquisa interdisciplinar");
  expect(json.content.type).toBe("document");
  expect(json.content.blocks).toHaveLength(3);
  expect(json.content.blocks[0].content).toBe("Texto recém-editado sem salvar.");
  expect(json.content.blocks[1].accessibility.description).toBe("Diagrama das fases lunares.");
  expect(json.content.blocks[2].accessibility.decorative).toBe(true);
  expect(json.content.blocks[2].content).toBe("ornamento-ficticio.png");
  await expect(page.getByTestId("save-count")).toHaveText("0");
});
