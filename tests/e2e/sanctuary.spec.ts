import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

test("unauthenticated Sanctuary redirects to login", async ({ page }) => {
  await page.goto("/santuario");

  await expect(page).toHaveURL(/\/login/);
});

test.describe("authenticated Sanctuary flow", () => {
  test.skip(
    !e2eEmail || !e2ePassword,
    "Configure E2E_EMAIL and E2E_PASSWORD for the authenticated production-data flow.",
  );

  test("login opens Sanctuary and Continue learning reaches Workspace", async ({
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

    await page.goto("/santuario");
    await expect(
      page.getByRole("heading", { name: "Seu Santuário de aprendizagem" }),
    ).toBeVisible();

    const continueLearning = page.getByRole("link", {
      name: "Continuar aprendendo",
    });

    if (await continueLearning.count()) {
      await continueLearning.click();
      await expect(page).toHaveURL(/\/workspace\?view=tree/);
      await expect(
        page.getByRole("navigation", { name: "Navegação do workspace" }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText("Você ainda não tem um contexto de aprendizagem"),
      ).toBeVisible();
    }
  });
});
