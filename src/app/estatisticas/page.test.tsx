import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listPages: vi.fn(),
  listPracticeItems: vi.fn(),
  listPracticeAttempts: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/infrastructure/supabase/education/practice-repository", () => {
  class MockSupabaseEducationalPracticeRepository {
    listPages() {
      return repositoryMocks.listPages();
    }

    listPracticeItems() {
      return repositoryMocks.listPracticeItems();
    }

    listPracticeAttempts() {
      return repositoryMocks.listPracticeAttempts();
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
        {
          id: "m1",
          ownerId: "user-1",
          code: "a",
          title: "A",
          rewardXp: 10,
          targetDate: "2026-09-29",
          status: "completed",
          completedAt: "2026-09-29T09:00:00.000Z",
        },
      ];
    }
  }

  return { SupabaseGamificationRepository: MockSupabaseGamificationRepository };
});

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import EstatisticasPage from "./page";

const selfItem = {
  id: "self-item",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Fisiologia",
  prompt: "Explique a ideia central.",
  referenceAnswer: "Resposta de referência.",
  explanation: null,
  difficulty: 3 as const,
  active: true,
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
  evidenceMode: "self_assessment" as const,
  criterion: null,
  criterionVersion: null,
  minimumEvidence: 2,
};

const objectiveItem = {
  id: "objective-item",
  ownerId: "user-1",
  pageId: "page-2",
  pageTitle: "Anatomia",
  prompt: "Qual é a resposta?",
  referenceAnswer: "Resposta correta",
  explanation: null,
  difficulty: 3 as const,
  active: true,
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
  evidenceMode: "criterion_exact_match" as const,
  criterion: "Correspondência exata normalizada.",
  criterionVersion: "1",
  minimumEvidence: 2,
};

const selfAttempt = {
  id: "self-attempt",
  ownerId: "user-1",
  practiceItemId: selfItem.id,
  answer: "Resposta.",
  outcome: "partial" as const,
  evidenceScore: 0.6,
  confidence: "partial" as const,
  feedback: "Feedback.",
  createdAt: "2020-01-01T00:00:00.000Z",
  evidenceType: "self-assessment" as const,
  criterion: null,
  criterionVersion: null,
  criterionResult: null,
  criterionScope: null,
  criterionReference: null,
};

const objectiveAttempt = {
  id: "objective-attempt",
  ownerId: "user-1",
  practiceItemId: objectiveItem.id,
  answer: "Resposta correta",
  outcome: "strong" as const,
  evidenceScore: 1,
  confidence: "strong" as const,
  feedback: "Critério satisfeito.",
  createdAt: "2020-01-01T00:00:00.000Z",
  evidenceType: "criterion-referenced" as const,
  criterion: objectiveItem.criterion,
  criterionVersion: "1",
  criterionResult: "pass" as const,
  criterionScope: "practice-item",
  criterionReference: objectiveItem.referenceAnswer,
};

describe("EstatisticasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.listPages.mockResolvedValue([]);
    repositoryMocks.listPracticeItems.mockResolvedValue([]);
    repositoryMocks.listPracticeAttempts.mockResolvedValue([]);
  });

  it("renders metrics derived from persisted gamification state", async () => {
    const html = renderToStaticMarkup(await EstatisticasPage());
    expect(html).toContain("Estatísticas");
    expect(html).toContain("Nível 4");
    expect(html).toContain("900 XP");
    expect(html).toContain("7 dias");
    expect(html).toContain("/assets/gamification/aa-contained-arcane-flame.svg");
    expect(html).toContain("1/1 concluídas");
  });

  it("renders canonical review handoffs for self-assessment and objective activities", async () => {
    repositoryMocks.listPages.mockResolvedValue([
      { id: "page-1", title: "Fisiologia" },
      { id: "page-2", title: "Anatomia" },
    ]);
    repositoryMocks.listPracticeItems.mockResolvedValue([selfItem, objectiveItem]);
    repositoryMocks.listPracticeAttempts.mockResolvedValue([
      selfAttempt,
      objectiveAttempt,
    ]);

    const html = renderToStaticMarkup(await EstatisticasPage());

    expect(
      html.match(/href="\/pratica\?pagina=page-1&amp;item=self-item"/g),
    ).toHaveLength(2);
    expect(
      html.match(
        /href="\/pratica\?pagina=page-2&amp;avaliacao=objective-item"/g,
      ),
    ).toHaveLength(2);
    expect(html).not.toContain('href="/pratica?item=');
  });

  it("keeps an honest empty review state when no review is due", async () => {
    const html = renderToStaticMarkup(await EstatisticasPage());

    expect(html).toContain("Não há revisão liberada neste momento.");
    expect(html).not.toContain(">Revisar</a>");
  });
});
