import { describe, expect, it, vi } from "vitest";

const {
  getMicrosoftSharePointDocumentContext,
  searchParallelWeb,
  extractParallelWeb,
} = vi.hoisted(() => ({
  getMicrosoftSharePointDocumentContext: vi.fn(),
  searchParallelWeb: vi.fn(),
  extractParallelWeb: vi.fn(),
}));

vi.mock("@/infrastructure/integrations/microsoft-sharepoint-content", () => ({
  getMicrosoftSharePointDocumentContext,
}));

vi.mock("@/infrastructure/parallel/parallel-search", () => ({
  searchParallelWeb,
  extractParallelWeb,
}));

import {
  executeMestreArcanoTool,
  MESTRE_ARCANO_TOOLS,
} from "./mestre-arcano-tools";

describe("Mestre Arcano tools", () => {
  it("declares the web research tools as strict functions", () => {
    const searchTool = MESTRE_ARCANO_TOOLS.find(
      (tool) => tool.name === "search_web",
    );
    const extractTool = MESTRE_ARCANO_TOOLS.find(
      (tool) => tool.name === "extract_web_source",
    );

    expect(searchTool).toMatchObject({
      type: "function",
      strict: true,
      parameters: {
        required: ["objective", "searchQueries"],
      },
    });
    expect(extractTool).toMatchObject({
      type: "function",
      strict: true,
      parameters: {
        required: ["urls", "objective", "searchQueries"],
      },
    });
  });

  it("delegates web search and preserves source traceability", async () => {
    searchParallelWeb.mockResolvedValue({
      sources: [
        {
          title: "Fonte educacional",
          url: "https://example.com/source",
          publishDate: "2026-09-29",
          excerpts: ["Trecho relevante"],
        },
      ],
      sessionId: "session-1",
    });

    const output = await executeMestreArcanoTool(
      {
        name: "search_web",
        arguments: JSON.stringify({
          objective: "Encontrar material educacional",
          searchQueries: ["material educacional"],
        }),
      },
      {
        supabase: {} as never,
        ownerId: "user-1",
        microsoftSharePointCredentials: null,
      },
    );

    expect(searchParallelWeb).toHaveBeenCalledWith({
      objective: "Encontrar material educacional",
      searchQueries: ["material educacional"],
    });
    expect(JSON.parse(output)).toEqual({
      sources: [
        {
          title: "Fonte educacional",
          url: "https://example.com/source",
          publishDate: "2026-09-29",
          excerpts: ["Trecho relevante"],
        },
      ],
      sessionId: "session-1",
    });
  });

  it("delegates web extraction and preserves extraction errors", async () => {
    extractParallelWeb.mockResolvedValue({
      sources: [
        {
          title: "Documento",
          url: "https://example.com/document.pdf",
          publishDate: null,
          excerpts: ["Resumo"],
          fullContent: "# Documento",
        },
      ],
      errors: [
        {
          url: "https://example.com/private",
          type: "fetch_error",
          status: 403,
        },
      ],
      sessionId: "session-2",
    });

    const output = await executeMestreArcanoTool(
      {
        name: "extract_web_source",
        arguments: JSON.stringify({
          urls: ["https://example.com/document.pdf"],
          objective: "Extrair pontos principais",
          searchQueries: [],
        }),
      },
      {
        supabase: {} as never,
        ownerId: "user-1",
        microsoftSharePointCredentials: null,
      },
    );

    expect(extractParallelWeb).toHaveBeenCalledWith({
      urls: ["https://example.com/document.pdf"],
      objective: "Extrair pontos principais",
      searchQueries: [],
    });
    expect(JSON.parse(output)).toMatchObject({
      sources: [{ url: "https://example.com/document.pdf", fullContent: "# Documento" }],
      errors: [{ status: 403 }],
      sessionId: "session-2",
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
