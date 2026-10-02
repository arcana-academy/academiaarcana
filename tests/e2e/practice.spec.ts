import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

test("unauthenticated Practice redirects to login", async ({ page }) => {
  const response = await page.goto("/pratica");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/login$/);
});

test.describe("authenticated P1 practice surface", () => {
  test.skip(
    !e2eEmail || !e2ePassword,
    "Configure E2E_EMAIL and E2E_PASSWORD for the authenticated educational flow.",
  );

  test("opens the retrieval practice surface with explicit empty-data handling", async ({
    page,
  }) => {
    if (!e2eEmail || !e2ePassword) {
      test.skip();
      return;
    }

    await page.goto("/login");
    await page.getByLabel("Email").fill(e2eEmail);
    await page.getByLabel("Senha").fill(e2ePassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.goto("/pratica");
    await expect(
      page.getByRole("heading", { name: "Prática e recuperação" }),
    ).toBeVisible();

    const emptyState = page.getByRole("heading", {
      name: "Crie um conteúdo para começar",
    });
    const pages = page.getByRole("heading", { name: "Conteúdos praticáveis" });

    await expect(emptyState.or(pages)).toBeVisible();
  });
});
