import { renderToStaticMarkup } from "react-dom/server";
import { buildEducationalOverview } from "@/application/education/p1";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listPages: vi.fn(),
  listPracticeItems: vi.fn(),
  listPracticeAttempts: vi.fn(),
  listArchivedPageHistory: vi.fn(),
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

    listArchivedPageHistory() {
      return repositoryMocks.listArchivedPageHistory();
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
import { StatisticsView } from "./StatisticsView";

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
    repositoryMocks.listArchivedPageHistory.mockResolvedValue([]);
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

  it("keeps the extracted presentation byte-equivalent for the baseline projection", async () => {
    const pageHtml = renderToStaticMarkup(await EstatisticasPage());
    const educational = buildEducationalOverview(
      [],
      [],
      [],
      new Date("2026-10-07T00:00:00.000Z"),
    );
    const viewHtml = renderToStaticMarkup(
      <div>
        <StatisticsView
          gamification={{
            level: 4,
            levelProgressXp: 0,
            totalXp: 900,
            streakDays: 7,
            completedMissionCount: 1,
            missionCount: 1,
            progressPercent: 0,
          }}
          educational={educational}
          archivedLearningHistory={[]}
        />
      </div>,
    );

    expect(pageHtml).toBe(viewHtml);
  });

  it("preserves the statistics semantic boundaries after extraction", async () => {
    const html = renderToStaticMarkup(await EstatisticasPage());

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Progresso para o próximo nível"');
    expect(html).toContain(
      "Ausência de tentativas permanece como ausência de evidência.",
    );
    expect(html).toContain("Evidência autorreportada por conteúdo");
    expect(html).toContain("Evidência objetiva");
    expect(html).toContain(
      "Nenhuma avaliação objetiva foi criada ainda. A ausência aqui não significa ausência de aprendizagem.",
    );
    expect(html).toContain(
      "Nenhuma lacuna sinalizada com a evidência disponível. Isso não significa que todas as competências estejam dominadas.",
    );
    expect(html).toContain("confiança");
    expect(html).toContain("Não há revisão liberada neste momento.");
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
    expect(html).not.toContain(
      'href="/pratica?pagina=page-2&amp;item=objective-item"',
    );
  });

  it("renders preserved learning evidence from a deleted page", async () => {
    repositoryMocks.listArchivedPageHistory.mockResolvedValue([
      {
        id: "history-1",
        sourcePageId: "deleted-page-1",
        archivedAt: "2026-10-07T12:00:00.000Z",
        snapshot: {
          page: {
            id: "deleted-page-1",
            title: "Anotações antigas",
            content: {
              type: "document",
              blocks: [{ type: "paragraph", content: "Conteúdo preservado." }],
            },
          },
          practiceItems: [
            {
              id: "item-1",
              prompt: "Qual era a ideia principal?",
              reference_answer: "Referência preservada.",
              explanation: null,
              attempts: [
                {
                  id: "attempt-1",
                  answer: "Resposta preservada.",
                  outcome: "partial",
                  evidence_score: 0.6,
                  feedback: "Feedback preservado.",
                  created_at: "2026-10-06T12:00:00.000Z",
                },
              ],
            },
          ],
          pageProgress: [
            {
              status: "completed",
              completed_at: "2026-10-05T12:00:00.000Z",
              updated_at: "2026-10-05T12:00:00.000Z",
            },
          ],
        },
      },
    ]);

    const html = renderToStaticMarkup(await EstatisticasPage());

    expect(html).toContain("Histórico de conteúdos removidos");
    expect(html).toContain("Anotações antigas");
    expect(html).toContain("Conteúdo preservado.");
    expect(html).toContain("Resposta preservada.");
    expect(html).toContain("Feedback preservado.");
  });

  it("keeps an honest empty review state when no review is due", async () => {
    const html = renderToStaticMarkup(await EstatisticasPage());

    expect(html).toContain("Não há revisão liberada neste momento.");
    expect(html).not.toContain(">Revisar</a>");
  });
});
