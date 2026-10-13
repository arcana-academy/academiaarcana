import { describe, expect, it, vi } from "vitest";

import type {
  SanctuaryGrimoire,
  SanctuaryProjectionPort,
} from "@/domains/sanctuary";
import { getSanctuary } from "./get-sanctuary";

const pageHierarchy: SanctuaryGrimoire[] = [
  {
    id: "synthetic-grimoire",
    ownerId: "synthetic-user",
    title: "Grimório sintético",
    icon: "book-open",
    cover: "",
    notebooks: [
      {
        id: "synthetic-notebook",
        grimoireId: "synthetic-grimoire",
        title: "Caderno",
        position: 0,
        chapters: [
          {
            id: "synthetic-chapter",
            notebookId: "synthetic-notebook",
            title: "Capítulo",
            position: 0,
            pages: [
              { id: "page-A", chapterId: "synthetic-chapter", title: "Página", position: 0 },
            ],
          },
        ],
      },
    ],
  },
];

function progressRecord(pageId: string, id: string, status: "completed" | "in-progress" = "completed") {
  return {
    id,
    ownerId: "synthetic-user",
    pageId,
    status,
    completedAt: status === "completed" ? "2026-10-13T10:00:00.000Z" : null,
    updatedAt: "2026-10-13T10:00:00.000Z",
  } as const;
}

async function readProgress(rows: ReturnType<typeof progressRecord>[]) {
  const repository: SanctuaryProjectionPort = {
    getLearningHierarchy: vi.fn(async () => pageHierarchy),
    getPageProgress: vi.fn(async () => rows),
  };
  const result = await getSanctuary(repository, {
    user: { id: "synthetic-user", displayName: "Estudante sintético" },
  });
  expect(repository.getPageProgress).toHaveBeenCalledWith("synthetic-user", ["page-A"]);
  return result;
}

describe("Sanctuary progress: projection scoped to visible pages", () => {
  it("counts duplicate completion rows only once and ignores obsolete pages", async () => {
    const view = await readProgress([
      progressRecord("page-A", "record-1"),
      progressRecord("page-A", "record-2"),
      progressRecord("deleted-page", "stale-record"),
    ]);

    expect(view.progress).toEqual({
      status: "ready",
      data: { percentage: 100, label: "1 de 1 páginas concluídas" },
    });
    expect(view.adaptiveRecommendation).toBeDefined();
  });

  it("does not treat an obsolete page completion as current learning progress", async () => {
    const view = await readProgress([
      progressRecord("deleted-page", "stale-record"),
    ]);

    expect(view.progress).toEqual({
      status: "ready",
      data: { percentage: 0, label: "0 de 1 páginas concluídas" },
    });
  });
});
