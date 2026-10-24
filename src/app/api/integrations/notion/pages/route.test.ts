import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockContext, mockRefresh, mockSearch, mockCreate } = vi.hoisted(() => ({
  mockContext: vi.fn(),
  mockRefresh: vi.fn(),
  mockSearch: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("../_lib", () => ({
  getNotionCredentialsContext: mockContext,
  refreshAndPersistNotionCredentials: mockRefresh,
}));

vi.mock("@/infrastructure/integrations/notion", () => {
  class NotionConnectionError extends Error {
    constructor(
      message: string,
      readonly code: "not_configured" | "reauthorization_required" | "request_failed" =
        "request_failed",
    ) {
      super(message);
      this.name = "NotionConnectionError";
    }
  }
  return {
    NotionConnectionError,
    searchNotion: mockSearch,
    createNotionPage: mockCreate,
  };
});

import { NotionConnectionError } from "@/infrastructure/integrations/notion";
import { GET, POST } from "./route";

const originalCredentials = {
  subjectId: "synthetic-subject",
  accessToken: "synthetic-expired-token",
  refreshToken: "synthetic-refresh-token",
  botId: null,
  workspaceId: "synthetic-workspace",
  workspaceName: "Synthetic Workspace",
};
const refreshedCredentials = {
  ...originalCredentials,
  accessToken: "synthetic-renewed-token",
  refreshToken: "synthetic-rotated-refresh-token",
};
const cookieStore = { set: vi.fn(), delete: vi.fn() };

function postRequest() {
  return new Request("https://example.invalid/api/integrations/notion/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parentPageId: "parent-1",
      title: "Página de teste",
    }),
  });
}

describe("Notion pages: user-bound expired token recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockContext.mockResolvedValue({ cookieStore, credentials: originalCredentials });
    mockRefresh.mockResolvedValue(refreshedCredentials);
  });

  it("refreshes and retries an expired search once with the rotated token", async () => {
    mockSearch
      .mockRejectedValueOnce(
        new NotionConnectionError("expired", "reauthorization_required"),
      )
      .mockResolvedValueOnce({ output: [{ id: "page-1", title: "Demo" }] });

    const response = await GET(
      new Request("https://example.invalid/api/integrations/notion/pages?query=Demo"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toMatchObject({
      status: "connected",
      results: [{ id: "page-1", title: "Demo" }],
    });
    expect(mockSearch).toHaveBeenCalledTimes(2);
    expect(mockSearch).toHaveBeenNthCalledWith(1, "synthetic-expired-token", "Demo");
    expect(mockSearch).toHaveBeenNthCalledWith(2, "synthetic-renewed-token", "Demo");
    expect(mockRefresh).toHaveBeenCalledOnce();
    expect(mockRefresh).toHaveBeenCalledWith(cookieStore, originalCredentials);
  });

  it("refreshes and retries page creation once without changing the payload", async () => {
    mockCreate
      .mockRejectedValueOnce(
        new NotionConnectionError("expired", "reauthorization_required"),
      )
      .mockResolvedValueOnce({
        output: { id: "created-1", title: "Página de teste" },
      });

    const response = await POST(postRequest());
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "created-1",
      title: "Página de teste",
    });
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate).toHaveBeenNthCalledWith(1, "synthetic-expired-token", {
      parentPageId: "parent-1",
      title: "Página de teste",
      body: undefined,
    });
    expect(mockCreate).toHaveBeenNthCalledWith(2, "synthetic-renewed-token", {
      parentPageId: "parent-1",
      title: "Página de teste",
      body: undefined,
    });
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("does not refresh when there is no refresh token", async () => {
    mockContext.mockResolvedValueOnce({
      cookieStore,
      credentials: { ...originalCredentials, refreshToken: null },
    });
    mockSearch.mockRejectedValueOnce(
      new NotionConnectionError("expired", "reauthorization_required"),
    );
    const response = await GET(
      new Request("https://example.invalid/api/integrations/notion/pages"),
    );
    expect((await response.json()).status).toBe("reauthorization_required");
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockSearch).toHaveBeenCalledOnce();
  });

  it("never retries unrelated upstream failures", async () => {
    mockSearch.mockRejectedValueOnce(
      new NotionConnectionError("unavailable", "request_failed"),
    );
    const response = await GET(
      new Request("https://example.invalid/api/integrations/notion/pages"),
    );
    expect((await response.json()).status).toBe("request_failed");
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockSearch).toHaveBeenCalledOnce();
  });

  it("does not execute either operation without subject-bound credentials", async () => {
    mockContext.mockResolvedValue({ cookieStore, credentials: null });
    const getResponse = await GET(
      new Request("https://example.invalid/api/integrations/notion/pages"),
    );
    const postResponse = await POST(postRequest());
    expect(getResponse.status).toBe(200);
    expect((await getResponse.json()).status).toBe("disconnected");
    expect(postResponse.status).toBe(409);
    expect(mockSearch).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("does not retry a third time if the new token is also rejected", async () => {
    mockSearch.mockRejectedValue(
      new NotionConnectionError("still expired", "reauthorization_required"),
    );
    const response = await GET(
      new Request("https://example.invalid/api/integrations/notion/pages"),
    );
    expect((await response.json()).status).toBe("reauthorization_required");
    expect(mockSearch).toHaveBeenCalledTimes(2);
    expect(mockRefresh).toHaveBeenCalledOnce();
  });
});
