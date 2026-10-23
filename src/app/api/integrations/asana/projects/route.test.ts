import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockContext, mockGetProjects } = vi.hoisted(() => ({
  mockContext: vi.fn(),
  mockGetProjects: vi.fn(),
}));

vi.mock("../_lib", () => ({
  getAsanaCredentialsContext: mockContext,
}));
vi.mock("@/infrastructure/integrations/asana", () => ({
  getAsanaProjects: mockGetProjects,
}));

import { GET } from "./route";

describe("Asana projects route with renewable credentials", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockContext.mockResolvedValue({
      credentials: {
        subjectId: "synthetic-user",
        accessToken: "synthetic-rotated-access",
        refreshToken: "synthetic-rotated-refresh",
        accessTokenExpiresAt: 200000,
      },
      status: "connected",
    });
  });

  it("uses the subject-validated current token to list projects", async () => {
    mockGetProjects.mockResolvedValue({ output: [{ id: "project-1", name: "Demo" }] });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      projects: [{ id: "project-1", name: "Demo" }],
    });
    expect(mockGetProjects).toHaveBeenCalledWith("synthetic-rotated-access");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does not contact Asana without credentials", async () => {
    mockContext.mockResolvedValueOnce({ credentials: null, status: "disconnected" });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana", status: "disconnected", projects: [],
    });
    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  it("returns a reauthorization-required state after failed refresh", async () => {
    mockContext.mockResolvedValueOnce({
      credentials: null,
      status: "reauthorization_required",
    });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana", status: "reauthorization_required", projects: [],
    });
    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  it("reports HTTP 502 without forcing reconnect after a transient refresh outage", async () => {
    mockContext.mockResolvedValueOnce({ credentials: null, status: "request_failed" });
    const response = await GET();
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana", status: "request_failed", projects: [],
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  it("preserves provider error semantics", async () => {
    mockGetProjects.mockRejectedValueOnce(new Error("synthetic provider outage"));
    const response = await GET();
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana", status: "error", projects: [],
    });
  });
});
