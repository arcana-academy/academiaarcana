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

  test("keeps Practice page and activity selection semantically aligned", async ({
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

    const backToWorkspace = page.getByRole("link", {
      name: "Voltar ao Workspace",
    });

    if (await pages.isVisible()) {
      await expect(page).toHaveURL(/\/pratica\?pagina=[^&#]+$/);

      const canonicalPracticeUrl = new URL(page.url());
      const selectedPageId = canonicalPracticeUrl.searchParams.get("pagina");
      expect(selectedPageId).toBeTruthy();

      await expect(
        page.locator("#practice-session-title, #objective-session-title"),
      ).toHaveCount(0);

      await page.goto(
        `/pratica?pagina=${encodeURIComponent(selectedPageId ?? "")}&item=stale-item&avaliacao=stale-assessment`,
      );

      let normalizedUrl = new URL(page.url());
      expect(normalizedUrl.pathname).toBe("/pratica");
      expect(normalizedUrl.searchParams.get("pagina")).toBe(selectedPageId);
      expect(normalizedUrl.searchParams.has("item")).toBe(false);
      expect(normalizedUrl.searchParams.has("avaliacao")).toBe(false);
      await expect(
        page.locator("#practice-session-title, #objective-session-title"),
      ).toHaveCount(0);

      const activityList = page.getByRole("list", {
        name: "Atividades deste conteúdo",
      });
      const firstActivity = activityList.getByRole("listitem").first();

      if ((await firstActivity.count()) > 0) {
        const activityHref = await firstActivity.getAttribute("href");
        expect(activityHref).toBeTruthy();

        await firstActivity.click();

        const activityUrl = new URL(page.url());
        const itemId = activityUrl.searchParams.get("item");
        const assessmentId = activityUrl.searchParams.get("avaliacao");

        expect(activityUrl.searchParams.get("pagina")).toBe(selectedPageId);
        expect(Boolean(itemId) !== Boolean(assessmentId)).toBe(true);
        await expect(
          page.locator("#practice-session-title, #objective-session-title"),
        ).toHaveCount(1);

        if (itemId) {
          await page.goto(
            `/pratica?pagina=${encodeURIComponent(selectedPageId ?? "")}&item=${encodeURIComponent(itemId)}&avaliacao=stale-assessment`,
          );
          normalizedUrl = new URL(page.url());
          expect(normalizedUrl.searchParams.get("item")).toBe(itemId);
          expect(normalizedUrl.searchParams.has("avaliacao")).toBe(false);
        } else if (assessmentId) {
          await page.goto(
            `/pratica?pagina=${encodeURIComponent(selectedPageId ?? "")}&item=stale-item&avaliacao=${encodeURIComponent(assessmentId)}`,
          );
          normalizedUrl = new URL(page.url());
          expect(normalizedUrl.searchParams.get("avaliacao")).toBe(assessmentId);
          expect(normalizedUrl.searchParams.has("item")).toBe(false);
        }
      }

      await page.goto(
        `/pratica?pagina=${encodeURIComponent(selectedPageId ?? "")}`,
      );

      const href = await backToWorkspace.getAttribute("href");
      expect(href).toBe(
        `/workspace?view=tree&page=${encodeURIComponent(selectedPageId ?? "")}#current`,
      );

      await backToWorkspace.click();

      await expect(page).toHaveURL(
        /\/workspace\?view=tree&page=[^#]+#current$/,
      );
      await expect(page.locator('[aria-current="page"]')).toBeVisible();
      await expect(page.locator('[data-active-path="true"]')).toHaveCount(4);

      const canonicalUrl = page.url();
      await page.reload();

      await expect(page).toHaveURL(canonicalUrl);
      await expect(page.locator('[aria-current="page"]')).toBeVisible();
      await expect(page.locator('[data-active-path="true"]')).toHaveCount(4);
      return;
    }

    await expect(page).toHaveURL(/\/pratica$/);

    await page.goto(
      "/pratica?pagina=definitely-stale-page-id&item=stale-item&avaliacao=stale-assessment",
    );

    await expect(page).toHaveURL(/\/pratica$/);
    await expect(
      page.getByRole("heading", { name: "Crie um conteúdo para começar" }),
    ).toBeVisible();

    await expect(backToWorkspace).toHaveAttribute("href", "/workspace");
    await expect(
      page.getByRole("link", { name: "Abrir Workspace" }),
    ).toHaveAttribute("href", "/workspace");
  });
});
