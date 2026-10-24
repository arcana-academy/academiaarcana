import { describe, expect, it, vi } from "vitest";

import {
  DROPBOX_INTEGRATION_DEFINITION,
  executeDropboxRequest,
  verifyDropboxConnection,
} from "./dropbox";

describe("Dropbox integration", () => {
  it("keeps the provider server-side with read-only scopes", () => {
    expect(DROPBOX_INTEGRATION_DEFINITION).toMatchObject({
      id: "dropbox",
      authMode: "service_token",
      serverSideOnly: true,
      capabilities: ["read", "search", "files"],
      scopes: ["files.metadata.read", "files.content.read"],
    });
  });

  it("verifies the configured account without returning the credential", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ account_id: "dbid:test" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyDropboxConnection("runtime-token");

    expect(result).toMatchObject({ providerId: "dropbox", accountId: "dbid:test" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.dropboxapi.com/2/users/get_current_account",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer runtime-token" }),
      }),
    );
  });

  it("rejects requests when the server credential is absent", async () => {
    await expect(executeDropboxRequest("search", { query: "grimório" }, "")).rejects.toThrow(
      /Dropbox não está configurado/,
    );
  });
  it.each([
    ["missing account id", {}],
    ["blank account id", { account_id: "  " }],
    ["non-string account id", { account_id: 42 }],
  ])("rejects successful Dropbox responses with %s", async (_case, payload) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })));
    await expect(verifyDropboxConnection("synthetic-token")).rejects.toThrow(
      "Dropbox retornou uma identificação de conta inválida.",
    );
    vi.unstubAllGlobals();
  });

});
