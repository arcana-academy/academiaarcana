import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  createClient: vi.fn(),
  getById: vi.fn(),
  getOutlookAccessToken: vi.fn(),
  createEvent: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/infrastructure/supabase/planning/study-task-repository", () => ({
  SupabaseStudyTaskRepository: vi.fn(function () {
    return { getById: mocks.getById };
  }),
}));

vi.mock("@/infrastructure/integrations/outlook-calendar-session", () => ({
  getOutlookAccessToken: mocks.getOutlookAccessToken,
}));

vi.mock("@/infrastructure/integrations/outlook-calendar", () => ({
  OutlookCalendarClient: vi.fn(function () {
    return { createEvent: mocks.createEvent };
  }),
}));

import { createOutlookEventForTask } from "./outlook-actions";

const pendingTask = {
  id: "task-1",
  ownerId: "user-1",
  title: "Revisar o grimório",
  status: "pending",
  dueAt: "2026-10-20T14:00:00.000Z",
};

describe("createOutlookEventForTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ sub: "user-1" });
    mocks.createClient.mockResolvedValue({ syntheticClient: true });
    mocks.getById.mockResolvedValue({ ...pendingTask });
    mocks.getOutlookAccessToken.mockResolvedValue("synthetic-access-token");
    mocks.createEvent.mockResolvedValue({ id: "calendar-event-1", webLink: null });
  });

  it("creates a calendar event for an owned pending scheduled task", async () => {
    await expect(createOutlookEventForTask("task-1")).resolves.toMatchObject({
      id: "calendar-event-1",
    });

    expect(mocks.getById).toHaveBeenCalledWith("task-1");
    expect(mocks.getOutlookAccessToken).toHaveBeenCalledWith({ refresh: true });
    expect(mocks.createEvent).toHaveBeenCalledWith({
      subject: "Academia Arcana · Revisar o grimório",
      start: "2026-10-20T14:00:00.000Z",
      end: "2026-10-20T14:50:00.000Z",
      body: "Sessão de estudo criada a partir do Cronograma da Academia Arcana.",
      reminderMinutesBeforeStart: 15,
      transactionId: "task-1",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cronograma");
  });

  it.each(["completed", "cancelled"])(
    "rejects a stale %s task before refreshing a token or creating an event",
    async (status) => {
      mocks.getById.mockResolvedValueOnce({ ...pendingTask, status });

      await expect(createOutlookEventForTask("task-1")).rejects.toThrow(
        "STUDY_TASK_NOT_PENDING",
      );
      expect(mocks.getOutlookAccessToken).not.toHaveBeenCalled();
      expect(mocks.createEvent).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("rejects an unknown task without refreshing OAuth credentials", async () => {
    mocks.getById.mockResolvedValueOnce(null);

    await expect(createOutlookEventForTask("missing")).rejects.toThrow(
      "STUDY_TASK_NOT_FOUND",
    );
    expect(mocks.getOutlookAccessToken).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("rejects a foreign-owned task without refreshing OAuth credentials", async () => {
    mocks.getById.mockResolvedValueOnce({ ...pendingTask, ownerId: "user-2" });

    await expect(createOutlookEventForTask("task-1")).rejects.toThrow(
      "STUDY_TASK_NOT_FOUND",
    );
    expect(mocks.getOutlookAccessToken).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("rejects a pending task with no schedule before accessing Outlook", async () => {
    mocks.getById.mockResolvedValueOnce({ ...pendingTask, dueAt: null });

    await expect(createOutlookEventForTask("task-1")).rejects.toThrow(
      "STUDY_TASK_WITHOUT_SCHEDULE",
    );
    expect(mocks.getOutlookAccessToken).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("rejects an invalid schedule before token access", async () => {
    mocks.getById.mockResolvedValueOnce({ ...pendingTask, dueAt: "invalid-date" });

    await expect(createOutlookEventForTask("task-1")).rejects.toThrow(
      "STUDY_TASK_INVALID_SCHEDULE",
    );
    expect(mocks.getOutlookAccessToken).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("does not create an event without a connected Outlook account", async () => {
    mocks.getOutlookAccessToken.mockResolvedValueOnce(null);

    await expect(createOutlookEventForTask("task-1")).rejects.toThrow(
      "OUTLOOK_NOT_CONNECTED",
    );
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("does not swallow the authentication guard failure", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValueOnce(new Error("guard rejected"));

    await expect(createOutlookEventForTask("task-1")).rejects.toThrow(
      "guard rejected",
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getOutlookAccessToken).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("does not confirm a calendar event when the provider fails", async () => {
    mocks.createEvent.mockRejectedValueOnce(new Error("synthetic Graph failure"));

    await expect(createOutlookEventForTask("task-1")).rejects.toThrow(
      "synthetic Graph failure",
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
