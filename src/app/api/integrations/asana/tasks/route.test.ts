import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockContext, mockGetTasks, mockCreateTask, mockCloseTask } = vi.hoisted(() => ({
  mockContext: vi.fn(),
  mockGetTasks: vi.fn(),
  mockCreateTask: vi.fn(),
  mockCloseTask: vi.fn(),
}));

vi.mock("../_lib", () => ({
  getAsanaCredentialsContext: mockContext,
}));
vi.mock("@/infrastructure/integrations/asana", () => ({
  getAsanaTasks: mockGetTasks,
  createAsanaTask: mockCreateTask,
  closeAsanaTask: mockCloseTask,
}));

import { GET, PATCH, POST } from "./route";

const credentials = {
  subjectId: "synthetic-user",
  accessToken: "synthetic-current-access",
  refreshToken: "synthetic-refresh",
  accessTokenExpiresAt: 200000,
};

function request(method: "POST" | "PATCH", body: object) {
  return new Request("https://example.invalid/api/integrations/asana/tasks", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Asana task routes with authenticated credential context", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockContext.mockResolvedValue({ credentials, status: "connected" });
  });

  it("returns disconnected without invoking the provider", async () => {
    mockContext.mockResolvedValueOnce({ credentials: null, status: "disconnected" });
    const response = await GET(new Request("https://example.invalid/api/integrations/asana/tasks"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana",
      status: "disconnected",
      tasks: [],
    });
    expect(mockGetTasks).not.toHaveBeenCalled();
  });

  it("does not create or close tasks without credentials", async () => {
    mockContext.mockResolvedValue({ credentials: null, status: "disconnected" });
    const created = await POST(request("POST", { name: "Synthetic task" }));
    const closed = await PATCH(request("PATCH", { taskId: "task-1" }));
    expect(created.status).toBe(401);
    expect(closed.status).toBe(401);
    expect(mockCreateTask).not.toHaveBeenCalled();
    expect(mockCloseTask).not.toHaveBeenCalled();
  });

  it("propagates a refresh failure as reauthorization_required without calling the provider", async () => {
    mockContext.mockResolvedValueOnce({ credentials: null, status: "reauthorization_required" });
    const response = await GET(new Request("https://example.invalid/api/integrations/asana/tasks"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana", status: "reauthorization_required", tasks: [],
    });
    expect(mockGetTasks).not.toHaveBeenCalled();
  });

  it("responds HTTP 502 for temporary refresh failure on reads and writes", async () => {
    mockContext.mockResolvedValue({ credentials: null, status: "request_failed" });
    const listed = await GET(new Request("https://example.invalid/api/integrations/asana/tasks"));
    const created = await POST(request("POST", { name: "Synthetic task" }));
    const closed = await PATCH(request("PATCH", { taskId: "task-1" }));
    expect([listed.status, created.status, closed.status]).toEqual([502, 502, 502]);
    for (const response of [listed, created, closed]) {
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect((await response.json()).status).toBe("request_failed");
    }
    expect(mockGetTasks).not.toHaveBeenCalled();
    expect(mockCreateTask).not.toHaveBeenCalled();
    expect(mockCloseTask).not.toHaveBeenCalled();
  });

  it("lists tasks with the subject-validated refreshed token and project filter", async () => {
    mockGetTasks.mockResolvedValue({ output: [{ id: "task-1", name: "Study" }] });
    const response = await GET(
      new Request("https://example.invalid/api/integrations/asana/tasks?projectId=project-1"),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tasks: [{ id: "task-1", name: "Study" }] });
    expect(mockGetTasks).toHaveBeenCalledWith("synthetic-current-access", "project-1");
  });

  it("creates a task using the authenticated context", async () => {
    mockCreateTask.mockResolvedValue({ output: { id: "task-2" } });
    const response = await POST(request("POST", { name: "Review chapter" }));
    expect(response.status).toBe(201);
    expect(mockCreateTask).toHaveBeenCalledWith("synthetic-current-access", {
      name: "Review chapter",
      notes: undefined,
      dueOn: undefined,
      dueAt: undefined,
      projectId: undefined,
    });
  });

  it("completes a task using the authenticated context", async () => {
    mockCloseTask.mockResolvedValue({ output: { id: "task-1", completed: true } });
    const response = await PATCH(request("PATCH", { taskId: "task-1" }));
    expect(response.status).toBe(200);
    expect(mockCloseTask).toHaveBeenCalledWith("synthetic-current-access", "task-1");
  });
});
