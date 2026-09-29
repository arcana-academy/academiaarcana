import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookies,
  mockRequireAuthenticatedUser,
  mockDecryptAsanaCredentials,
  mockGetAsanaTasks,
  mockCreateAsanaTask,
  mockCloseAsanaTask,
} = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockRequireAuthenticatedUser: vi.fn(),
  mockDecryptAsanaCredentials: vi.fn(),
  mockGetAsanaTasks: vi.fn(),
  mockCreateAsanaTask: vi.fn(),
  mockCloseAsanaTask: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mockRequireAuthenticatedUser,
}));

vi.mock("@/infrastructure/integrations/asana", () => ({
  ASANA_CREDENTIALS_COOKIE: "arcana_asana_credentials",
  decryptAsanaCredentials: mockDecryptAsanaCredentials,
  getAsanaTasks: mockGetAsanaTasks,
  createAsanaTask: mockCreateAsanaTask,
  closeAsanaTask: mockCloseAsanaTask,
}));

import { GET, PATCH, POST } from "./route";

describe("Asana task routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({ sub: "user-1" });
    mockCookies.mockResolvedValue({ get: () => undefined });
    mockDecryptAsanaCredentials.mockResolvedValue(null);
  });

  it("returns a disconnected task list when no user-bound credentials exist", async () => {
    const response = await GET(
      new Request("https://example.com/api/integrations/asana/tasks"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana",
      status: "disconnected",
      tasks: [],
    });
    expect(mockGetAsanaTasks).not.toHaveBeenCalled();
  });

  it("rejects task creation without an active connection", async () => {
    const response = await POST(
      new Request("https://example.com/api/integrations/asana/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Revisar capítulo 2" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana",
      status: "disconnected",
    });
    expect(mockCreateAsanaTask).not.toHaveBeenCalled();
  });

  it("rejects task completion without an active connection", async () => {
    const response = await PATCH(
      new Request("https://example.com/api/integrations/asana/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: "task-1" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana",
      status: "disconnected",
    });
    expect(mockCloseAsanaTask).not.toHaveBeenCalled();
  });

  it("binds provider credentials to the authenticated subject for reads", async () => {
    mockDecryptAsanaCredentials.mockResolvedValue({
      subjectId: "user-1",
      accessToken: "access-token",
      refreshToken: null,
      accessTokenExpiresAt: null,
    });
    mockGetAsanaTasks.mockResolvedValue({
      output: [{ id: "task-1", name: "Estudar" }],
    });

    const response = await GET(
      new Request(
        "https://example.com/api/integrations/asana/tasks?projectId=project-1",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      tasks: [{ id: "task-1", name: "Estudar" }],
    });
    expect(mockGetAsanaTasks).toHaveBeenCalledWith("access-token", "project-1");
  });
});
