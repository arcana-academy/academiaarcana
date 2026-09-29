import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/infrastructure/supabase/gamification/gamification-repository", () => ({
  SupabaseGamificationRepository: vi.fn(() => ({
    getProfile: vi.fn(async () => ({
      ownerId: "user-1",
      xp: 900,
      streakDays: 7,
      lastActiveOn: "2026-09-29",
      updatedAt: "2026-09-29T10:00:00.000Z",
    })),
    listDailyMissions: vi.fn(async () => [
      { id: "m1", ownerId: "user-1", code: "a", title: "A", rewardXp: 10, targetDate: "2026-09-29", status: "completed", completedAt: "2026-09-29T09:00:00.000Z" },
    ]),
  })),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import EstatisticasPage from "./page";

describe("EstatisticasPage", () => {
  it("renders metrics derived from persisted gamification state", async () => {
    const html = renderToStaticMarkup(await EstatisticasPage());
    expect(html).toContain("Estatísticas");
    expect(html).toContain("Nível 4");
    expect(html).toContain("900 XP");
    expect(html).toContain("7 dias");
    expect(html).toContain("1/1 concluídas");
  });
});
