import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MissoesPage from "./page";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

const listDailyMissionsMock = vi.fn();

vi.mock("@/infrastructure/supabase/gamification/gamification-repository", () => ({
  SupabaseGamificationRepository: vi.fn(function SupabaseGamificationRepository() {
    return {
      listDailyMissions: listDailyMissionsMock,
    };
  }),
}));

const requireAuthenticatedUserMock = vi.mocked(requireAuthenticatedUser);

beforeEach(() => {
  vi.clearAllMocks();
  requireAuthenticatedUserMock.mockResolvedValue({
    sub: "user-1",
  } as Awaited<ReturnType<typeof requireAuthenticatedUser>>);
});

describe("MissoesPage", () => {
  it("renders persisted daily missions", async () => {
    listDailyMissionsMock.mockResolvedValue([
      {
        id: "mission-1",
        ownerId: "user-1",
        code: "complete-study-task",
        title: "Concluir uma tarefa de estudo",
        rewardXp: 10,
        targetDate: "2026-09-29",
        status: "completed",
        completedAt: "2026-09-29T00:00:00.000Z",
      },
    ]);

    render(await MissoesPage());

    expect(screen.getByRole("heading", { name: "Missões", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/1\/1 concluídas/)).toBeInTheDocument();
    expect(screen.getByText("Concluir uma tarefa de estudo")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Missões de hoje" })).toBeInTheDocument();
    expect(document.querySelector('img[src="/assets/missions/aa-mission-document.svg"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir cronograma" })).toHaveAttribute("href", "/cronograma");
    expect(screen.queryByRole("link", { name: "Planejar um estudo" })).not.toBeInTheDocument();
    expect(listDailyMissionsMock).toHaveBeenCalledWith("user-1", expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it("offers one clear route to plan a study when no mission exists", async () => {
    listDailyMissionsMock.mockResolvedValue([]);

    render(await MissoesPage());

    expect(screen.getByText("Nenhuma missão registrada hoje.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejar um estudo" })).toHaveAttribute("href", "/cronograma");
    expect(screen.queryByRole("heading", { name: "Objetivos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Progresso significativo" })).not.toBeInTheDocument();
  });
});
