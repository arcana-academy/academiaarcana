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

  test("login opens Sanctuary and its learning action reaches the next real surface", async ({
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

    const resumeStudy = page.getByRole("link", {
      name: "Retomar este estudo",
    });

    if (await resumeStudy.count()) {
      await resumeStudy.click();
      await expect(page).toHaveURL(/\/workspace\?view=tree/);
      await expect(
        page.getByRole("navigation", { name: "Navegação do workspace" }),
      ).toBeVisible();
      return;
    }

    const openStudy = page.getByRole("link", {
      name: "Abrir este estudo",
    });

    if (await openStudy.count()) {
      await openStudy.click();
      await expect(page).toHaveURL(/\/workspace\?view=tree/);
      await expect(
        page.getByRole("navigation", { name: "Navegação do workspace" }),
      ).toBeVisible();
      return;
    }

    const exploreGrimoires = page.getByRole("link", {
      name: "Explorar Grimórios",
    });
    await expect(exploreGrimoires).toBeVisible();
    await exploreGrimoires.click();
    await expect(page).toHaveURL(/\/grimorios/);
  });
});
