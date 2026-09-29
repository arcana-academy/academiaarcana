import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getMicrosoftSharePointDocumentContext,
  isSupportedMicrosoftSharePointTextDocument,
  MAX_SHAREPOINT_CONTEXT_CHARACTERS,
  MAX_SHAREPOINT_DOWNLOAD_BYTES,
} from "./microsoft-sharepoint-content";

function createSupabase(data: Record<string, unknown> | null) {
  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    maybeSingle: async () => ({
      data,
      error: null,
    }),
  };

  return {
    from: () => builder,
  } as unknown as SupabaseClient;
}

const activeSource = {
  id: "source-1",
  provider_id: "microsoft-sharepoint",
  source_type: "external_document",
  site_id: "site-1",
  drive_id: "drive-1",
  item_id: "item-1",
  name: "Anotacoes.md",
  mime_type: "text/markdown",
  web_url: "https://example.sharepoint.com/anotacoes.md",
  last_modified_at: "2026-09-29T10:00:00Z",
  size_bytes: 20,
  status: "active",
};

const credentials = {
  subjectId: "user-1",
  accessToken: "secret-access-token",
  refreshToken: "refresh-token",
  accessTokenExpiresAt: Date.now() + 3600_000,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Microsoft SharePoint document context", () => {
  it("accepts only bounded text formats", () => {
    expect(
      isSupportedMicrosoftSharePointTextDocument("notes.md", "text/markdown"),
    ).toBe(true);
    expect(
      isSupportedMicrosoftSharePointTextDocument("data.csv", "application/octet-stream"),
    ).toBe(true);
    expect(
      isSupportedMicrosoftSharePointTextDocument("report.pdf", "application/pdf"),
    ).toBe(false);
    expect(
      isSupportedMicrosoftSharePointTextDocument("slides.pptx", null),
    ).toBe(false);
  });

  it("loads an owned source, revalidates its current file metadata, and returns text with provenance", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input) => {
        const url = String(input);

        if (url.includes("/sites/site-1/drives/drive-1/items/item-1")) {
          return new Response(
            JSON.stringify({
              id: "item-1",
              name: "Anotacoes.md",
              webUrl: "https://example.sharepoint.com/anotacoes.md",
              lastModifiedDateTime: "2026-09-29T10:10:00Z",
              size: 31,
              file: { mimeType: "text/markdown" },
            }),
            { status: 200 },
          );
        }

        if (url.includes("/drives/drive-1/items/item-1/content")) {
          return new Response("# Aula\n\nConteúdo autorizado.", { status: 200 });
        }

        throw new Error("Unexpected Graph request");
      },
    );

    const result = await getMicrosoftSharePointDocumentContext("source-1", {
      supabase: createSupabase(activeSource),
      ownerId: "user-1",
      credentials,
    });

    expect(result.content).toBe("# Aula\n\nConteúdo autorizado.");
    expect(result.truncated).toBe(false);
    expect(result.source).toMatchObject({
      id: "source-1",
      providerId: "microsoft-sharepoint",
      siteId: "site-1",
      driveId: "drive-1",
      itemId: "item-1",
    });
    expect(result.currentDocument).toMatchObject({
      name: "Anotacoes.md",
      mimeType: "text/markdown",
      sizeBytes: 31,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/drives/drive-1/items/item-1/content"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-access-token",
        }),
      }),
    );
  });

  it("never includes credentials in the normalized document context", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/sites/site-1/drives/drive-1/items/item-1")) {
        return new Response(
          JSON.stringify({
            id: "item-1",
            name: "notes.txt",
            size: 13,
            file: { mimeType: "text/plain" },
          }),
          { status: 200 },
        );
      }

      return new Response("token: secret-access-token", { status: 200 });
    });

    const result = await getMicrosoftSharePointDocumentContext("source-1", {
      supabase: createSupabase({ ...activeSource, name: "notes.txt", mime_type: "text/plain" }),
      ownerId: "user-1",
      credentials,
    });

    expect(JSON.stringify(result.source)).not.toContain("secret-access-token");
    expect(result.content).toContain("secret-access-token");
  });

  it("rejects unsupported binary document types", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "item-1",
          name: "report.pdf",
          size: 1024,
          file: { mimeType: "application/pdf" },
        }),
        { status: 200 },
      ),
    );

    await expect(
      getMicrosoftSharePointDocumentContext("source-1", {
        supabase: createSupabase({
          ...activeSource,
          name: "report.pdf",
          mime_type: "application/pdf",
        }),
        ownerId: "user-1",
        credentials,
      }),
    ).rejects.toThrow("microsoft_sharepoint_document_type_unsupported");
  });

  it("rejects documents larger than the download limit before reading the body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "item-1",
          name: "large.txt",
          size: MAX_SHAREPOINT_DOWNLOAD_BYTES + 1,
          file: { mimeType: "text/plain" },
        }),
        { status: 200 },
      ),
    );

    await expect(
      getMicrosoftSharePointDocumentContext("source-1", {
        supabase: createSupabase({
          ...activeSource,
          name: "large.txt",
          mime_type: "text/plain",
          size_bytes: MAX_SHAREPOINT_DOWNLOAD_BYTES + 1,
        }),
        ownerId: "user-1",
        credentials,
      }),
    ).rejects.toThrow("microsoft_sharepoint_document_too_large");
  });

  it("truncates oversized textual context deterministically", async () => {
    const largeText = "a".repeat(MAX_SHAREPOINT_CONTEXT_CHARACTERS + 10);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "item-1",
            name: "large.txt",
            size: largeText.length,
            file: { mimeType: "text/plain" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(largeText, { status: 200 }));

    const result = await getMicrosoftSharePointDocumentContext("source-1", {
      supabase: createSupabase({
        ...activeSource,
        name: "large.txt",
        mime_type: "text/plain",
      }),
      ownerId: "user-1",
      credentials,
    });

    expect(result.truncated).toBe(true);
    expect(result.content).toHaveLength(MAX_SHAREPOINT_CONTEXT_CHARACTERS);
  });

  it("fails closed when the source does not belong to the authenticated owner", async () => {
    const builder = {
      select() {
        return builder;
      },
      eq(column: string, value: string) {
        if (column === "owner_id") {
          expect(value).toBe("user-1");
        }
        return builder;
      },
      maybeSingle: async () => ({
        data: null,
        error: null,
      }),
    };

    await expect(
      getMicrosoftSharePointDocumentContext("source-1", {
        supabase: { from: () => builder } as unknown as SupabaseClient,
        ownerId: "user-1",
        credentials,
      }),
    ).rejects.toThrow("microsoft_sharepoint_source_not_found");
  });
});
