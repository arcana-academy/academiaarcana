import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockContext, mockVerify, mockRefresh } = vi.hoisted(() => ({
  mockContext: vi.fn(),
  mockVerify: vi.fn(),
  mockRefresh: vi.fn(),
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
    NOTION_CREDENTIALS_COOKIE: "aa-notion-credentials",
    NotionConnectionError,
    verifyNotionConnection: mockVerify,
  };
});

import { NotionConnectionError } from "@/infrastructure/integrations/notion";
import { GET } from "./route";

const credentials = {
  subjectId: "synthetic-owner",
  accessToken: "synthetic-access",
  refreshToken: "synthetic-refresh",
  botId: null,
  workspaceId: "synthetic-workspace",
  workspaceName: "Synthetic Workspace",
};
const refreshed = {
  ...credentials,
  accessToken: "synthetic-renewed-access",
  refreshToken: "synthetic-rotated-refresh",
};
const cookieStore = { delete: vi.fn(), set: vi.fn() };
const connected = {
  providerId: "notion",
  status: "connected",
  user: { id: "notion-user", name: "Synthetic user" },
  workspace: { id: "synthetic-workspace", name: "Synthetic Workspace" },
  verifiedAt: "2026-10-10T00:00:00.000Z",
};

function upstreamError(code: "reauthorization_required" | "request_failed") {
  return new NotionConnectionError("Synthetic upstream error", code);
}

describe("Notion status: preserve subject-bound credentials on transient errors", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockContext.mockResolvedValue({ cookieStore, credentials });
    mockRefresh.mockResolvedValue(refreshed);
    mockVerify.mockResolvedValue(connected);
  });

  it("reports an upstream request failure without deleting the credential", async () => {
    mockVerify.mockRejectedValueOnce(upstreamError("request_failed"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      providerId: "notion",
      status: "request_failed",
    });
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("keeps credentials after an unexpected network exception", async () => {
    mockVerify.mockRejectedValueOnce(new TypeError("synthetic connection reset"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("refreshes a rejected token and verifies the new token", async () => {
    mockVerify
      .mockRejectedValueOnce(upstreamError("reauthorization_required"))
      .mockResolvedValueOnce(connected);
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      providerId: "notion",
      status: "connected",
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledWith(cookieStore, credentials);
    expect(mockVerify).toHaveBeenNthCalledWith(1, credentials.accessToken, {
      id: credentials.workspaceId,
      name: credentials.workspaceName,
    });
    expect(mockVerify).toHaveBeenNthCalledWith(2, refreshed.accessToken, {
      id: refreshed.workspaceId,
      name: refreshed.workspaceName,
    });
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("requires reauthorization when no refresh token is available", async () => {
    mockContext.mockResolvedValueOnce({
      cookieStore,
      credentials: { ...credentials, refreshToken: null },
    });
    mockVerify.mockRejectedValueOnce(upstreamError("reauthorization_required"));
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "reauthorization_required",
    });
    expect(cookieStore.delete).toHaveBeenCalledTimes(1);
    expect(cookieStore.delete).toHaveBeenCalledWith("aa-notion-credentials");
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("clears credentials if the refresh token is explicitly rejected", async () => {
    mockVerify.mockRejectedValueOnce(upstreamError("reauthorization_required"));
    mockRefresh.mockRejectedValueOnce(upstreamError("reauthorization_required"));
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("reauthorization_required");
    expect(cookieStore.delete).toHaveBeenCalledTimes(1);
    expect(cookieStore.delete).toHaveBeenCalledWith("aa-notion-credentials");
  });

  it("preserves credentials if the refresh endpoint is temporarily unavailable", async () => {
    mockVerify.mockRejectedValueOnce(upstreamError("reauthorization_required"));
    mockRefresh.mockRejectedValueOnce(upstreamError("request_failed"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).status).toBe("request_failed");
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("preserves the rotated credential when verification fails after refresh", async () => {
    mockVerify.mockRejectedValueOnce(upstreamError("reauthorization_required"));
    mockVerify.mockRejectedValueOnce(upstreamError("request_failed"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).status).toBe("request_failed");
    expect(mockRefresh).toHaveBeenCalledOnce();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("does not verify the provider if the authenticated user has no credentials", async () => {
    mockContext.mockResolvedValueOnce({ cookieStore, credentials: null });
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("disconnected");
    expect(mockVerify).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
