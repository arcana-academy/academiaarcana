import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/integrations/status", () => ({
  getIntegrationStatusSnapshot: vi.fn(async () => ({
    generatedAt: "2026-09-27T00:00:00.000Z",
    catalogSize: 114,
    connectedCount: 1,
    cataloguedCount: 113,
    errorCount: 0,
    entries: [
      {
        name: "1 Billion Brain Cells",
        source: "chatgpt-catalog",
        status: "catalogued",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_69cd086370708191905606fa0641d238",
        verification: null,
      },
      {
        name: "A-Z Daily Word",
        source: "chatgpt-catalog",
        status: "catalogued",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_69bd3c483c008191beb1e4cc0ce87b24",
        verification: null,
      },
      {
        name: "A-Z Dictionary",
        source: "chatgpt-catalog",
        status: "catalogued",
        chatgptAppUrl:
          "https://chatgpt.com/plugins/plugin_asdk_app_6960e92ebfa481918f4ccff0c8b219db",
        verification: null,
      },
      {
        name: "GitHub",
        source: "chatgpt-catalog",
        status: "connected",
        verification: {
          providerId: "github",
          repository: "arcana-academy/academiaarcana",
          verifiedAt: "2026-09-27T00:00:00.000Z",
        },
      },
    ],
  })),
}));

import IntegracoesPage from "./page";

describe("IntegracoesPage", () => {
  it("renders the catalog size and the distinction between verified and catalogued", async () => {
    const html = renderToStaticMarkup(await IntegracoesPage());

    expect(html).toContain("114 plugins registrados");
    expect(html).toContain("Conexões verificadas");
    expect(html).toContain("1");
    expect(html).toContain("Ainda catalogados");
    expect(html).toContain("113");
    expect(html).toContain("GitHub");
    expect(html).toContain("Verificado");
    expect(html).toContain("A conexão externa foi verificada em runtime.");
    expect(html).toContain("1 Billion Brain Cells");
    expect(html).toContain("A-Z Daily Word");
    expect(html).toContain("A-Z Dictionary");
    expect(html).toContain("Abrir no ChatGPT");
    expect(html).toContain("plugin_asdk_app_69cd086370708191905606fa0641d238");
    expect(html).toContain("plugin_asdk_app_69bd3c483c008191beb1e4cc0ce87b24");
    expect(html).toContain("plugin_asdk_app_6960e92ebfa481918f4ccff0c8b219db");
  });
});
