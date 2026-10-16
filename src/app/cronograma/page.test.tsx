import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { isOutlookCalendarConnected } from "@/infrastructure/integrations/outlook-calendar-session";
import CronogramaPage from "./page";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

const listUpcomingMock = vi.fn();

vi.mock("@/infrastructure/supabase/planning/study-task-repository", () => ({
  SupabaseStudyTaskRepository: vi.fn(function SupabaseStudyTaskRepository() {
    return { listUpcoming: listUpcomingMock };
  }),
}));

vi.mock("@/infrastructure/integrations/outlook-calendar-session", () => ({
  isOutlookCalendarConnected: vi.fn(async () => false),
  getOutlookAccessToken: vi.fn(),
}));

vi.mock("./actions", () => ({
  createStudyTask: vi.fn(),
  completeStudyTaskAction: vi.fn(),
}));

vi.mock("./outlook-actions", () => ({
  createOutlookEventForTask: vi.fn(),
}));

const requireAuthenticatedUserMock = vi.mocked(requireAuthenticatedUser);
const isOutlookCalendarConnectedMock = vi.mocked(isOutlookCalendarConnected);

beforeEach(() => {
  vi.clearAllMocks();
  isOutlookCalendarConnectedMock.mockResolvedValue(false);
  requireAuthenticatedUserMock.mockResolvedValue({
    sub: "user-1",
  } as Awaited<ReturnType<typeof requireAuthenticatedUser>>);
});

describe("CronogramaPage", () => {
  it("renders real upcoming tasks after a successful read", async () => {
    listUpcomingMock.mockResolvedValue([
      {
        id: "task-1",
        ownerId: "user-1",
        title: "Revisar capítulo",
        dueAt: "2026-10-20T14:00:00.000Z",
        status: "pending",
        completedAt: null,
        createdAt: "2026-10-10T10:00:00.000Z",
        updatedAt: "2026-10-10T10:00:00.000Z",
      },
    ]);

    render(await CronogramaPage());

    expect(screen.getByRole("heading", { level: 1, name: "Cronograma" })).toBeInTheDocument();
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(listUpcomingMock).toHaveBeenCalledWith(
      "user-1",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
  });

  it("preserves the legitimate empty state when the read succeeds", async () => {
    listUpcomingMock.mockResolvedValue([]);

    render(await CronogramaPage());

    expect(screen.getByText("Nenhuma tarefa futura cadastrada.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar primeira tarefa" })).toHaveAttribute(
      "href",
      "#study-task-title",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("offers accessible GET retry without faking empty tasks or leaking errors", async () => {
    listUpcomingMock.mockRejectedValue(new Error("private-database-host-and-credentials"));

    render(await CronogramaPage());

    expect(screen.getByRole("heading", { level: 1, name: "Cronograma" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar as tarefas do Cronograma",
    );
    const retry = screen.getByRole("button", { name: "Tentar novamente" });
    expect(retry.closest("form")).toHaveAttribute("action", "/cronograma");
    expect(retry.closest("form")).toHaveAttribute("method", "get");
    expect(screen.getByRole("link", { name: "Voltar à Academia" })).toHaveAttribute(
      "href",
      "/academia",
    );
    expect(screen.queryByText("Nenhuma tarefa futura cadastrada.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar tarefa" })).not.toBeInTheDocument();
    expect(screen.queryByText(/private-database-host-and-credentials/)).not.toBeInTheDocument();
  });

  it("keeps owned study tasks available when Outlook connection lookup fails", async () => {
    const canary = "PRIVATE_SYNTHETIC_OUTLOOK_CREDENTIAL_DIAGNOSTIC";
    listUpcomingMock.mockResolvedValue([{
      id: "task-1", ownerId: "user-1", title: "Revisar capítulo",
      dueAt: null, status: "pending", completedAt: null,
      createdAt: "2026-10-10T10:00:00.000Z",
      updatedAt: "2026-10-10T10:00:00.000Z",
    }]);
    isOutlookCalendarConnectedMock.mockRejectedValueOnce(new Error(canary));

    render(await CronogramaPage());

    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Suas tarefas continuam disponíveis.");
    expect(screen.queryByRole("link", { name: "Conectar Outlook Calendar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desconectar Outlook" })).not.toBeInTheDocument();
    expect(screen.queryByText(canary)).not.toBeInTheDocument();
  });

  it("does not treat authentication failures as recoverable task read errors", async () => {
    requireAuthenticatedUserMock.mockRejectedValue(new Error("authentication required"));

    await expect(CronogramaPage()).rejects.toThrow("authentication required");
    expect(listUpcomingMock).not.toHaveBeenCalled();
  });
});
