import { describe, expect, it, vi } from "vitest";

import type {
  SanctuaryGrimoire,
  SanctuaryProjectionPort,
  SanctuaryUser,
} from "@/domains/sanctuary";

import { getSanctuary } from "./get-sanctuary";

type SanctuaryRepository = SanctuaryProjectionPort;

const user: SanctuaryUser = {
  id: "user-1",
  displayName: "Taynara",
};

const sessionContext = {
  user,
};

const grimoire: SanctuaryGrimoire = {
  id: "grimoire-1",
  ownerId: "user-1",
  title: "Anatomia",
  icon: "book-open",
  cover: "cover.png",
  notebooks: [
    {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Sistema musculoesquelético",
      position: 0,
      chapters: [
        {
          id: "chapter-1",
          notebookId: "notebook-1",
          title: "Introdução",
          position: 0,
          pages: [
            {
              id: "page-1",
              chapterId: "chapter-1",
              title: "Página inicial",
              position: 0,
            },
          ],
        },
      ],
    },
  ],
};

function createRepository(
  learningHierarchy: SanctuaryGrimoire[],
): SanctuaryRepository {
  return {
    getLearningHierarchy: vi
      .fn()
      .mockResolvedValue(learningHierarchy),
  };
}

describe("getSanctuary", () => {
  it("composes a complete Sanctuary view model from authenticated learning data", async () => {
    const repository = createRepository([grimoire]);

    const result = await getSanctuary(repository, sessionContext);

    expect(result.header).toEqual({
      greeting: expect.any(String),
      user,
    });

    expect(result.continueLearning).toEqual({
      status: "ready",
      data: {
        intent: "explore",
        grimoireId: "grimoire-1",
        grimoireTitle: "Anatomia",
        notebookId: "notebook-1",
        notebookTitle: "Sistema musculoesquelético",
        chapterId: "chapter-1",
        chapterTitle: "Introdução",
        pageId: "page-1",
        pageTitle: "Página inicial",
        href: expect.any(String),
      },
    });

    expect(result.progress).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.missions).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.schedule).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.adaptiveRecommendation).toEqual(expect.objectContaining({ title: "Explore no seu ritmo", href: "/grimorios" }));
    expect(result.quickActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: expect.any(String),
        }),
      ]),
    );

    expect(result.primaryAction).toEqual(
      expect.objectContaining({
        label: "Explorar conteúdo",
        priority: "primary",
        href: expect.any(String),
      }),
    );

    expect(repository.getLearningHierarchy).toHaveBeenCalledTimes(1);
  });

  it("returns an empty learning state without fabricating missions, progress, or schedule", async () => {
    const repository = createRepository([]);

    const result = await getSanctuary(repository, sessionContext);

    expect(result.header.user).toEqual(user);
    expect(result.continueLearning).toEqual({
      status: "empty",
      data: null,
    });
    expect(result.progress).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.missions).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.schedule).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.adaptiveRecommendation).toEqual(expect.objectContaining({ title: "Explore no seu ritmo", href: "/grimorios" }));
    expect(result.quickActions).toEqual(expect.any(Array));
    expect(result.primaryAction).toEqual(
      expect.objectContaining({
        priority: expect.any(String),
        href: expect.any(String),
      }),
    );
  });

  it("represents a learning-source failure as error instead of empty", async () => {
    const getPageProgress = vi.fn().mockResolvedValue([]);
    const repository: SanctuaryRepository = {
      getLearningHierarchy: vi
        .fn()
        .mockRejectedValue(new Error("learning source unavailable")),
      getPageProgress,
    };

    const result = await getSanctuary(repository, sessionContext);

    expect(result.header.user).toEqual(user);
    expect(result.continueLearning).toEqual({
      status: "error",
      data: null,
      message: "Não foi possível carregar seu contexto de aprendizagem.",
    });
    expect(result.continueLearning.status).not.toBe("empty");
    expect(result.progress).toEqual({
      status: "error",
      data: null,
      message: "Não foi possível carregar o progresso sem o contexto de aprendizagem.",
    });
    expect(getPageProgress).not.toHaveBeenCalled();
    expect(result.missions).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.schedule).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.primaryAction).toEqual(
      expect.objectContaining({
        id: "open-workspace",
        label: "Abrir Workspace",
      }),
    );
  });

  it("connects real progress, planning and gamification data into the Sanctuary", async () => {
    const repository: SanctuaryRepository = {
      getLearningHierarchy: vi.fn().mockResolvedValue([grimoire]),
      getPageProgress: vi.fn().mockResolvedValue([
        {
          id: "progress-1",
          ownerId: "user-1",
          pageId: "page-1",
          status: "completed",
          completedAt: "2026-09-24T10:00:00.000Z",
          updatedAt: "2026-09-24T10:00:00.000Z",
        },
      ]),
      listUpcomingStudyTasks: vi.fn().mockResolvedValue([
        {
          id: "task-1",
          ownerId: "user-1",
          title: "Revisar capítulo",
          dueAt: "2026-09-25T14:00:00.000Z",
          status: "pending",
          completedAt: null,
          createdAt: "2026-09-24T10:00:00.000Z",
          updatedAt: "2026-09-24T10:00:00.000Z",
        },
      ]),
      listDailyMissions: vi.fn().mockResolvedValue([
        {
          id: "mission-1",
          ownerId: "user-1",
          code: "complete-study-task",
          title: "Concluir uma tarefa de estudo",
          rewardXp: 10,
          targetDate: "2026-09-24",
          status: "open",
          completedAt: null,
        },
      ]),
    };

    const result = await getSanctuary(repository, sessionContext);

    expect(result.progress).toEqual({
      status: "ready",
      data: {
        percentage: 100,
        label: "1 de 1 páginas concluídas",
      },
    });
    expect(result.missions).toEqual({
      status: "ready",
      data: [
        {
          id: "mission-1",
          title: "Concluir uma tarefa de estudo",
          reward: "+10 XP",
          isCompleted: false,
        },
      ],
    });
    expect(result.adaptiveRecommendation).toEqual(expect.objectContaining({ title: "Retome uma missão", href: "/missoes" }));
    expect(result.schedule).toEqual({
      status: "ready",
      data: [
        {
          id: "task-1",
          time: expect.any(String),
          title: "Revisar capítulo",
        },
      ],
    });
  });

  it("does not mutate the authenticated session context", async () => {
    const repository = createRepository([grimoire]);

    const originalSessionContext = structuredClone(sessionContext);

    await getSanctuary(repository, sessionContext);

    expect(sessionContext).toEqual(originalSessionContext);
  });

  it("represents missions as not-configured without treating an empty list as configured", async () => {
    const repository = createRepository([grimoire]);

    const result = await getSanctuary(repository, sessionContext);

    expect(result.missions).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.missions).not.toEqual([]);
  });

  it("represents schedule as not-configured without treating an empty list as configured", async () => {
    const repository = createRepository([grimoire]);

    const result = await getSanctuary(repository, sessionContext);

    expect(result.schedule).toEqual({
      status: "not-configured",
      data: null,
    });
    expect(result.schedule).not.toEqual([]);
  });
});