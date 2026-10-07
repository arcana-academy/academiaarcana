import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/infrastructure/supabase/education/practice-repository", () => {
  class MockSupabaseEducationalPracticeRepository {
    listPages() {
      return [{ id: "page-1", title: "Anatomia" }];
    }

    listPracticeItems() {
      return [{
        id: "practice-1",
        ownerId: "user-1",
        pageId: "page-1",
        pageTitle: "Anatomia",
        prompt: "Explique.",
        referenceAnswer: "Resposta.",
        explanation: null,
        difficulty: 3 as const,
        active: true,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      }];
    }

    listPracticeAttempts() {
      return [{
        id: "attempt-1",
        ownerId: "user-1",
        practiceItemId: "practice-1",
        answer: "Resposta.",
        outcome: "strong" as const,
        evidenceScore: 1,
        confidence: "partial" as const,
        feedback: "Feedback.",
        createdAt: "2026-09-01T00:00:00.000Z",
      }];
    }
  }

  return { SupabaseEducationalPracticeRepository: MockSupabaseEducationalPracticeRepository };
});

vi.mock("@/infrastructure/supabase/gamification/gamification-repository", () => {
  class MockSupabaseGamificationRepository {
    getProfile() {
      return {
        ownerId: "user-1",
        xp: 900,
        streakDays: 7,
        lastActiveOn: "2026-09-29",
        updatedAt: "2026-09-29T10:00:00.000Z",
      };
    }

    listDailyMissions() {
      return [
        { id: "m1", ownerId: "user-1", code: "a", title: "A", rewardXp: 10, targetDate: "2026-09-29", status: "completed", completedAt: "2026-09-29T09:00:00.000Z" },
      ];
    }
  }

  return { SupabaseGamificationRepository: MockSupabaseGamificationRepository };
});

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
    expect(html).toContain("/assets/gamification/aa-contained-arcane-flame.svg");
    expect(html).toContain("1/1 concluídas");
    expect(html).toContain('href="/pratica?pagina=page-1&amp;item=practice-1"');
  });
});
