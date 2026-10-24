import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StreakPage from "./page";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

const getProfileMock = vi.fn();

vi.mock("@/infrastructure/supabase/gamification/gamification-repository", () => ({
  SupabaseGamificationRepository: vi.fn(function SupabaseGamificationRepository() {
    return {
      getProfile: getProfileMock,
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
    expect(document.querySelector('img[src="/assets/gamification/aa-contained-arcane-flame.svg"]')).toBeInTheDocument();
    expect(getProfileMock).toHaveBeenCalledWith("user-1");
  });

  it("renders an explicit empty state when no profile exists", async () => {
    getProfileMock.mockResolvedValue(null);

    render(await StreakPage());

    expect(screen.getAllByText("Nenhuma atividade registrada ainda.")).toHaveLength(2);
  });
  it("provides an accessible retry when the persisted streak read fails", async () => {
    getProfileMock.mockRejectedValueOnce(new Error("sensitive database details"));

    render(await StreakPage());

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível carregar sua sequência");
    expect(alert).toHaveTextContent("Sua sequência não foi modificada por esta consulta.");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: "Tentar novamente" }).closest("form")).toHaveAttribute("method", "get");
    expect(screen.getByRole("button", { name: "Tentar novamente" }).closest("form")).toHaveAttribute("action", "/streak");
    expect(screen.getByRole("link", { name: "Ir para a Academia" })).toHaveAttribute("href", "/academia");
    expect(screen.queryByText("Nenhuma atividade registrada ainda.")).not.toBeInTheDocument();
    expect(screen.queryByText(/sensitive database details/)).not.toBeInTheDocument();
    expect(getProfileMock).toHaveBeenCalledWith("user-1");
  });

  it("does not turn authentication rejection into a streak read error", async () => {
    requireAuthenticatedUserMock.mockRejectedValueOnce(new Error("Authentication rejected"));

    await expect(StreakPage()).rejects.toThrow("Authentication rejected");
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it("does not suppress a session client initialization error", async () => {
    vi.mocked(createClient).mockRejectedValueOnce(new Error("Client initialization failed"));

    await expect(StreakPage()).rejects.toThrow("Client initialization failed");
    expect(getProfileMock).not.toHaveBeenCalled();
  });

});
