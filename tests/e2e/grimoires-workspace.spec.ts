import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

test.describe("authenticated Grimoires to Workspace handoff", () => {
  test.skip(
    !e2eEmail || !e2ePassword,
    "Configure E2E_EMAIL and E2E_PASSWORD for the authenticated production-data flow.",
  );

  test("opens a real grimoire through the canonical Workspace URL and preserves it on reload", async ({
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

    await page.goto("/grimorios");
    await expect(page.getByRole("heading", { name: "Grimórios" })).toBeVisible();

    const openGrimoire = page.getByRole("link", { name: "Abrir grimório" }).first();

    if (!(await openGrimoire.count())) {
      await expect(
        page.getByRole("heading", { name: "Nenhum grimório ainda" }),
      ).toBeVisible();
      return;
    }

    const expectedHref = await openGrimoire.getAttribute("href");
    expect(expectedHref).toMatch(
      /^\/workspace\?view=tree&grimoire=[^#]+#current$/,
    );

    await openGrimoire.click();

    await expect(page).toHaveURL(
      /\/workspace\?view=tree&grimoire=[^#]+#current$/,
    );
    await expect(
      page.locator('.workspace-tree-item--grimoire[aria-current="true"]'),
    ).toBeVisible();

    const canonicalUrl = page.url();
    await page.reload();

    await expect(page).toHaveURL(canonicalUrl);
    await expect(
      page.locator('.workspace-tree-item--grimoire[aria-current="true"]'),
    ).toBeVisible();
  });
});
