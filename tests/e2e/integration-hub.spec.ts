import { expect, test } from "@playwright/test";

test.describe("integration hub", () => {
  test("shows the real integration status and live GitHub verification", async ({
    page,
  }) => {
    const response = await page.goto("/integracoes");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Hub de integrações da Academia Arcana" })).toBeVisible();
    await expect(page.getByText("117 plugins registrados")).toBeVisible();
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
    await expect(
      page.getByRole("link", { name: "Gerenciar conexão do Trello" }),
    ).toBeVisible();

    const dictionaryCard = page
      .getByRole("listitem")
      .filter({ hasText: "A-Z Dictionary" });

    await expect(dictionaryCard).toBeVisible();
    await expect(dictionaryCard.getByText("A-Z Dictionary", { exact: true })).toBeVisible();
    await expect(page.getByText("Verificado", { exact: true })).toBeVisible();
    await expect(dictionaryCard.getByText("Catalogado", { exact: true })).toBeVisible();
    await expect(
      page.getByText("A conexão externa foi verificada em runtime.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("serves the status API with a connected GitHub provider and catalogued A-Z Dictionary bridge", async ({
    request,
  }) => {
    const response = await request.get("/api/integrations/status");

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      catalogSize: 117,
      connectedCount: 1,
      errorCount: 0,
    });

    const github = body.entries.find(
      (entry: { name: string }) => entry.name === "GitHub",
    );

    expect(github).toMatchObject({
      name: "GitHub",
      status: "connected",
      verification: {
        providerId: "github",
        repository: "arcana-academy/academiaarcana",
      },
    });

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
