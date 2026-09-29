import { describe, expect, it, vi } from "vitest";

const { getMicrosoftSharePointDocumentContext } = vi.hoisted(() => ({
  getMicrosoftSharePointDocumentContext: vi.fn(),
}));

vi.mock("./microsoft-sharepoint-content", () => ({
  getMicrosoftSharePointDocumentContext,
}));

import {
  executeMestreArcanoTool,
  MESTRE_ARCANO_TOOLS,
} from "./mestre-arcano-tools";

describe("Mestre Arcano SharePoint tools", () => {
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

    const output = await executeMestreArcanoTool(
      {
        name: "get_sharepoint_document_context",
        arguments: JSON.stringify({ sourceId: "source-1" }),
      },
      {
        supabase: {} as never,
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
        supabase: {},
        ownerId: "user-1",
        credentials,
      },
    );
  });

  it("rejects document-context calls without a matching current-user connection", async () => {
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
