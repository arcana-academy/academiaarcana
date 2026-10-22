import { expect, test } from "@playwright/test";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
function isApprovedSyntheticE2E() {
  if (
    process.env.GITHUB_ACTIONS !== "true" ||
    process.env.GITHUB_EVENT_NAME !== "pull_request" ||
    process.env.AA_LOCAL_SUPABASE_E2E !== "1" ||
    !process.env.E2E_EMAIL ||
    !process.env.E2E_PASSWORD ||
    !apiUrl
  ) return false;
  try {
    const url = new URL(apiUrl);
    return url.protocol === "https:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

test.describe("AA770 — acessibilidade e papel por página (somente Supabase sintético isolado)", () => {
  test.skip(!isApprovedSyntheticE2E(), "C03/ORG02: exige CI PR com Supabase local e identidade sintética.");
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
    await page.getByLabel("Senha").fill(process.env.E2E_PASSWORD!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/santuario(?:[/?#]|$)/);
  });

  test("abre acesso do cabeçalho por teclado e persiste configuração sem alterar autenticação", async ({ page }) => {
    const headerAccess = page.getByRole("button", { name: "Acessibilidade" });
    await headerAccess.focus();
    await expect(headerAccess).toBeFocused();
    await page.keyboard.press("Enter");
    const center = page.getByRole("region", { name: "Central de Acessibilidade" });
    await expect(center).toBeVisible();
    await expect(center.getByRole("button", { name: "Tecnologias assistivas" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(center).toHaveCount(0);
    await expect(headerAccess).toBeFocused();

    await page.goto("/configuracoes");
    const theme = page.getByRole("combobox", { name: "Aparência do site" });
    await theme.selectOption("light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "arcana-pergaminho");
    await page.getByRole("checkbox", { name: "Ampliar texto" }).check();
    await expect(page.locator("html")).toHaveAttribute("data-aa-text-scale", "large");
    await page.reload();
    await expect(theme).toHaveValue("light");
    await expect(page.locator("html")).toHaveAttribute("data-aa-text-scale", "large");
    // Restore synthetic browser preferences for independent scenarios.
    await theme.selectOption("system");
    await page.getByRole("checkbox", { name: "Ampliar texto" }).uncheck();
  });

  test("papéis da página não sobrescrevem conteúdo salvo ou preferências de leitura", async ({ page }) => {
    await page.goto("/workspace?view=tree#current");
    const prefix = "AA770-" + Date.now().toString(36);
    await page.getByRole("form", { name: "Criar grimório" }).getByRole("textbox", { name: "Novo grimório" }).fill(prefix);
    await page.getByRole("form", { name: "Criar grimório" }).getByRole("button", { name: "Criar grimório" }).click();
    await expect(page.getByRole("form", { name: "Criar caderno" })).toBeVisible();
    await page.getByRole("form", { name: "Criar caderno" }).getByRole("textbox", { name: "Novo caderno" }).fill("Caderno " + prefix);
    await page.getByRole("form", { name: "Criar caderno" }).getByRole("button", { name: "Criar caderno" }).click();
    await expect(page.getByRole("form", { name: "Criar capítulo" })).toBeVisible();
    await page.getByRole("form", { name: "Criar capítulo" }).getByRole("textbox", { name: "Novo capítulo" }).fill("Capítulo " + prefix);
    await page.getByRole("form", { name: "Criar capítulo" }).getByRole("button", { name: "Criar capítulo" }).click();
    await expect(page.getByRole("form", { name: "Criar página" })).toBeVisible();
    await page.getByRole("form", { name: "Criar página" }).getByRole("textbox", { name: "Nova página" }).fill("Página " + prefix);
    await page.getByRole("form", { name: "Criar página" }).getByRole("button", { name: "Criar página" }).click();

    const editor = page.getByRole("article", { name: "Editor da página" });
    await expect(editor).toBeVisible();
    await editor.getByRole("button", { name: "Adicionar bloco" }).click();
    await editor.getByRole("textbox", { name: "Bloco 1" }).fill("Conteúdo sintético protegido " + prefix);
    await editor.getByRole("button", { name: "Salvar página" }).click();
    await expect(editor.getByText("Página salva.")).toBeVisible();

    const paper = page.getByRole("combobox", { name: "Estilo do papel desta página" });
    await expect(paper).toHaveValue("inherit");
    await paper.selectOption("lilas");
    await expect(page.locator(".workspace-page-editor")).toHaveAttribute("data-aa-paper-style", "lilas");
    await page.getByRole("button", { name: "Ajustes de leitura" }).click();
    await page.getByRole("checkbox", { name: "Aumentar espaçamento" }).check();
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Estilo do papel desta página" })).toHaveValue("lilas");
    await expect(page.locator("html")).toHaveAttribute("data-aa-spacing", "wide");
    await expect(page.getByRole("textbox", { name: "Bloco 1" })).toHaveValue("Conteúdo sintético protegido " + prefix);
    // The paper choice never invokes the save action or alters the content model.
  });
});
