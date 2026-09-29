import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/integrations/status", () => ({
  getIntegrationStatusSnapshot: vi.fn(async () => ({
    generatedAt: "2026-09-27T00:00:00.000Z",
    catalogSize: 116,
    connectedCount: 1,
    cataloguedCount: 115,
    errorCount: 0,
    runtimeIntegrations: [
      {
        providerId: "openai-agents",
        name: "OpenAI Agents — Mestre Arcano",
        status: "not_configured",
        executionMode: "runtime",
        model: "gpt-5.6-sol",
        verification: null,
      },
    ],
    entries: [
      {
        name: "1 Billion Brain Cells",
        source: "chatgpt-catalog",
        status: "catalogued",
        executionMode: "catalog-only",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_69cd086370708191905606fa0641d238",
        verification: null,
      },
      {
        name: "A-Z Daily Word",
        source: "chatgpt-catalog",
        status: "catalogued",
        executionMode: "catalog-only",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_69bd3c483c008191beb1e4cc0ce87b24",
        verification: null,
      },
      {
        name: "A-Z Dictionary",
        source: "chatgpt-catalog",
        status: "catalogued",
        executionMode: "catalog-only",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_6960e92ebfa481918f4ccff0c8b219db",
        verification: null,
      },
      {
        name: "A-Z Holy Bible",
        source: "chatgpt-catalog",
        status: "catalogued",
        executionMode: "catalog-only",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_69985bb469908191a8abda024bb692cb",
        verification: null,
      },
      {
        name: "Agentic Course Redesign",
        source: "chatgpt-catalog",
        status: "catalogued",
        executionMode: "chatgpt-hosted",
        providerId: "agentic-course-redesign",
        verification: null,
      },
      {
        name: "Trello",
        source: "runtime",
        status: "catalogued",
        executionMode: "runtime",
        providerId: "trello",
        capabilities: ["read", "write", "search", "metadata"],
        verification: null,
      },
      {
        name: "GitHub",
        source: "chatgpt-catalog",
        status: "connected",
        executionMode: "runtime",
        verification: {
          providerId: "github",
          repository: "arcana-academy/academiaarcana",
          verifiedAt: "2026-09-27T00:00:00.000Z",
        },
      },
      {
        name: "Spotify",
        source: "chatgpt-catalog",
        status: "catalogued",
        executionMode: "catalog-only",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_68de829bf7648191acd70a907364c67c",
        verification: null,
      },
    ],
  })),
}));

import IntegracoesPage from "./page";

describe("IntegracoesPage", () => {
  it("renders the catalog size and the distinction between verified and catalogued", async () => {
    const html = renderToStaticMarkup(await IntegracoesPage());

    expect(html).toContain("116 plugins registrados");
    expect(html).toContain("Conexões verificadas");
    expect(html).toContain("1");
    expect(html).toContain("Ainda catalogados");
    expect(html).toContain("114");
    expect(html).toContain("Agentic Course Redesign");
    expect(html).toContain("Hospedado no ChatGPT");
    expect(html).toContain(
      "o site não possui uma API oficial para invocação direta",
    );
    expect(html).toContain("GitHub");
    expect(html).toContain("Verificado");
    expect(html).toContain("A conexão externa foi verificada em runtime.");
    expect(html).toContain("Mestre Arcano");
    expect(html).toContain("SharePoint / OneDrive");
    expect(html).toContain("Gerenciar SharePoint");
    expect(html).toContain("Notion");
    expect(html).toContain("Gerenciar conexão do Notion");
    expect(html).toContain("Gerenciar conexão do Trello");

    expect(html).toContain("OpenAI Agents");
    expect(html).toContain("gpt-5.6-sol");
    expect(html).toContain("Abrir OpenAI Agents");
    expect(html).toContain("1 Billion Brain Cells");
    expect(html).toContain("A-Z Daily Word");
    expect(html).toContain("A-Z Dictionary");
    expect(html).toContain("A-Z Holy Bible");
    expect(html).toContain("Spotify");
    expect(html).toContain(
      "plugin_asdk_app_68de829bf7648191acd70a907364c67c",
    );
    expect(html).toContain("Abrir no ChatGPT");
    expect(html).toContain("plugin_asdk_app_69cd086370708191905606fa0641d238");
    expect(html).toContain("plugin_asdk_app_69bd3c483c008191beb1e4cc0ce87b24");
    expect(html).toContain("plugin_asdk_app_6960e92ebfa481918f4ccff0c8b219db");
    expect(html).toContain("plugin_asdk_app_69985bb469908191a8abda024bb692cb");
  });
});
