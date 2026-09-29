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
