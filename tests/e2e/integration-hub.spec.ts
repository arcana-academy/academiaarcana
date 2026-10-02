import { expect, test } from "@playwright/test";

test.describe("integration hub", () => {
  test("shows the real integration status with resilient GitHub verification", async ({
    page,
  }) => {
    const response = await page.goto("/integracoes");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Hub de integrações da Academia Arcana" })).toBeVisible();
    await expect(page.getByText("120 integrações registradas")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Conexões verificadas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ferramentas aplicadas ao ciclo de criação" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Laboratório de simulação e robótica" })).toBeVisible();
    await expect(page.getByText("NVIDIA · Physical AI", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "GitHub", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Todoist", exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gerenciar conexão do Todoist" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Notion", exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gerenciar conexão do Notion" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Asana", exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gerenciar conexão do Asana" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gerenciar no Cronograma" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Gerenciar conexão do Trello" }),
    ).toBeVisible();

    const dictionaryCard = page
      .getByRole("listitem")
      .filter({ hasText: "A-Z Dictionary" });

    await expect(dictionaryCard).toBeVisible();
    await expect(dictionaryCard.getByText("A-Z Dictionary", { exact: true })).toBeVisible();
    const githubCard = page
      .getByRole("heading", { name: "GitHub", exact: true })
      .locator("xpath=ancestor::li[1]");

    await expect(githubCard).toBeVisible();
    await expect(githubCard.getByText(/Verificado|Erro na verificação/)).toBeVisible();

    if (await githubCard.getByText("Verificado", { exact: true }).count()) {
      await expect(
        githubCard.getByText("A conexão externa foi verificada em runtime.", {
          exact: true,
        }),
      ).toBeVisible();
    } else {
      await expect(
        githubCard.getByText("A conexão externa falhou na última verificação.", {
          exact: true,
        }),
      ).toBeVisible();
    }

    await expect(
      page.getByRole("heading", { name: "Pesquisa web do Mestre Arcano" }),
    ).toBeVisible();
    const webResearchSection = page.getByRole("region", {
      name: "Pesquisa web do Mestre Arcano",
    });
    await expect(webResearchSection).toBeVisible();
    await expect(
      webResearchSection.getByRole("heading", {
        name: "Parallel — Web Research do Mestre Arcano",
      }),
    ).toBeVisible();
    await expect(
      webResearchSection.getByRole("heading", {
        name: "Exa — Web Research do Mestre Arcano",
      }),
    ).toBeVisible();
  });

  test("serves the status API with a connected GitHub provider and catalogued A-Z Dictionary bridge", async ({
    request,
  }) => {
    const response = await request.get("/api/integrations/status");

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.catalogSize).toBe(120);
    expect(body.connectedCount + body.cataloguedCount + body.errorCount).toBe(120);
    expect([0, 1]).toContain(body.errorCount);
    expect(body.connectedCount + body.errorCount).toBe(1);

    const github = body.entries.find(
      (entry: { name: string }) => entry.name === "GitHub",
    );

    expect(github?.name).toBe("GitHub");
    expect(["connected", "error"]).toContain(github?.status);
    if (github?.status === "connected") {
      expect(github.verification).toMatchObject({
        providerId: "github",
        repository: "arcana-academy/academiaarcana",
      });
    } else {
      expect(github.verification).toBeNull();
    }

    const dictionary = body.entries.find(
      (entry: { name: string }) => entry.name === "A-Z Dictionary",
    );

    expect(dictionary).toMatchObject({
      name: "A-Z Dictionary",
      status: "catalogued",
      chatgptAppUrl:
        "https://chatgpt.com/plugins/plugin_asdk_app_6960e92ebfa481918f4ccff0c8b219db",
      verification: null,
    });

    const todoist = body.entries.find(
      (entry: { name: string }) => entry.name === "Todoist",
    );

    expect(todoist).toMatchObject({
      name: "Todoist",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "todoist",
      capabilities: ["read", "write", "search", "calendar"],
      verification: null,
    });

    const airtable = body.entries.find(
      (entry: { name: string }) => entry.name === "Airtable",
    );

    expect(airtable).toMatchObject({
      name: "Airtable",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "airtable",
      capabilities: ["read", "write", "search", "metadata", "analytics"],
      verification: null,
    });

    const notion = body.entries.find(
      (entry: { name: string }) => entry.name === "Notion",
    );

    expect(notion).toMatchObject({
      name: "Notion",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "notion",
      capabilities: ["read", "write", "search", "metadata"],
      verification: null,
    });

    const trello = body.entries.find(
      (entry: { name: string }) => entry.name === "Trello",
    );

    expect(trello).toMatchObject({
      name: "Trello",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "trello",
      capabilities: ["read", "write", "search", "metadata"],
      verification: null,
    });

    const spotify = body.entries?.find(
      (entry: { name: string }) => entry.name === "Spotify",
    );

    expect(spotify).toMatchObject({
      name: "Spotify",
      status: "catalogued",
      chatgptAppUrl:
        "https://chatgpt.com/plugins/plugin_asdk_app_68de829bf7648191acd70a907364c67c",
      verification: null,
    });
  });
});
