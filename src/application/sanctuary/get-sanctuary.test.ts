import { describe, expect, it, vi } from "vitest";

import type {
  SanctuaryGrimoire,
  SanctuaryUser,
} from "@/domains/sanctuary";

import { getSanctuary } from "./get-sanctuary";

type SanctuaryRepository = {
  getLearningHierarchy: () => Promise<SanctuaryGrimoire[]>;
};

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
      grimoireId: "grimoire-1",
      grimoireTitle: "Anatomia",
      notebookId: "notebook-1",
      notebookTitle: "Sistema musculoesquelético",
      chapterId: "chapter-1",
      chapterTitle: "Introdução",
      pageId: "page-1",
      pageTitle: "Página inicial",
      href: expect.any(String),
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
    expect(result.quickActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: expect.any(String),
        }),
      ]),
    );

    expect(result.primaryAction).toEqual(
      expect.objectContaining({
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
    expect(result.continueLearning).toBeNull();
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
    expect(result.quickActions).toEqual(expect.any(Array));
    expect(result.primaryAction).toEqual(
      expect.objectContaining({
        priority: expect.any(String),
        href: expect.any(String),
      }),
    );
  });

  it("degrades safely when the learning source fails", async () => {
    const repository: SanctuaryRepository = {
      getLearningHierarchy: vi
        .fn()
        .mockRejectedValue(new Error("learning source unavailable")),
    };

    const result = await getSanctuary(repository, sessionContext);

    expect(result.header.user).toEqual(user);
    expect(result.continueLearning).toBeNull();
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
    expect(result.quickActions).toEqual(expect.any(Array));
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