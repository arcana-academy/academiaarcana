import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Chapter,
  ChapterRepository,
  Grimoire,
  GrimoireRepository,
  Notebook,
  NotebookRepository,
  Page,
  PageRepository,
} from "@/domains/learning/workspace";

import { WorkspaceService } from "./service";

const grimoireRepository: GrimoireRepository = {
  create: vi.fn(),
  getById: vi.fn(),
  listByOwner: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const notebookRepository: NotebookRepository = {
  create: vi.fn(),
  listByGrimoire: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  reorder: vi.fn(),
};

const chapterRepository: ChapterRepository = {
  create: vi.fn(),
  listByNotebook: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  reorder: vi.fn(),
};

const pageRepository: PageRepository = {
  create: vi.fn(),
  listByChapter: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  reorder: vi.fn(),
};

const service = new WorkspaceService({
  grimoireRepository,
  notebookRepository,
  chapterRepository,
  pageRepository,
});

describe("workspace application service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a notebook only when its grimoire exists", async () => {
    const grimoire: Grimoire = {
      id: "grimoire-1",
      ownerId: "user-1",
      title: "Anatomia",
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Sistema ósseo",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(grimoireRepository.getById).mockResolvedValue(grimoire);
    vi.mocked(notebookRepository.create).mockResolvedValue(notebook);

    const result = await service.createNotebook({
      grimoireId: "grimoire-1",
      title: "Sistema ósseo",
    });

    expect(grimoireRepository.getById).toHaveBeenCalledWith("grimoire-1");
    expect(notebookRepository.create).toHaveBeenCalledTimes(1);
    expect(notebookRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        grimoireId: "grimoire-1",
        title: "Sistema ósseo",
        position: 0,
      }),
    );
    expect(result).toEqual(notebook);
  });

  it("rejects notebook creation when the grimoire does not exist", async () => {
    vi.mocked(grimoireRepository.getById).mockResolvedValue(null);

    await expect(
      service.createNotebook({
        grimoireId: "missing-grimoire",
        title: "Sistema ósseo",
      }),
    ).rejects.toThrow("Grimoire not found");

    expect(notebookRepository.create).not.toHaveBeenCalled();
  });

  it("creates a chapter only when its notebook exists", async () => {
    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Sistema ósseo",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: "notebook-1",
      title: "Ossos do crânio",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(notebookRepository.getById).mockResolvedValue(notebook);
    vi.mocked(chapterRepository.create).mockResolvedValue(chapter);

    const result = await service.createChapter({
      notebookId: "notebook-1",
      title: "Ossos do crânio",
    });

    expect(notebookRepository.getById).toHaveBeenCalledWith("notebook-1");
    expect(chapterRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        notebookId: "notebook-1",
        title: "Ossos do crânio",
        position: 0,
      }),
    );
    expect(result).toEqual(chapter);
  });

  it("creates a page only when its chapter exists", async () => {
    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: "notebook-1",
      title: "Ossos do crânio",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const page = {
      id: "page-1",
      chapterId: "chapter-1",
      title: "Frontal",
      content: {
        type: "document" as const,
        blocks: [],
      },
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(chapterRepository.getById).mockResolvedValue(chapter);
    vi.mocked(pageRepository.create).mockResolvedValue(page);

    const result = await service.createPage({
      chapterId: "chapter-1",
      title: "Frontal",
      content: {
        type: "document",
        blocks: [],
      },
    });

    expect(chapterRepository.getById).toHaveBeenCalledWith("chapter-1");
    expect(pageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterId: "chapter-1",
        title: "Frontal",
        content: {
          type: "document",
          blocks: [],
        },
        position: 0,
      }),
    );
    expect(result).toEqual(page);
  });

  it("renames an existing grimoire", async () => {
    const grimoire: Grimoire = {
      id: "grimoire-1",
      ownerId: "user-1",
      title: "Anatomia",
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(grimoireRepository.getById).mockResolvedValue(grimoire);
    vi.mocked(grimoireRepository.update).mockResolvedValue({
      ...grimoire,
      title: "Anatomia Humana",
    });

    await service.renameGrimoire("grimoire-1", "Anatomia Humana");

    expect(grimoireRepository.getById).toHaveBeenCalledWith("grimoire-1");
    expect(grimoireRepository.update).toHaveBeenCalledWith("grimoire-1", {
      title: "Anatomia Humana",
    });
  });

  it("rejects renaming a missing grimoire", async () => {
    vi.mocked(grimoireRepository.getById).mockResolvedValue(null);

    await expect(
      service.renameGrimoire("missing-grimoire", "Novo nome"),
    ).rejects.toThrow("Grimoire not found");

    expect(grimoireRepository.update).not.toHaveBeenCalled();
  });

  it("renames an existing notebook", async () => {
    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Anatomia",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(notebookRepository.getById).mockResolvedValue(notebook);
    vi.mocked(notebookRepository.update).mockResolvedValue({
      ...notebook,
      title: "Anatomia Geral",
    });

    await service.renameNotebook("notebook-1", "Anatomia Geral");

    expect(notebookRepository.getById).toHaveBeenCalledWith("notebook-1");
    expect(notebookRepository.update).toHaveBeenCalledWith("notebook-1", {
      title: "Anatomia Geral",
    });
  });

  it("rejects renaming a missing notebook", async () => {
    vi.mocked(notebookRepository.getById).mockResolvedValue(null);

    await expect(
      service.renameNotebook("missing-notebook", "Novo nome"),
    ).rejects.toThrow("Notebook not found");

    expect(notebookRepository.update).not.toHaveBeenCalled();
  });

  it("renames an existing chapter", async () => {
    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: "notebook-1",
      title: "Capítulo 1",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(chapterRepository.getById).mockResolvedValue(chapter);
    vi.mocked(chapterRepository.update).mockResolvedValue({
      ...chapter,
      title: "Sistema ósseo",
    });

    await service.renameChapter("chapter-1", "Sistema ósseo");

    expect(chapterRepository.getById).toHaveBeenCalledWith("chapter-1");
    expect(chapterRepository.update).toHaveBeenCalledWith("chapter-1", {
      title: "Sistema ósseo",
    });
  });

  it("rejects renaming a missing chapter", async () => {
    vi.mocked(chapterRepository.getById).mockResolvedValue(null);

    await expect(
      service.renameChapter("missing-chapter", "Novo nome"),
    ).rejects.toThrow("Chapter not found");

    expect(chapterRepository.update).not.toHaveBeenCalled();
  });

  it("renames an existing page", async () => {
    const page = {
      id: "page-1",
      chapterId: "chapter-1",
      title: "Página 1",
      content: {
        type: "document" as const,
        blocks: [],
      },
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(pageRepository.getById).mockResolvedValue(page);
    vi.mocked(pageRepository.update).mockResolvedValue({
      ...page,
      title: "Introdução",
    });

    await service.renamePage("page-1", "Introdução");

    expect(pageRepository.getById).toHaveBeenCalledWith("page-1");
    expect(pageRepository.update).toHaveBeenCalledWith("page-1", {
      title: "Introdução",
    });
  });

  it("rejects renaming a missing page", async () => {
    vi.mocked(pageRepository.getById).mockResolvedValue(null);

    await expect(
      service.renamePage("missing-page", "Novo nome"),
    ).rejects.toThrow("Page not found");

    expect(pageRepository.update).not.toHaveBeenCalled();
  });

  it("deletes an existing grimoire", async () => {
    const grimoire: Grimoire = {
      id: "grimoire-1",
      ownerId: "user-1",
      title: "Anatomia",
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(grimoireRepository.getById).mockResolvedValue(grimoire);

    await service.deleteGrimoire("grimoire-1");

    expect(grimoireRepository.getById).toHaveBeenCalledWith("grimoire-1");
    expect(grimoireRepository.delete).toHaveBeenCalledWith("grimoire-1");
  });

  it("rejects deleting a missing grimoire", async () => {
    vi.mocked(grimoireRepository.getById).mockResolvedValue(null);

    await expect(service.deleteGrimoire("missing-grimoire")).rejects.toThrow(
      "Grimoire not found",
    );

    expect(grimoireRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes an existing notebook", async () => {
    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Anatomia",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(notebookRepository.getById).mockResolvedValue(notebook);

    await service.deleteNotebook("notebook-1");

    expect(notebookRepository.getById).toHaveBeenCalledWith("notebook-1");
    expect(notebookRepository.delete).toHaveBeenCalledWith("notebook-1");
  });

  it("rejects deleting a missing notebook", async () => {
    vi.mocked(notebookRepository.getById).mockResolvedValue(null);

    await expect(service.deleteNotebook("missing-notebook")).rejects.toThrow(
      "Notebook not found",
    );

    expect(notebookRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes an existing chapter", async () => {
    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: "notebook-1",
      title: "Capítulo 1",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(chapterRepository.getById).mockResolvedValue(chapter);

    await service.deleteChapter("chapter-1");

    expect(chapterRepository.getById).toHaveBeenCalledWith("chapter-1");
    expect(chapterRepository.delete).toHaveBeenCalledWith("chapter-1");
  });

  it("rejects deleting a missing chapter", async () => {
    vi.mocked(chapterRepository.getById).mockResolvedValue(null);

    await expect(service.deleteChapter("missing-chapter")).rejects.toThrow(
      "Chapter not found",
    );

    expect(chapterRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes an existing page", async () => {
    const page = {
      id: "page-1",
      chapterId: "chapter-1",
      title: "Página 1",
      content: {
        type: "document" as const,
        blocks: [],
      },
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(pageRepository.getById).mockResolvedValue(page);

    await service.deletePage("page-1");

    expect(pageRepository.getById).toHaveBeenCalledWith("page-1");
    expect(pageRepository.delete).toHaveBeenCalledWith("page-1");
  });

  it("rejects deleting a missing page", async () => {
    vi.mocked(pageRepository.getById).mockResolvedValue(null);

    await expect(service.deletePage("missing-page")).rejects.toThrow(
      "Page not found",
    );

    expect(pageRepository.delete).not.toHaveBeenCalled();
  });

  it("propagates repository errors when deleting a grimoire", async () => {
    const grimoire: Grimoire = {
      id: "grimoire-1",
      ownerId: "user-1",
      title: "Anatomia",
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const persistenceError = new Error("Failed to delete grimoire");

    vi.mocked(grimoireRepository.getById).mockResolvedValue(grimoire);
    vi.mocked(grimoireRepository.delete).mockRejectedValue(persistenceError);

    await expect(service.deleteGrimoire("grimoire-1")).rejects.toBe(
      persistenceError,
    );
  });

  it("reorders an existing notebook", async () => {
    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Anatomia",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(notebookRepository.getById).mockResolvedValue(notebook);

    await service.reorderNotebook("notebook-1", 3);

    expect(notebookRepository.getById).toHaveBeenCalledWith("notebook-1");
    expect(notebookRepository.reorder).toHaveBeenCalledWith("notebook-1", 3);
  });

  it("rejects reordering a missing notebook", async () => {
    vi.mocked(notebookRepository.getById).mockResolvedValue(null);

    await expect(
      service.reorderNotebook("missing-notebook", 3),
    ).rejects.toThrow("Notebook not found");

    expect(notebookRepository.reorder).not.toHaveBeenCalled();
  });

  it("reorders an existing chapter", async () => {
    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: "notebook-1",
      title: "Capítulo 1",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(chapterRepository.getById).mockResolvedValue(chapter);

    await service.reorderChapter("chapter-1", 2);

    expect(chapterRepository.getById).toHaveBeenCalledWith("chapter-1");
    expect(chapterRepository.reorder).toHaveBeenCalledWith("chapter-1", 2);
  });

  it("rejects reordering a missing chapter", async () => {
    vi.mocked(chapterRepository.getById).mockResolvedValue(null);

    await expect(service.reorderChapter("missing-chapter", 2)).rejects.toThrow(
      "Chapter not found",
    );

    expect(chapterRepository.reorder).not.toHaveBeenCalled();
  });

  it("reorders an existing page", async () => {
    const page = {
      id: "page-1",
      chapterId: "chapter-1",
      title: "Página 1",
      content: {
        type: "document" as const,
        blocks: [],
      },
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(pageRepository.getById).mockResolvedValue(page);

    await service.reorderPage("page-1", 4);

    expect(pageRepository.getById).toHaveBeenCalledWith("page-1");
    expect(pageRepository.reorder).toHaveBeenCalledWith("page-1", 4);
  });

  it("rejects reordering a missing page", async () => {
    vi.mocked(pageRepository.getById).mockResolvedValue(null);

    await expect(service.reorderPage("missing-page", 4)).rejects.toThrow(
      "Page not found",
    );

    expect(pageRepository.reorder).not.toHaveBeenCalled();
  });

  it("propagates repository errors when reordering a notebook", async () => {
    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Anatomia",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const persistenceError = new Error("Failed to reorder notebook");

    vi.mocked(notebookRepository.getById).mockResolvedValue(notebook);
    vi.mocked(notebookRepository.reorder).mockRejectedValue(persistenceError);

    await expect(service.reorderNotebook("notebook-1", 3)).rejects.toBe(
      persistenceError,
    );
  });
});
