import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

async function expectWorkspaceContext(page: import("@playwright/test").Page) {
  await expect(page).toHaveURL(/\/workspace\?view=tree/);
  await expect(
    page.getByRole("navigation", { name: "Navegação do workspace" }),
  ).toBeVisible();

  const url = new URL(page.url());
  if (url.searchParams.has("page")) {
    await expect(page.locator('[aria-current="page"]')).toBeVisible();
    await expect(page.locator('[data-active-path="true"]')).toHaveCount(4);

    const activeChapter = page.locator(
      '.workspace-tree-item--chapter[data-active-path="true"]',
    );
    await expect(activeChapter).toBeVisible();
    await activeChapter.click();

    await expect
      .poll(() => {
        const selectedUrl = new URL(page.url());
        return {
          view: selectedUrl.searchParams.get("view"),
          chapter: selectedUrl.searchParams.get("chapter"),
          page: selectedUrl.searchParams.get("page"),
          hash: selectedUrl.hash,
        };
      })
      .toEqual({
        view: "tree",
        chapter: expect.any(String),
        page: null,
        hash: "#current",
      });

    const chapterUrl = page.url();
    await page.reload();

    await expect(page).toHaveURL(chapterUrl);
    await expect(
      page.locator('.workspace-tree-item--chapter[aria-current="true"]'),
    ).toBeVisible();
    await expect(page.locator('[data-active-path="true"]')).toHaveCount(3);
  }
}

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
      await expectWorkspaceContext(page);
      return;
    }

    const openStudy = page.getByRole("link", {
      name: "Abrir este estudo",
    });

    if (await openStudy.count()) {
      await openStudy.click();
      await expectWorkspaceContext(page);
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
