// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOutlookAccessToken, isOutlookCalendarConnected } from "@/infrastructure/integrations/outlook-calendar-session";
import CronogramaPage from "./page";

const listPendingForBoardMock = vi.fn();
const listEventsMock = vi.fn();

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "synthetic-user" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));
vi.mock("@/infrastructure/supabase/planning/study-task-repository", () => ({
  SupabaseStudyTaskRepository: vi.fn(function SupabaseStudyTaskRepository() {
    return { listPendingForBoard: listPendingForBoardMock };
  }),
}));
vi.mock("@/infrastructure/integrations/outlook-calendar-session", () => ({
  isOutlookCalendarConnected: vi.fn(),
  getOutlookAccessToken: vi.fn(),
}));
vi.mock("@/infrastructure/integrations/outlook-calendar", () => ({
  OutlookCalendarClient: vi.fn(function OutlookCalendarClient() {
    return { listEvents: listEventsMock };
  }),
}));
vi.mock("./actions", () => ({
  createStudyTask: vi.fn(),
  completeStudyTaskAction: vi.fn(),
}));
vi.mock("./outlook-actions", () => ({
  createOutlookEventForTask: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  listPendingForBoardMock.mockResolvedValue([]);
  listEventsMock.mockResolvedValue([]);
  vi.mocked(isOutlookCalendarConnected).mockResolvedValue(true);
  vi.mocked(getOutlookAccessToken).mockResolvedValue("synthetic-token");
});

describe("CronogramaPage Outlook state", () => {
  it("offers an accessible retry when native tasks cannot be loaded", async () => {
    listPendingForBoardMock.mockRejectedValueOnce(
      new Error("private-database-host-and-credentials"),
    );

    render(await CronogramaPage());

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Não foi possível carregar as tarefas do Cronograma");
    const retry = screen.getByRole("button", { name: "Tentar novamente" });
    expect(retry.closest("form")).toHaveAttribute("action", "/cronograma");
    expect(retry.closest("form")).toHaveAttribute("method", "get");
    expect(
      screen.getByRole("link", { name: "Voltar à Academia" }),
    ).toHaveAttribute("href", "/academia");
    expect(screen.queryByText(/private-database-host-and-credentials/)).not.toBeInTheDocument();
    expect(isOutlookCalendarConnected).not.toHaveBeenCalled();
  });

  it("does not fetch events or flag an outage when Outlook is disconnected", async () => {
    vi.mocked(isOutlookCalendarConnected).mockResolvedValue(false);
    const page = await CronogramaPage();
    expect(page.props.children.props).toMatchObject({
      outlookConnected: false, outlookEventsUnavailable: false, outlookEvents: [],
    });
    expect(getOutlookAccessToken).not.toHaveBeenCalled();
    expect(listEventsMock).not.toHaveBeenCalled();
  });

  it("preserves native tasks when refreshing the Outlook token fails", async () => {
    const tasks = [{ id: "native-task", title: "Revisar runas" }];
    listPendingForBoardMock.mockResolvedValue(tasks);
    vi.mocked(getOutlookAccessToken).mockRejectedValueOnce(new Error("refresh failed"));
    const page = await CronogramaPage();
    expect(page.props.children.props).toMatchObject({
      tasks, outlookConnected: true, outlookEventsUnavailable: true, outlookEvents: [],
    });
    expect(getOutlookAccessToken).toHaveBeenCalledWith({ refresh: true });
    expect(listEventsMock).not.toHaveBeenCalled();
  });

  it("passes successfully loaded events through without an unavailable warning", async () => {
    const events = [{ id: "synthetic-event", subject: "Revisão" }];
    listEventsMock.mockResolvedValue(events);
    const page = await CronogramaPage();
    expect(page.props.children.props).toMatchObject({ outlookEvents: events, outlookEventsUnavailable: false });
  });

  it("preserves study tasks when Outlook credential lookup throws", async () => {
    const tasks = [{ id: "synthetic-task", title: "Revisar runas" }];
    listPendingForBoardMock.mockResolvedValue(tasks);
    vi.mocked(isOutlookCalendarConnected).mockRejectedValueOnce(new Error("credential store unavailable"));
    const page = await CronogramaPage();
    expect(page.props.children.props).toMatchObject({
      tasks,
      outlookConnected: false,
      outlookEventsUnavailable: true,
      outlookEvents: [],
    });
    expect(getOutlookAccessToken).not.toHaveBeenCalled();
    expect(listEventsMock).not.toHaveBeenCalled();
  });

  it("marks a calendar query failure as unavailable, not empty", async () => {
    listEventsMock.mockRejectedValue(new Error("synthetic Outlook outage"));
    const page = await CronogramaPage();
    expect(page.props.children.props.outlookEventsUnavailable).toBe(true);
    expect(page.props.children.props.outlookEvents).toEqual([]);
  });

  it("marks a missing token after connection as unavailable", async () => {
    vi.mocked(getOutlookAccessToken).mockResolvedValue(null);
    const page = await CronogramaPage();
    expect(page.props.children.props.outlookEventsUnavailable).toBe(true);
    expect(listEventsMock).not.toHaveBeenCalled();
  });

  it("keeps a genuinely empty Outlook calendar distinct from an outage", async () => {
    const page = await CronogramaPage();
    expect(page.props.children.props.outlookEventsUnavailable).toBe(false);
    expect(page.props.children.props.outlookEvents).toEqual([]);
    expect(listEventsMock).toHaveBeenCalledTimes(1);
  });
});
