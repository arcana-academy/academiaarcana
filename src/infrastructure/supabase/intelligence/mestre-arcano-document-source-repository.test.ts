import { describe, expect, it, vi } from "vitest";

const { getMicrosoftSharePointDocumentContext } = vi.hoisted(() => ({
  getMicrosoftSharePointDocumentContext: vi.fn(),
}));

vi.mock(
  "@/infrastructure/integrations/microsoft-sharepoint-content",
  () => ({
    getMicrosoftSharePointDocumentContext,
  }),
);

import {
  SupabaseMestreArcanoDocumentSourceRepository,
} from "./mestre-arcano-document-source-repository";

function createSupabase(data: unknown, error: unknown = null) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(async () => ({ data, error })),
  };

  return {
    from: vi.fn(() => builder),
  };
}

const credentials = {
  subjectId: "user-1",
  accessToken: "token",
  refreshToken: null,
  accessTokenExpiresAt: null,
};

describe("Supabase Mestre Arcano document source repository", () => {
  it("fails closed when the SharePoint credentials belong to another user", async () => {
    const supabase = createSupabase([]);

    const repository = new SupabaseMestreArcanoDocumentSourceRepository(
      supabase as never,
      "user-1",
      { ...credentials, subjectId: "user-2" },
    );

    await expect(repository.listConnectedSharePointSources()).resolves.toEqual({
      connected: false,
      sources: [],
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns only active sources already bound to the authenticated owner", async () => {
    const supabase = createSupabase([
      {
        id: "source-1",
        name: "Notes.md",
        mime_type: "text/markdown",
        web_url: "https://example.test/notes.md",
        last_modified_at: "2026-09-30T10:00:00Z",
        size_bytes: 42,
        status: "active",
      },
    ]);

    const repository = new SupabaseMestreArcanoDocumentSourceRepository(
      supabase as never,
      "user-1",
      credentials,
    );

    await expect(repository.listConnectedSharePointSources()).resolves.toEqual({
      connected: true,
      sources: [
        {
          sourceId: "source-1",
          name: "Notes.md",
          mimeType: "text/markdown",
          webUrl: "https://example.test/notes.md",
          lastModifiedAt: "2026-09-30T10:00:00Z",
          sizeBytes: 42,
          status: "active",
        },
      ],
    });

    expect(supabase.from).toHaveBeenCalledWith(
      "external_document_sources",
    );
  });

  it("requires the current user's connection before retrieving a document", async () => {
    const supabase = createSupabase([]);

    const repository = new SupabaseMestreArcanoDocumentSourceRepository(
      supabase as never,
      "user-1",
      { ...credentials, subjectId: "user-2" },
    );

    await expect(
      repository.getSharePointDocumentContext("source-1"),
    ).rejects.toThrow(
      "Microsoft SharePoint não está conectado para este usuário.",
    );

    expect(getMicrosoftSharePointDocumentContext).not.toHaveBeenCalled();
  });

  it("passes the bound owner and server-side credentials to the document service", async () => {
    getMicrosoftSharePointDocumentContext.mockResolvedValue({
      source: {
        id: "source-1",
        providerId: "microsoft-sharepoint",
        siteId: "site-1",
        driveId: "drive-1",
        itemId: "item-1",
        name: "Notes.md",
        mimeType: "text/markdown",
        webUrl: "https://example.test/notes.md",
        lastModifiedAt: null,
        sizeBytes: 42,
      },
      content: "Study notes",
      truncated: false,
      currentDocument: {
        name: "Notes.md",
        mimeType: "text/markdown",
        sizeBytes: 42,
        lastModifiedAt: null,
        webUrl: "https://example.test/notes.md",
      },
    });

    const supabase = createSupabase([]);
    const repository = new SupabaseMestreArcanoDocumentSourceRepository(
      supabase as never,
      "user-1",
      credentials,
    );

    await repository.getSharePointDocumentContext("source-1");

    expect(getMicrosoftSharePointDocumentContext).toHaveBeenCalledWith(
      "source-1",
      {
        supabase,
        ownerId: "user-1",
        credentials,
      },
    );
  });
});
