import { describe, expect, it, vi } from "vitest";
import {
  MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION,
  MicrosoftSharePointConnectionError,
  executeMicrosoftSharePointOperation,
  searchMicrosoftSharePoint,
  verifyMicrosoftSharePointConnection,
} from "./microsoft-sharepoint";

describe("Microsoft SharePoint integration", () => {
  it("declares server-side OAuth capabilities without write access", () => {
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.authMode).toBe("oauth2");
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.serverSideOnly).toBe(true);
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.capabilities).toEqual(
      expect.arrayContaining(["read", "search", "files", "versions", "metadata"]),
    );
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.scopes).toEqual(
      expect.arrayContaining(["Files.Read", "Sites.Read.All"]),
    );
  });

  it("fails closed when no access token is available", async () => {
    await expect(verifyMicrosoftSharePointConnection("")).rejects.toBeInstanceOf(
      MicrosoftSharePointConnectionError,
    );
  });

  it("rejects empty searches before calling Graph", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(searchMicrosoftSharePoint("   ", "token")).rejects.toThrow(
      "A busca do SharePoint não pode estar vazia.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("uses Graph's drive search endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: [] }), { status: 200 }),
    );

    await executeMicrosoftSharePointOperation("search", { query: "grimório" }, "token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/me/drive/root/search(q='"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );

    fetchMock.mockRestore();
  });
});
