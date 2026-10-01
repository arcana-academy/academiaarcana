import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(() => Promise.resolve({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({})),
}));

vi.mock("@/infrastructure/supabase/gamification/gamification-repository", () => {
  class MockSupabaseGamificationRepository {
    getProfile() {
      void this;
      return Promise.resolve({
        ownerId: "user-1",
        xp: 900,
        streakDays: 7,
        lastActiveOn: "2026-09-29",
        updatedAt: "2026-09-29T10:00:00.000Z",
      });
    }

    listDailyMissions() {
      void this;
      return Promise.resolve([]);
    }
  }

  return { SupabaseGamificationRepository: MockSupabaseGamificationRepository };
});

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import ConquistasPage from "./page";

describe("ConquistasPage", () => {
  it("renders unlocked achievements from real progression rules", async () => {
    const html = renderToStaticMarkup(await ConquistasPage());
    expect(html).toContain("Conquistas");
    expect(html).toContain("Primeiro passo");
    expect(html).toContain("Aprendiz Arcano");
    expect(html).toContain("Constância");
    expect(html).toContain('src="/assets/gamification/aa-achievement-emblem.svg"');
    expect(html).not.toContain("Nenhuma conquista persistida");
  });
});
