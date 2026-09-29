import { describe, expect, it, vi } from "vitest";

const { getMicrosoftSharePointDocumentContext, searchWebWithExa } = vi.hoisted(() => ({
  getMicrosoftSharePointDocumentContext: vi.fn(),
  searchWebWithExa: vi.fn(),
}));

vi.mock("@/infrastructure/integrations/microsoft-sharepoint-content", () => ({
  getMicrosoftSharePointDocumentContext,
}));

vi.mock("@/infrastructure/exa/search", () => ({
  searchWebWithExa,
}));

import {
  executeMestreArcanoTool,
  MESTRE_ARCANO_TOOLS,
} from "./mestre-arcano-tools";

describe("Mestre Arcano SharePoint tools", () => {

  it("declares web search as a strict, bounded tool", () => {
    const tool = MESTRE_ARCANO_TOOLS.find((item) => item.name === "search_web");

    expect(tool).toMatchObject({
      type: "function",
      strict: true,
      parameters: {
        required: ["query", "numResults"],
      },
    });
  });

  it("routes web search through the Exa adapter without touching application data", async () => {
    searchWebWithExa.mockResolvedValue([
      {
        title: "Fonte",
        url: "https://example.test/source",
        publishedDate: "2026-09-29",
        author: null,
        highlights: ["Evidência"],
      },
    ]);

    const output = await executeMestreArcanoTool(
      {
        name: "search_web",
        arguments: JSON.stringify({ query: "fotossíntese", numResults: 3 }),
      },
      {
        supabase: {} as never,
        ownerId: "user-1",
        microsoftSharePointCredentials: null,
      },
    );

    expect(JSON.parse(output)).toEqual([
      {
        title: "Fonte",
        url: "https://example.test/source",
        publishedDate: "2026-09-29",
        author: null,
        highlights: ["Evidência"],
      },
    ]);
    expect(searchWebWithExa).toHaveBeenCalledWith({
      query: "fotossíntese",
      numResults: 3,
    });
  });

  it("rejects malformed web search arguments", async () => {
    await expect(
      executeMestreArcanoTool(
        { name: "search_web", arguments: JSON.stringify({ query: 123, numResults: 3 }) },
        {
          supabase: {} as never,
          ownerId: "user-1",
          microsoftSharePointCredentials: null,
        },
      ),
    ).rejects.toThrow("Parâmetros de pesquisa web inválidos.");
  });

  it("declares the SharePoint source discovery and context tools as strict functions", () => {
    const sourceTool = MESTRE_ARCANO_TOOLS.find(
      (tool) => tool.name === "get_connected_sharepoint_sources",
    );
    const contextTool = MESTRE_ARCANO_TOOLS.find(
      (tool) => tool.name === "get_sharepoint_document_context",
    );

    expect(sourceTool).toMatchObject({
      type: "function",
      strict: true,
    });
    expect(contextTool).toMatchObject({
      type: "function",
      strict: true,
      parameters: {
        required: ["sourceId"],
      },
    });
  });

  it("does not expose connected SharePoint sources when the provider is not connected for the current owner", async () => {
    const output = await executeMestreArcanoTool(
      {
        name: "get_connected_sharepoint_sources",
        arguments: "{}",
      },
      {
        supabase: {} as never,
        ownerId: "user-1",
        microsoftSharePointCredentials: null,
      },
    );

    expect(JSON.parse(output)).toEqual({
      connected: false,
      sources: [],
    });
  });

  it("passes only the authenticated owner's credentials to the SharePoint context service", async () => {
    getMicrosoftSharePointDocumentContext.mockResolvedValue({
      source: {
        id: "source-1",
        providerId: "microsoft-sharepoint",
        siteId: "site-1",
        driveId: "drive-1",
        itemId: "item-1",
        name: "notes.md",
        mimeType: "text/markdown",
        webUrl: "https://example.test/notes.md",
        lastModifiedAt: null,
        sizeBytes: 10,
      },
      content: "Study notes",
      truncated: false,
      currentDocument: {
        name: "notes.md",
        mimeType: "text/markdown",
        sizeBytes: 10,
        lastModifiedAt: null,
        webUrl: "https://example.test/notes.md",
      },
    });

    const credentials = {
      subjectId: "user-1",
      accessToken: "server-only-token",
      refreshToken: null,
      accessTokenExpiresAt: null,
    };

    const maybeSingle = vi.fn(async () => ({
      data: {
        id: "source-1",
        provider_id: "microsoft-sharepoint",
        source_type: "external_document",
        site_id: "site-1",
        drive_id: "drive-1",
        item_id: "item-1",
        name: "notes.md",
        mime_type: "text/markdown",
        web_url: "https://example.test/notes.md",
        last_modified_at: null,
        size_bytes: 10,
        status: "active",
      },
      error: null,
    }));
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle,
    };
    const supabase = {
      from: vi.fn(() => builder),
    };

    const output = await executeMestreArcanoTool(
      {
        name: "get_sharepoint_document_context",
        arguments: JSON.stringify({ sourceId: "source-1" }),
      },
      {
        supabase: supabase as never,
        ownerId: "user-1",
        microsoftSharePointCredentials: credentials,
      },
    );

    expect(JSON.parse(output)).toMatchObject({
      source: { id: "source-1", providerId: "microsoft-sharepoint" },
      content: "Study notes",
    });
    expect(getMicrosoftSharePointDocumentContext).toHaveBeenCalledWith(
      "source-1",
      {
        supabase,
        ownerId: "user-1",
        credentials,
      },
    );
  });

  it("rejects document-context calls without a matching current-user connection", async () => {
    getMicrosoftSharePointDocumentContext.mockClear();
    await expect(
      executeMestreArcanoTool(
        {
          name: "get_sharepoint_document_context",
          arguments: JSON.stringify({ sourceId: "source-1" }),
        },
        {
          supabase: {} as never,
          ownerId: "user-1",
          microsoftSharePointCredentials: {
            subjectId: "different-user",
            accessToken: "token",
            refreshToken: null,
            accessTokenExpiresAt: null,
          },
        },
      ),
    ).rejects.toThrow("Microsoft SharePoint não está conectado para este usuário.");

    expect(getMicrosoftSharePointDocumentContext).not.toHaveBeenCalled();
  });
});
