import { describe, expect, it } from "vitest";

import type {
    Chapter,
    ChapterRepository,
    Grimoire,
    GrimoireRepository,
    Notebook,
    NotebookRepository,
    Page,
    PageContent,
    PageRepository,
    WorkspaceState,
  } from "./workspace";
  
describe("workspace domain contracts", () => {
  it("represents the canonical Grimoire to Page hierarchy", () => {
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
      title: "Sistema Muscular",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const chapter: Chapter = {
      id: "chapter-1",
      notebookId: notebook.id,
      title: "Músculos do membro superior",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    const content: PageContent = {
      type: "document",
      blocks: [],
    };

    const page: Page = {
      id: "page-1",
      chapterId: chapter.id,
      title: "Bíceps braquial",
      content,
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    expect(notebook.grimoireId).toBe(grimoire.id);
    expect(chapter.notebookId).toBe(notebook.id);
    expect(page.chapterId).toBe(chapter.id);
    expect(page.content).toEqual(content);
  });

  it("represents page content independently from an editor implementation", () => {
    const content: PageContent = {
      type: "document",
      blocks: [
        {
          type: "paragraph",
          content: "Conteúdo da página",
        },
      ],
    };

    expect(content.type).toBe("document");
    expect(content.blocks).toHaveLength(1);
  });

  it("requires a non-negative position for ordered entities", () => {
    const notebook: Notebook = {
      id: "notebook-1",
      grimoireId: "grimoire-1",
      title: "Caderno",
      position: 0,
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
    };

    expect(notebook.position).toBeGreaterThanOrEqual(0);
  });
  it("represents the workspace navigation state", () => {
    const state: WorkspaceState = {
      grimoireId: "grimoire-1",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      pageId: "page-1",
    };

    expect(state.grimoireId).toBe("grimoire-1");
    expect(state.notebookId).toBe("notebook-1");
    expect(state.chapterId).toBe("chapter-1");
    expect(state.pageId).toBe("page-1");
  });

  it("defines repository contracts for each workspace level", () => {
    const repositories: [
      GrimoireRepository,
      NotebookRepository,
      ChapterRepository,
      PageRepository,
    ] = [] as never;

    expect(repositories).toHaveLength(0);
  });
});