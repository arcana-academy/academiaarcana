import { expect, test } from "@playwright/test";

test("application root serves the public entrypoint for unauthenticated users", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Academia Arcana/i);
  await expect(
    page.getByRole("heading", {
      name: "Transforme estudo em uma jornada.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Já tenho uma conta" }),
  ).toHaveAttribute("href", "/login");
  await expect(
    page.getByRole("link", { name: "Começar minha jornada" }),
  ).toHaveAttribute("href", "/cadastro");

  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navegação da página" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Pilares" }),
  ).toHaveAttribute("href", "#pilares");
});
