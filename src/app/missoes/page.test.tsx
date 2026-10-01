import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MissoesPage from "./page";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({})),
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
    expect(screen.getByText("1/1 concluídas")).toBeInTheDocument();
    expect(screen.getByText("Concluir uma tarefa de estudo")).toBeInTheDocument();
    expect(document.querySelector('img[src="/assets/missions/aa-mission-document.svg"]')).toBeInTheDocument();
    expect(listDailyMissionsMock).toHaveBeenCalledWith("user-1", expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it("renders an explicit empty state", async () => {
    listDailyMissionsMock.mockResolvedValue([]);

    render(await MissoesPage());

    expect(screen.getByText("Nenhuma missão registrada hoje.")).toBeInTheDocument();
  });
});
