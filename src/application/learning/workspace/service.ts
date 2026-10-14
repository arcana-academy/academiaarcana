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
} from "@/domains/learning";

type WorkspaceServiceDependencies = {
  grimoireRepository: GrimoireRepository;
  notebookRepository: NotebookRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
};

type CreateNotebookInput = {
  grimoireId: string;
  title: string;
  description?: string;
};

type CreateChapterInput = {
  notebookId: string;
  title: string;
};

type CreatePageInput = {
  chapterId: string;
  title: string;
  content: PageContent;
};

// Append within the current parent collection instead of repeatedly using 0.
function nextPosition(siblings: ReadonlyArray<{ position: number }>): number {
  return siblings.reduce((max, sibling) => Math.max(max, sibling.position), -1) + 1;
}

export class WorkspaceService {
  constructor(private readonly repositories: WorkspaceServiceDependencies) {}

  async createNotebook(input: CreateNotebookInput): Promise<Notebook> {
    const grimoire = await this.repositories.grimoireRepository.getById(
      input.grimoireId,
    );

    if (!grimoire) {
      throw new Error("Grimoire not found");
    }

    const siblings = await this.repositories.notebookRepository.listByGrimoire(input.grimoireId);
    const now = new Date().toISOString();

    return this.repositories.notebookRepository.create({
      id: crypto.randomUUID(),
      grimoireId: input.grimoireId,
      title: input.title,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      position: nextPosition(siblings),
      createdAt: now,
      updatedAt: now,
    });
  }

  async createChapter(input: CreateChapterInput): Promise<Chapter> {
    const notebook = await this.repositories.notebookRepository.getById(
      input.notebookId,
    );

    if (!notebook) {
      throw new Error("Notebook not found");
    }

    const siblings = await this.repositories.chapterRepository.listByNotebook(input.notebookId);
    const now = new Date().toISOString();

    return this.repositories.chapterRepository.create({
      id: crypto.randomUUID(),
      notebookId: input.notebookId,
      title: input.title,
      position: nextPosition(siblings),
      createdAt: now,
      updatedAt: now,
    });
  }

  async createPage(input: CreatePageInput): Promise<Page> {
    const chapter = await this.repositories.chapterRepository.getById(
      input.chapterId,
    );

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    const siblings = await this.repositories.pageRepository.listByChapter(input.chapterId);
    const now = new Date().toISOString();

    return this.repositories.pageRepository.create({
      id: crypto.randomUUID(),
      chapterId: input.chapterId,
      title: input.title,
      content: input.content,
      position: nextPosition(siblings),
      createdAt: now,
      updatedAt: now,
    });
  }

  async renameGrimoire(id: string, title: string): Promise<Grimoire> {
    const grimoire = await this.repositories.grimoireRepository.getById(id);

    if (!grimoire) {
      throw new Error("Grimoire not found");
    }

    return this.repositories.grimoireRepository.update(id, { title });
  }

  async renameNotebook(id: string, title: string): Promise<Notebook> {
    const notebook = await this.repositories.notebookRepository.getById(id);

    if (!notebook) {
      throw new Error("Notebook not found");
    }

    return this.repositories.notebookRepository.update(id, { title });
  }

  async renameChapter(id: string, title: string): Promise<Chapter> {
    const chapter = await this.repositories.chapterRepository.getById(id);

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    return this.repositories.chapterRepository.update(id, { title });
  }

  async renamePage(id: string, title: string): Promise<Page> {
    const page = await this.repositories.pageRepository.getById(id);

    if (!page) {
      throw new Error("Page not found");
    }

    return this.repositories.pageRepository.update(id, { title });
  }

  async deleteGrimoire(id: string): Promise<void> {
    const grimoire = await this.repositories.grimoireRepository.getById(id);

    if (!grimoire) {
      throw new Error("Grimoire not found");
    }

    await this.repositories.grimoireRepository.delete(id);
  }

  async deleteNotebook(id: string): Promise<void> {
    const notebook = await this.repositories.notebookRepository.getById(id);

    if (!notebook) {
      throw new Error("Notebook not found");
    }

    await this.repositories.notebookRepository.delete(id);
  }

  async deleteChapter(id: string): Promise<void> {
    const chapter = await this.repositories.chapterRepository.getById(id);

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    await this.repositories.chapterRepository.delete(id);
  }

  async deletePage(id: string): Promise<void> {
    const page = await this.repositories.pageRepository.getById(id);

    if (!page) {
      throw new Error("Page not found");
    }

    await this.repositories.pageRepository.delete(id);
  }

  async reorderNotebook(id: string, position: number): Promise<void> {
    const notebook = await this.repositories.notebookRepository.getById(id);

    if (!notebook) {
      throw new Error("Notebook not found");
    }

    await this.repositories.notebookRepository.reorder(id, position);
  }

  async reorderChapter(id: string, position: number): Promise<void> {
    const chapter = await this.repositories.chapterRepository.getById(id);

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    await this.repositories.chapterRepository.reorder(id, position);
  }

  async reorderPage(id: string, position: number): Promise<void> {
    const page = await this.repositories.pageRepository.getById(id);

    if (!page) {
      throw new Error("Page not found");
    }

    await this.repositories.pageRepository.reorder(id, position);
  }
}
