import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

if (!email || !password) {
  throw new Error("Dedicated E2E credentials are required for production validation.");
}

const evidenceDir = "test-results/workspace-production";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    )
    .toBe(true);
}

test("validates the real Workspace flow and responsive states in production", async ({
  page,
}) => {
  test.setTimeout(120_000);

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.goto("/santuario", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Seu Santuário de aprendizagem" }),
  ).toBeVisible();

  const resume = page.getByRole("link", { name: "Retomar este estudo" });
  await expect(
    resume,
    "A conta E2E dedicada precisa ter um contexto real de aprendizagem para validar Santuário → Workspace sem criar dados sintéticos persistentes.",
  ).toBeVisible();

  await resume.click();
  await expect(page).toHaveURL(/\/workspace\?view=tree/);
  await expect(
    page.getByRole("navigation", { name: "Navegação do workspace" }),
  ).toBeVisible();

  const grimoire = page.locator(".workspace-tree-item--grimoire").first();
  await expect(
    grimoire,
    "A conta E2E precisa ter ao menos um Grimório real pré-existente.",
  ).toBeVisible();
  await grimoire.click();

  const notebook = page.locator(".workspace-tree-item--notebook").first();
  await expect(
    notebook,
    "A conta E2E precisa ter ao menos um Caderno real pré-existente.",
  ).toBeVisible();
  await notebook.click();

  const chapter = page.locator(".workspace-tree-item--chapter").first();
  await expect(
    chapter,
    "A conta E2E precisa ter ao menos um Capítulo real pré-existente.",
  ).toBeVisible();
  await chapter.click();

  await expect(page.getByText("Selecione uma página para começar.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar Grimórios" })).toBeVisible();

  const pageTitle = `Validação E2E Workspace ${Date.now()}`;
  const renamedTitle = `${pageTitle} — revisada`;
  let temporaryPageCreated = false;

  try {
    await page.getByLabel("Nova página").fill(pageTitle);
    await page.getByRole("button", { name: "Criar página" }).click();
    temporaryPageCreated = true;

    await expect(page.getByRole("button", { name: pageTitle })).toBeVisible();
    await expect(page.getByRole("article", { name: "Editor da página" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Contexto" })).toContainText(
      pageTitle,
    );

    const currentItems = page.locator(
      '.workspace-tree-region [aria-current]',
    );
    await expect(currentItems).toHaveCount(1);
    await expect(currentItems.first()).toHaveAttribute("aria-current", "page");

    await page.getByLabel("Título").fill(renamedTitle);
    await page.getByRole("button", { name: "Salvar página" }).click();
    await expect(page.getByText("Página salva.")).toBeVisible();
    await expect(page.getByRole("button", { name: renamedTitle })).toBeVisible();

    const viewports = [
      { name: "desktop", width: 1440, height: 1000 },
      { name: "tablet", width: 900, height: 1000 },
      { name: "mobile", width: 390, height: 844 },
    ] as const;

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await expect(page.locator(".workspace-shell")).toBeVisible();
      await expect(page.locator(".workspace-tree-region")).toBeVisible();
      await expect(page.locator(".workspace-editor-region")).toBeVisible();
      await expect(page.locator(".workspace-context-region")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${evidenceDir}/workspace-${viewport.name}.png`,
        fullPage: true,
      });
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator("body").click({ position: { x: 4, y: 4 } });
    let focusedTreeItem = false;

    for (let index = 0; index < 40; index += 1) {
      await page.keyboard.press("Tab");
      focusedTreeItem = await page.evaluate(() =>
        document.activeElement?.classList.contains("workspace-tree-item"),
      );
      if (focusedTreeItem) break;
    }

    expect(focusedTreeItem).toBe(true);
    const focusOutline = await page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return null;
      const style = getComputedStyle(active);
      return {
        width: style.outlineWidth,
        style: style.outlineStyle,
      };
    });
    expect(focusOutline?.style).not.toBe("none");
    expect(focusOutline?.width).not.toBe("0px");

    await page.emulateMedia({ reducedMotion: "reduce" });
    const transitionDuration = await page
      .locator(".workspace-tree-item")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(transitionDuration).toMatch(/0(?:\.0+)?s|0\.00001s/);
  } finally {
    if (temporaryPageCreated) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.setViewportSize({ width: 1440, height: 1000 });

      const deleteButton = page.getByRole("button", { name: "Excluir página" });
      if (await deleteButton.count()) {
        await deleteButton.click();
        const confirm = page.getByRole("button", { name: "Confirmar exclusão" });
        if (await confirm.count()) {
          await confirm.click();
          await expect(
            page.getByRole("button", { name: renamedTitle }),
          ).toHaveCount(0);
        }
      }
    }
  }
});
