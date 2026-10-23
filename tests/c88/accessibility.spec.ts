import { test, expect } from "@playwright/test";

test("device light preference resolves to parchment without overriding user selection", async ({page}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/c88-a11y");
  await expect(page.locator("html")).toHaveAttribute("data-theme","pergaminho-claro");
  await expect(page.getByRole("radio",{name:"Automático — conforme o dispositivo"})).toBeChecked();
  await page.getByRole("radio",{name:"Biblioteca Noturna"}).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme","mago-classico");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme","mago-classico");
});

test("keyboard-accessible quick controls remain in viewport on mobile", async ({page}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto("/c88-a11y");
  const trigger=page.getByText("Acessibilidade",{exact:true});
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading",{name:"Ajustes rápidos"})).toBeVisible();
  const entry=page.getByRole("checkbox",{name:/Texto maior/}).first();
  await entry.focus();
  await page.keyboard.press("Space");
  await expect(entry).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-aa-text-size","large");
  const box=await page.locator(".aa-a11y-popover").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x+box!.width).toBeLessThanOrEqual(376);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376);
});

test("six categories and controls are discoverable with accessible roles", async ({page}) => {
  await page.goto("/c88-a11y");
  for (const name of ["Visão e leitura","Audição e mídia","Mobilidade e controle",
    "Cognição e concentração","Tecnologias assistivas","Estudo acessível"]) {
    await expect(page.getByRole("heading",{name})).toBeVisible();
  }
  await page.getByRole("checkbox",{name:/Contraste reforçado/}).last().check();
  await expect(page.locator("html")).toHaveAttribute("data-aa-contrast","high");
  const bg=await page.locator(".aa-a11y-center").evaluate(x=>getComputedStyle(x).backgroundColor);
  expect(bg).toBeTruthy();
});

test("default first visual paint respects device light scheme before hydration", async ({browser}) => {
  const context = await browser.newContext({ colorScheme: "light", javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("/c88-a11y");
    const actual = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    expect(actual).toContain("light");
  } finally {
    await context.close();
  }
});
