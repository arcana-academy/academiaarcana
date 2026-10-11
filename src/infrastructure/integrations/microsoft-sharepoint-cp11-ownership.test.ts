import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mockMetadata = vi.hoisted(() => vi.fn());

vi.mock("./microsoft-sharepoint", () => ({
  MICROSOFT_SHAREPOINT_PROVIDER_ID: "microsoft-sharepoint",
  MICROSOFT_GRAPH_API_BASE_URL: "https://graph.microsoft.com/v1.0",
  getMicrosoftSharePointSiteItemMetadata: mockMetadata,
}));

import { getMicrosoftSharePointDocumentContext } from "./microsoft-sharepoint-content";

const sourceA = {
  id: "synthetic-source-a",
  owner_id: "synthetic-student-a",
  provider_id: "microsoft-sharepoint",
  source_type: "external_document",
  site_id: "synthetic-site-a",
  drive_id: "synthetic-drive-a",
  item_id: "synthetic-item-a",
  name: "notes.md",
  mime_type: "text/markdown",
  status: "active",
  size_bytes: 25,
  web_url: null,
  last_modified_at: null,
};

function ownedSourceRepository() {
  const filters: Array<[string, string]> = [];
  const from = vi.fn((table: string) => {
    expect(table).toBe("external_document_sources");
    return {
      select: vi.fn(() => ({
        eq(column: string, value: string) {
          filters.push([column, value]);
          return this;
        },
        async maybeSingle() {
          const all = filters.every(([column, value]) => sourceA[column as keyof typeof sourceA] === value);
          const required = ["id", "owner_id", "provider_id", "source_type"];
          const hasAllFilters = required.every(column => filters.some(([actual]) => actual === column));
          return { data: all && hasAllFilters ? sourceA : null, error: null };
        },
      })),
    };
  });
  return { supabase: { from } as unknown as SupabaseClient, from, filters };
}

const credentialsFor = (subjectId: string) => ({
  subjectId, accessToken: "synthetic-access-token", refreshToken: "synthetic-refresh-token",
  accessTokenExpiresAt: 2000000000000,
});

beforeEach(() => {
  vi.resetAllMocks();
  mockMetadata.mockResolvedValue({
    output: {
      id: "synthetic-item-a",
      name: "notes.md",
      file: { mimeType: "text/markdown" },
      size: 24,
    },
  });
});

describe("CP11 SharePoint actual owned-source query behavior", () => {
  it("retrieves an owned source only after all four security filters match", async () => {
    const db = ownedSourceRepository();
    const fetchImpl = vi.fn(async () => new Response("# Synthetic owned content", { status: 200 }));
    const document = await getMicrosoftSharePointDocumentContext("synthetic-source-a", {
      supabase: db.supabase,
      ownerId: "synthetic-student-a",
      credentials: credentialsFor("synthetic-student-a"),
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(db.filters).toEqual([
      ["id", "synthetic-source-a"],
      ["owner_id", "synthetic-student-a"],
      ["provider_id", "microsoft-sharepoint"],
      ["source_type", "external_document"],
    ]);
    expect(document.content).toBe("# Synthetic owned content");
    expect(mockMetadata).toHaveBeenCalledWith(
      "synthetic-site-a", "synthetic-drive-a", "synthetic-item-a", "synthetic-access-token",
    );
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("returns source_not_found to a different authenticated owner without contacting Graph", async () => {
    const db = ownedSourceRepository();
    const fetchImpl = vi.fn();
    await expect(getMicrosoftSharePointDocumentContext("synthetic-source-a", {
      supabase: db.supabase,
      ownerId: "synthetic-student-b",
      credentials: credentialsFor("synthetic-student-b"),
      fetchImpl: fetchImpl as typeof fetch,
    })).rejects.toThrow("microsoft_sharepoint_source_not_found");
    expect(db.filters).toContainEqual(["owner_id", "synthetic-student-b"]);
    expect(mockMetadata).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed on owner/credential mismatch before touching the source repository", async () => {
    const db = ownedSourceRepository();
    const fetchImpl = vi.fn();
    await expect(getMicrosoftSharePointDocumentContext("synthetic-source-a", {
      supabase: db.supabase,
      ownerId: "synthetic-student-b",
      credentials: credentialsFor("synthetic-student-a"),
      fetchImpl: fetchImpl as typeof fetch,
    })).rejects.toThrow("microsoft_sharepoint_not_connected");
    expect(db.from).not.toHaveBeenCalled();
    expect(mockMetadata).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
