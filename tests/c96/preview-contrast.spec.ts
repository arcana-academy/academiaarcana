import { test, expect } from "@playwright/test";

function luminance(rgb: string): number {
  const raw = rgb.match(/\d+/g)?.slice(0, 3).map(Number);
  if (!raw || raw.length !== 3) throw new Error("Unexpected CSS color: " + rgb);
  const parts = raw.map((v) => {
    const c = v / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return .2126 * parts[0] + .7152 * parts[1] + .0722 * parts[2];
}
function ratio(a: string, b: string): number {
  const l = [luminance(a), luminance(b)].sort((x,y)=>y-x);
  return (l[0]+.05)/(l[1]+.05);
}

test("light system theme with dark personal paper keeps reading preview accessible by keyboard", async ({ page }) => {
  await page.goto("/c96-preview");
  await page.getByRole("button", { name: "Usar tema claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "pergaminho-claro");
  await page.getByRole("combobox", { name: "Estilo do papel desta página" }).selectOption("arcano-escuro");

  const disclosure = page.getByText("Ver prévia de leitura acessível (rascunho local)", { exact: true });
  await disclosure.focus();
  await page.keyboard.press("Enter");

  const region = page.getByRole("region", { name: "Leitura estruturada da página" });
  await expect(region).toBeVisible();
  await expect(region.getByText("Descrição significativa.")).toBeVisible();
  const [fg, bg] = await Promise.all([
    region.locator("p.workspace-reading-preview-alternative").evaluate(el => getComputedStyle(el).color),
    page.locator(".workspace-reading-preview-disclosure").evaluate(el => getComputedStyle(el).backgroundColor),
  ]);
  expect(ratio(fg,bg)).toBeGreaterThanOrEqual(4.5);
  expect(await page.locator(".workspace-reading-preview img, .workspace-reading-preview iframe").count()).toBe(0);
});
