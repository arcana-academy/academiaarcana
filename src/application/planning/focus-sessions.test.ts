import { describe, expect, it, vi } from "vitest";

import { FocusSessionService } from "./focus-sessions";

describe("FocusSessionService", () => {
  it("creates a focus session with validated owner data", async () => {
    const repository = {
      start: vi.fn().mockResolvedValue("session-1"),
      complete: vi.fn(),
    };

    const service = new FocusSessionService(repository);

    await expect(
      service.start({
        ownerId: "user-1",
        durationSeconds: 1500,
      }),
    ).resolves.toBe("session-1");

    expect(repository.start).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        ownerId: "user-1",
        durationSeconds: 1500,
        startedAt: expect.any(String),
        completedAt: null,
        createdAt: expect.any(String),
      }),
    );
  });

  it("rejects invalid durations", async () => {
    const repository = {
      start: vi.fn(),
      complete: vi.fn(),
    };
    const service = new FocusSessionService(repository);

    await expect(
      service.start({ ownerId: "user-1", durationSeconds: 59 }),
    ).rejects.toThrow("Duração da sessão de foco inválida.");
    await expect(
      service.start({ ownerId: "user-1", durationSeconds: 14_401 }),
    ).rejects.toThrow("Duração da sessão de foco inválida.");

    expect(repository.start).not.toHaveBeenCalled();
  });

  it("completes only through the repository contract", async () => {
    const repository = {
      start: vi.fn(),
      complete: vi.fn().mockResolvedValue(undefined),
    };
    const service = new FocusSessionService(repository);

    await service.complete("user-1", "session-1");

    expect(repository.complete).toHaveBeenCalledWith(
      "user-1",
      "session-1",
      expect.any(String),
    );
  });

  it("rejects an empty session id before persistence", async () => {
    const repository = {
      start: vi.fn(),
      complete: vi.fn(),
    };
    const service = new FocusSessionService(repository);

    await expect(service.complete("user-1", " ")).rejects.toThrow(
      "Sessão de foco inválida.",
    );

    expect(repository.complete).not.toHaveBeenCalled();
  });
});
