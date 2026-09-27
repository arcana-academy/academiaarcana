import { expect, test } from "@playwright/test";

test("application root serves the public entrypoint for unauthenticated users", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Academia Arcana/i);
  await expect(
    page.getByRole("heading", {
      name: "Um espaço para aprender, organizar e continuar sua jornada.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(
    page.getByRole("link", { name: "Criar conta" }),
  ).toHaveAttribute("href", "/cadastro");
});
