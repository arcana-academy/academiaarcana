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
describe("workspace application service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      grimoireId: grimoire.id,
      title: "Sistema muscular",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(grimoireRepository.getById).mockResolvedValue(grimoire);
    vi.mocked(notebookRepository.create).mockResolvedValue(notebook);

    await expect(
      service.createNotebook({
        grimoireId: grimoire.id,
        title: notebook.title,
      }),
    ).resolves.toEqual(notebook);

    expect(notebookRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        grimoireId: grimoire.id,
        title: notebook.title,
      }),
    );
  });

  it("rejects notebook creation when the grimoire does not exist", async () => {
    vi.mocked(grimoireRepository.getById).mockResolvedValue(null);

    await expect(
      service.createNotebook({
        grimoireId: "missing-grimoire",
        title: "Sistema muscular",
      }),
    ).rejects.toThrow();

    expect(notebookRepository.create).not.toHaveBeenCalled();
  });

  it("creates a chapter only when its notebook exists", async () => {
    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Sistema muscular",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: notebook.id,
      title: "Membro superior",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(notebookRepository.getById).mockResolvedValue(notebook);
    vi.mocked(chapterRepository.create).mockResolvedValue(chapter);

    await expect(
      service.createChapter({
        notebookId: notebook.id,
        title: chapter.title,
      }),
    ).resolves.toEqual(chapter);

    expect(chapterRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        notebookId: notebook.id,
        title: chapter.title,
      }),
    );
  });

  it("creates a page only when its chapter exists", async () => {
    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: "notebook-1",
      title: "Membro superior",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const page: Page = {
      id: "page-1",
      chapterId: chapter.id,
      title: "Bíceps braquial",
      content: {
        type: "document",
        blocks: [],
      },
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    vi.mocked(chapterRepository.getById).mockResolvedValue(chapter);
    vi.mocked(pageRepository.create).mockResolvedValue(page);

    await expect(
      service.createPage({
        chapterId: chapter.id,
        title: page.title,
        content: page.content,
      }),
    ).resolves.toEqual(page);

    expect(pageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterId: chapter.id,
        title: page.title,
        content: page.content,
      }),
    );
  });
});
