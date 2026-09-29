import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StreakPage from "./page";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

const { getProfileMock, MockSupabaseGamificationRepository } = vi.hoisted(() => {
  const getProfile = vi.fn();

  class MockRepository {
    constructor(_supabase: unknown) {}
    getProfile = getProfile;
  }

  return {
    getProfileMock: getProfile,
    MockSupabaseGamificationRepository: MockRepository,
  };
});

vi.mock("@/infrastructure/supabase/gamification/gamification-repository", () => ({
  SupabaseGamificationRepository: MockSupabaseGamificationRepository,
}));

const requireAuthenticatedUserMock = vi.mocked(requireAuthenticatedUser);

beforeEach(() => {
  vi.clearAllMocks();
  requireAuthenticatedUserMock.mockResolvedValue({
    sub: "user-1",
  } as Awaited<ReturnType<typeof requireAuthenticatedUser>>);
});

describe("StreakPage", () => {
  it("renders the persisted streak state", async () => {
    getProfileMock.mockResolvedValue({
      ownerId: "user-1",
      xp: 40,
      streakDays: 3,
      lastActiveOn: "2026-09-28",
      updatedAt: "2026-09-28T20:00:00.000Z",
    });

    render(await StreakPage());

    expect(screen.getByRole("heading", { name: "Streak", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("3 dias")).toBeInTheDocument();
    expect(screen.getByText("2026-09-28")).toBeInTheDocument();
    expect(getProfileMock).toHaveBeenCalledWith("user-1");
  });

  it("renders an explicit empty state when no profile exists", async () => {
    getProfileMock.mockResolvedValue(null);

    render(await StreakPage());

    expect(screen.getByText("Nenhuma atividade registrada ainda.")).toBeInTheDocument();
  });
});
