import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookies,
  mockClaims,
  mockDecrypt,
  mockEncrypt,
  mockRefresh,
  mockShouldRefresh,
  mockTasks,
  mockProjects,
  mockCreate,
  mockClose,
  cookieStore,
} = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockClaims: vi.fn(),
  mockDecrypt: vi.fn(),
  mockEncrypt: vi.fn(),
  mockRefresh: vi.fn(),
  mockShouldRefresh: vi.fn(),
  mockTasks: vi.fn(),
  mockProjects: vi.fn(),
  mockCreate: vi.fn(),
  mockClose: vi.fn(),
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock("next/headers", () => ({ cookies: mockCookies }));
vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mockClaims,
}));
vi.mock("@/infrastructure/integrations/todoist", () => {
  class TodoistConnectionError extends Error {
    constructor(
      message: string,
      readonly httpStatus?: number,
      readonly oauthError?: "invalid_grant",
    ) {
      super(message);
      this.name = "TodoistConnectionError";
    }
  }
  return {
    TodoistConnectionError,
    TODOIST_CREDENTIALS_COOKIE: "__Host-aa-todoist-credentials",
    decryptTodoistCredentials: mockDecrypt,
    encryptTodoistCredentials: mockEncrypt,
    refreshTodoistCredentials: mockRefresh,
    shouldRefreshTodoistCredentials: mockShouldRefresh,
    getTodoistTasks: mockTasks,
    getTodoistProjects: mockProjects,
    createTodoistTask: mockCreate,
    closeTodoistTask: mockClose,
  };
});

import { TodoistConnectionError } from "@/infrastructure/integrations/todoist";
import { GET, PATCH, POST } from "./route";

const credentials = {
  subjectId: "synthetic-owner",
  accessToken: "synthetic-expired-access",
  refreshToken: "synthetic-refresh",
  accessTokenExpiresAt: 1,
};

function postRequest() {
  return new Request("https://example.invalid/api/integrations/todoist/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Revisar conteúdo" }),
  });
}

function patchRequest() {
  return new Request("https://example.invalid/api/integrations/todoist/tasks", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId: "synthetic-task" }),
  });
}

describe("Todoist tasks: preserve credentials on transient refresh failures", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockClaims.mockResolvedValue({ sub: "synthetic-owner" });
    mockCookies.mockResolvedValue(cookieStore);
    cookieStore.get.mockReturnValue({ value: "synthetic-encrypted-cookie" });
    mockDecrypt.mockResolvedValue(credentials);
    mockShouldRefresh.mockReturnValue(true);
    mockEncrypt.mockResolvedValue("synthetic-rotated-cookie");
    mockTasks.mockResolvedValue({ output: [] });
    mockProjects.mockResolvedValue({ output: [] });
  });

  it.each([429, 500, 503])("GET preserves the cookie when refresh responds HTTP %i", async (httpStatus) => {
    mockRefresh.mockRejectedValueOnce(
      new TodoistConnectionError("temporary failure", httpStatus),
    );
    const response = await GET();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ status: "request_failed" });
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(mockTasks).not.toHaveBeenCalled();
  });

  it("GET preserves the cookie on HTTP 400 without proven invalid_grant", async () => {
    mockRefresh.mockRejectedValueOnce(new TodoistConnectionError("generic 400", 400));
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).status).toBe("request_failed");
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("GET requires reauthorization after an explicit 400 invalid_grant", async () => {
    mockRefresh.mockRejectedValueOnce(
      new TodoistConnectionError("revoked refresh token", 400, "invalid_grant"),
    );
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("reauthorization_required");
    expect(cookieStore.delete).toHaveBeenCalledWith("__Host-aa-todoist-credentials");
  });

  it("GET preserves the cookie on network failure without HTTP response", async () => {
    mockRefresh.mockRejectedValueOnce(new TypeError("synthetic TCP reset"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).status).toBe("request_failed");
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it.each([401, 403])("GET clears credentials after explicit OAuth rejection HTTP %i", async (httpStatus) => {
    mockRefresh.mockRejectedValueOnce(
      new TodoistConnectionError("rejected", httpStatus),
    );
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "reauthorization_required" });
    expect(cookieStore.delete).toHaveBeenCalledWith("__Host-aa-todoist-credentials");
    expect(cookieStore.delete).toHaveBeenCalledTimes(1);
  });

  it("POST never attempts a provider mutation when refresh is temporarily unavailable", async () => {
    mockRefresh.mockRejectedValueOnce(new TodoistConnectionError("outage", 503));
    const response = await POST(postRequest());
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "request_failed" });
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("PATCH never attempts task completion when refresh is temporarily unavailable", async () => {
    mockRefresh.mockRejectedValueOnce(new TodoistConnectionError("outage", 429));
    const response = await PATCH(patchRequest());
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "request_failed" });
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
  });

  it("POST returns 401 after a confirmed OAuth token rejection, without mutating", async () => {
    mockRefresh.mockRejectedValueOnce(new TodoistConnectionError("rejected", 401));
    const response = await POST(postRequest());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "reauthorization_required" });
    expect(cookieStore.delete).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("still rejects credentials that belong to another user", async () => {
    mockDecrypt.mockResolvedValueOnce({ ...credentials, subjectId: "other-user" });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "disconnected" });
    expect(cookieStore.delete).toHaveBeenCalledTimes(1);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockTasks).not.toHaveBeenCalled();
  });

  it("rotates the owner-bound cookie before continuing normal read operations", async () => {
    mockRefresh.mockResolvedValueOnce({
      ...credentials,
      accessToken: "synthetic-new-access",
      refreshToken: "synthetic-new-refresh",
    });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "connected",
      tasks: [],
      projects: [],
    });
    expect(mockEncrypt).toHaveBeenCalledOnce();
    expect(cookieStore.set).toHaveBeenCalledWith(
      "__Host-aa-todoist-credentials",
      "synthetic-rotated-cookie",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(mockTasks).toHaveBeenCalledWith("synthetic-new-access");
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});
