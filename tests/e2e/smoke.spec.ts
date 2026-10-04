import { expect, test } from "@playwright/test";

test("application root serves the public entrypoint for unauthenticated users", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Academia Arcana/i);
  await expect(
    page.getByRole("heading", {
      name: "Transforme seu estudo em uma jornada.",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Descobrir a Academia" }),
  ).toHaveAttribute("href", "/cadastro");

  await expect(
    page.getByRole("link", { name: "Explorar recursos" }),
  ).toHaveAttribute("href", "#recursos");

  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Recursos", exact: true }),
  ).toHaveAttribute("href", "#recursos");

  await expect(
    page.getByRole("link", { name: "Como funciona" }),
  ).toHaveAttribute("href", "#como-funciona");

  await expect(page.locator("footer")).toBeVisible();
});

test("keeps keyboard focus visible on the public entrypoint", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");

  const focused = page.locator(":focus-visible");
  await expect(focused).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const element = document.activeElement;
        return element instanceof HTMLElement
          ? window.getComputedStyle(element).outlineWidth
          : "0px";
      }),
    )
    .toBe("3px");
});
