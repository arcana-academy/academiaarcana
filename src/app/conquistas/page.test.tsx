import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const { getProfileMock, listDailyMissionsMock } = vi.hoisted(() => ({
  getProfileMock: vi.fn(),
  listDailyMissionsMock: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/infrastructure/supabase/gamification/gamification-repository", () => ({
  SupabaseGamificationRepository: vi.fn(function SupabaseGamificationRepository() {
    return { getProfile: getProfileMock, listDailyMissions: listDailyMissionsMock };
  }),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import ConquistasPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  getProfileMock.mockReset();
  listDailyMissionsMock.mockReset();
  vi.mocked(requireAuthenticatedUser).mockReset();
  vi.mocked(requireAuthenticatedUser).mockResolvedValue({
    sub: "user-1",
  } as Awaited<ReturnType<typeof requireAuthenticatedUser>>);
  getProfileMock.mockResolvedValue({
    ownerId: "user-1",
    xp: 900,
    streakDays: 7,
    lastActiveOn: "2026-09-29",
    updatedAt: "2026-09-29T10:00:00.000Z",
  });
  listDailyMissionsMock.mockResolvedValue([]);
});

describe("ConquistasPage", () => {
  it("renders unlocked achievements from real progression rules", async () => {
    const html = renderToStaticMarkup(await ConquistasPage());
    expect(html).toContain("Conquistas");
    expect(html).toContain("Primeiro passo");
    expect(html).toContain("Aprendiz Arcano");
    expect(html).toContain("Constância");
    expect(html).toContain("Progresso para Guardião das Missões");
    expect(html).toContain('aria-valuemin="0" aria-valuemax="3" aria-valuenow="0"');
    expect(html).toContain("0/3 missões de hoje");
    expect(html).toContain('src="/assets/gamification/aa-achievement-emblem.svg"');
    expect(html).not.toContain("Nenhuma conquista persistida");
  });

  it.each(["profile", "missions"] as const)(
    "shows a recoverable alert without false zero progress when %s loading fails",
    async (failureSource) => {
      if (failureSource === "profile") {
        getProfileMock.mockRejectedValueOnce(new Error("sensitive-connection-details"));
      } else {
        listDailyMissionsMock.mockRejectedValueOnce(new Error("sensitive-connection-details"));
      }

      const html = renderToStaticMarkup(await ConquistasPage());

      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-labelledby="conquistas-unavailable-title"');
      expect(html).toContain("Não foi possível carregar suas conquistas");
      expect(html).toContain('action="/conquistas"');
      expect(html).toContain('method="get"');
      expect(html).toContain('type="submit"');
      expect(html).toContain("Tentar novamente");
      expect(html).not.toContain("sensitive-connection-details");
      expect(html).not.toContain("Primeiro passo");
      expect(html).not.toContain("Nível 1");
      expect(html).not.toContain("Conquistas desbloqueadas");
      expect(getProfileMock).toHaveBeenCalledWith("user-1");

      if (failureSource === "profile") {
        expect(listDailyMissionsMock).not.toHaveBeenCalled();
      } else {
        expect(listDailyMissionsMock).toHaveBeenCalledWith(
          "user-1",
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        );
      }
    },
  );

  it("does not mistake a genuinely empty profile for a backend outage", async () => {
    getProfileMock.mockResolvedValueOnce(null);

    const html = renderToStaticMarkup(await ConquistasPage());

    expect(html).not.toContain("Não foi possível carregar suas conquistas");
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Conquistas");
    expect(listDailyMissionsMock).toHaveBeenCalledTimes(1);
  });

  it("preserves authentication failure instead of treating it as a read outage", async () => {
    vi.mocked(requireAuthenticatedUser).mockRejectedValueOnce(
      new Error("authentication required"),
    );

    await expect(ConquistasPage()).rejects.toThrow("authentication required");
    expect(getProfileMock).not.toHaveBeenCalled();
    expect(listDailyMissionsMock).not.toHaveBeenCalled();
  });
});
