import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

// C54: screenshots of synthetic, loopback-only UI on an ephemeral PR runner.
// Explicitly refuse real users and production Supabase configurations.
async function captureSyntheticVisualEvidence(
  page: import("@playwright/test").Page,
  filename: string,
) {
  if (process.env.AA_C54_SYNTHETIC_VISUAL !== "1") return;
  const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const api = localUrl ? new URL(localUrl) : null;
  if (
    process.env.GITHUB_ACTIONS !== "true" ||
    process.env.GITHUB_EVENT_NAME !== "pull_request" ||
    process.env.AA_LOCAL_SUPABASE_E2E !== "1" ||
    !api ||
    api.protocol !== "https:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(api.hostname)
  ) {
    throw new Error("Refusing C54 screenshots outside local synthetic CI");
  }
  mkdirSync("artifacts/aa360-c54-visual", { recursive: true });
  await page.screenshot({
    path: "artifacts/aa360-c54-visual/" + filename,
    fullPage: true,
    animations: "disabled",
  });
}

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
    // Wait for the completed auth redirect before opening another protected route.
    // Immediate navigation here can abort the in-flight sign-in request.
    await expect(page).toHaveURL(/\/santuario(?:[/?#]|$)/);

    await page.goto("/grimorios");
    await expect(page.getByRole("heading", { name: "Grimórios" })).toBeVisible();

    const openGrimoire = page.getByRole("link", { name: /^Abrir grimório: .+/ }).first();

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

  test("creates a complete learning hierarchy, saves a page, and resumes completion after reload", async ({ page }) => {
    if (!e2eEmail || !e2ePassword) {
      test.skip();
      return;
    }

    // Each synthetic journey gets its own identity. The existing specs share
    // a separate seeded account and must not see this test's new pages.
    const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!apiUrl || !anonKey) throw new Error("Missing local synthetic Auth settings");
    const api = new URL(apiUrl);
    if (
      process.env.GITHUB_ACTIONS !== "true" ||
      process.env.GITHUB_EVENT_NAME !== "pull_request" ||
      process.env.AA_LOCAL_SUPABASE_E2E !== "1" ||
      api.protocol !== "https:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(api.hostname)
    ) throw new Error("Refusing non-local authenticated E2E identity creation");

    const identityClient = createClient(apiUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const isolatedEmail = "c47-" + randomUUID() + "@example.test";
    const isolatedPassword = "LocalC47-" + randomBytes(20).toString("hex") + "!";
    const { data: signedUp, error: signupError } = await identityClient.auth.signUp({
      email: isolatedEmail,
      password: isolatedPassword,
    });
    expect(signupError).toBeNull();
    expect(signedUp.user?.id).toBeTruthy();
    expect(signedUp.session?.access_token).toBeTruthy();

    await page.goto("/login");
    await page.getByLabel("Email").fill(isolatedEmail);
    await page.getByLabel("Senha").fill(isolatedPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/santuario(?:[/?#]|$)/);

    await page.goto("/grimorios");
    await expect(page.getByRole("heading", { name: "Grimórios" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nenhum grimório ainda" })).toBeVisible();
    await page.getByRole("link", { name: "Criar primeiro grimório" }).click();
    await expect(page.getByRole("form", { name: "Criar grimório" })).toBeVisible();

    // Create a separate, entirely synthetic hierarchy using production UI
    // and server actions rather than inserting it directly into the database.
    const prefix = `C47-${Date.now().toString(36)}`;
    const grimoireTitle = `Grimório ${prefix}`;
    const notebookTitle = `Caderno ${prefix}`;
    const chapterTitle = `Capítulo ${prefix}`;
    const pageTitle = `Página ${prefix}`;
    const pageBody = `Conteúdo de estudo sintético ${prefix}`;

    const createGrimoire = page.getByRole("form", { name: "Criar grimório" });
    await createGrimoire.getByRole("textbox", { name: "Novo grimório" }).fill(grimoireTitle);
    await createGrimoire.getByRole("button", { name: "Criar grimório" }).click();
    await expect(page.getByRole("form", { name: "Criar caderno" })).toBeVisible();

    const createNotebook = page.getByRole("form", { name: "Criar caderno" });
    await createNotebook.getByRole("textbox", { name: "Novo caderno" }).fill(notebookTitle);
    await createNotebook.getByRole("button", { name: "Criar caderno" }).click();
    await expect(page.getByRole("form", { name: "Criar capítulo" })).toBeVisible();

    const createChapter = page.getByRole("form", { name: "Criar capítulo" });
    await createChapter.getByRole("textbox", { name: "Novo capítulo" }).fill(chapterTitle);
    await createChapter.getByRole("button", { name: "Criar capítulo" }).click();
    await expect(page.getByRole("form", { name: "Criar página" })).toBeVisible();

    const createPage = page.getByRole("form", { name: "Criar página" });
    await createPage.getByRole("textbox", { name: "Nova página" }).fill(pageTitle);
    await createPage.getByRole("button", { name: "Criar página" }).click();

    const editor = page.getByRole("article", { name: "Editor da página" });
    await expect(editor).toBeVisible();
    await expect(editor.getByRole("textbox", { name: "Título", exact: true })).toHaveValue(pageTitle);
    await editor.getByRole("button", { name: "Adicionar bloco" }).click();
    await editor.getByRole("textbox", { name: "Bloco 1" }).fill(pageBody);
    await editor.getByRole("button", { name: "Salvar página" }).click();
    await expect(editor.getByText("Página salva.")).toBeVisible();

    const selectedUrl = page.url();
    expect(selectedUrl).toMatch(/\/workspace\?view=tree&page=[^#]+#current$/);
    await page.reload();
    await expect(page).toHaveURL(selectedUrl);
    const persistedEditor = page.getByRole("article", { name: "Editor da página" });
    await expect(persistedEditor.getByRole("textbox", { name: "Título", exact: true })).toHaveValue(pageTitle);
    await expect(persistedEditor.getByRole("textbox", { name: "Bloco 1" })).toHaveValue(pageBody);

    await persistedEditor.getByRole("button", { name: "Concluir página" }).click();
    await expect(persistedEditor.getByText("Página concluída.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Marcar como em andamento" })).toBeVisible();

    // The application projection, not an invented frontend count, must report
    // completed progress for the synthetic user's only learning page.
    await page.goto("/santuario");
    await expect(page.getByRole("heading", { name: "Seu progresso" })).toBeVisible();
    await expect(page.locator('[aria-labelledby="sanctuary-progress"]')).toContainText("1 de 1 páginas concluídas");
  });

});
