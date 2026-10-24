import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockUser, mockCookies, mockDecrypt, mockRefresh, mockEncrypt,
  mockSites, mockDrives, mockSearch, mockMetadata,
  mockCreateClient, mockDocument,
} = vi.hoisted(() => ({
  mockUser: vi.fn(),
  mockCookies: vi.fn(),
  mockDecrypt: vi.fn(),
  mockRefresh: vi.fn(),
  mockEncrypt: vi.fn(),
  mockSites: vi.fn(),
  mockDrives: vi.fn(),
  mockSearch: vi.fn(),
  mockMetadata: vi.fn(),
  mockCreateClient: vi.fn(),
  mockDocument: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mockCookies }));
vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mockUser,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/infrastructure/integrations/microsoft-sharepoint", () => ({
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE: "__Host-aa-microsoft-sharepoint-credentials",
  decryptMicrosoftSharePointCredentials: mockDecrypt,
  getValidMicrosoftSharePointCredentials: mockRefresh,
  encryptMicrosoftSharePointCredentials: mockEncrypt,
  listMicrosoftSharePointSites: mockSites,
  listMicrosoftSharePointSiteDrives: mockDrives,
  searchMicrosoftSharePointSiteDrive: mockSearch,
  getMicrosoftSharePointSiteItemMetadata: mockMetadata,
}));
vi.mock("@/infrastructure/integrations/microsoft-sharepoint-content", () => ({
  getMicrosoftSharePointDocumentContext: mockDocument,
}));

import { GET as sitesGET } from "./sites/route";
import { GET as drivesGET } from "./drives/route";
import { GET as searchGET } from "./search/route";
import { GET as contextGET, POST as contextPOST } from "./context/route";
import { GET as sourceContentGET } from "./sources/[sourceId]/content/route";

const url = "https://example.invalid/api/integrations/microsoft-sharepoint";
const creds = {
  subjectId: "synthetic-student-a",
  accessToken: "synthetic-access-a",
  refreshToken: "synthetic-refresh-a",
  accessTokenExpiresAt: 2000000000000,
};
const documentParams = { params: Promise.resolve({ sourceId: "synthetic-source-b" }) };
const endpoints = [
  { name: "sites", execute: () => sitesGET() },
  { name: "drives", execute: () => drivesGET(new Request(url + "/drives?siteId=synthetic-site-b")) },
  { name: "search", execute: () => searchGET(new Request(url + "/search?siteId=synthetic-site-b&driveId=synthetic-drive-b&q=notes")) },
  { name: "context GET", execute: () => contextGET(new Request(url + "/context?siteId=synthetic-site-b&driveId=synthetic-drive-b&itemId=synthetic-item-b")) },
  { name: "context POST", execute: () => contextPOST(new Request(url + "/context", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId: "synthetic-site-b", driveId: "synthetic-drive-b", itemId: "synthetic-item-b" }),
  })) },
  { name: "document content", execute: () => sourceContentGET(new Request(url + "/sources/synthetic-source-b/content"), documentParams) },
];

describe("CP10 SharePoint JWT-sub cross-account route barriers", () => {
  const jar = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser.mockResolvedValue({ sub: "synthetic-student-b" });
    mockCookies.mockResolvedValue(jar);
    jar.get.mockReturnValue({ value: "synthetic-sealed-cookie-for-student-a" });
    mockDecrypt.mockResolvedValue(creds);
    mockRefresh.mockResolvedValue(creds);
  });

  it.each(endpoints)("rejects student B using student A's sealed credentials: $name", async ({ execute }) => {
    const response = await execute();
    expect(response.status).toBe(401);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockEncrypt).not.toHaveBeenCalled();
    expect(jar.set).not.toHaveBeenCalled();
    expect(mockSites).not.toHaveBeenCalled();
    expect(mockDrives).not.toHaveBeenCalled();
    expect(mockSearch).not.toHaveBeenCalled();
    expect(mockMetadata).not.toHaveBeenCalled();
    expect(mockDocument).not.toHaveBeenCalled();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("returns successful content only for the matching JWT owner", async () => {
    mockUser.mockResolvedValueOnce({ sub: "synthetic-student-a" });
    const output = {
      source: { id: "synthetic-source-a", providerId: "microsoft-sharepoint" },
      content: "# Synthetic authorized text",
      truncated: false,
      currentDocument: { name: "notes.md", mimeType: "text/markdown" },
    };
    mockDocument.mockResolvedValueOnce(output);
    const response = await sourceContentGET(
      new Request(url + "/sources/synthetic-source-a/content"),
      { params: Promise.resolve({ sourceId: "synthetic-source-a" }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ document: output });
    expect(mockDocument).toHaveBeenCalledWith(
      "synthetic-source-a",
      expect.objectContaining({
        ownerId: "synthetic-student-a",
        credentials: creds,
      }),
    );
    expect(mockCreateClient).toHaveBeenCalledOnce();
    expect(mockSites).not.toHaveBeenCalled();
    expect(mockDrives).not.toHaveBeenCalled();
    expect(mockSearch).not.toHaveBeenCalled();
    expect(mockMetadata).not.toHaveBeenCalled();
  });

  it("returns 404 without exposing a source missing from the authenticated owner's query", async () => {
    mockUser.mockResolvedValueOnce({ sub: "synthetic-student-a" });
    mockDocument.mockRejectedValueOnce(new Error("microsoft_sharepoint_source_not_found"));
    const response = await sourceContentGET(
      new Request(url + "/sources/synthetic-source-b/content"), documentParams,
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "microsoft_sharepoint_source_not_found" });
    expect(mockDocument).toHaveBeenCalledWith(
      "synthetic-source-b",
      expect.objectContaining({ ownerId: "synthetic-student-a", credentials: creds }),
    );
    expect(mockCreateClient).toHaveBeenCalledOnce();
  });

  it("does not allow a failed authentication check to reach SharePoint or the database", async () => {
    mockUser.mockRejectedValueOnce(new Error("synthetic-unauthenticated"));
    await expect(contextGET(new Request(url + "/context?siteId=s&driveId=d&itemId=i")))
      .rejects.toThrow("synthetic-unauthenticated");
    expect(mockCookies).not.toHaveBeenCalled();
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockMetadata).not.toHaveBeenCalled();
  });
});
