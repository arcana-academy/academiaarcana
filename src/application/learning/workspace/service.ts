import type {
  Chapter,
  ChapterRepository,
  GrimoireRepository,
  Notebook,
  NotebookRepository,
  Page,
  PageContent,
  PageRepository,
} from "@/domains/learning/workspace";

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

export class WorkspaceService {
  constructor(private readonly repositories: WorkspaceServiceDependencies) {}

  async createNotebook(input: CreateNotebookInput): Promise<Notebook> {
    const grimoire = await this.repositories.grimoireRepository.getById(
      input.grimoireId,
    );

    if (!grimoire) {
      throw new Error("Grimoire not found");
    }

    return this.repositories.notebookRepository.create({
      id: crypto.randomUUID(),
      grimoireId: input.grimoireId,
      title: input.title,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async createChapter(input: CreateChapterInput): Promise<Chapter> {
    const notebook = await this.repositories.notebookRepository.getById(
      input.notebookId,
    );

    if (!notebook) {
      throw new Error("Notebook not found");
    }

    return this.repositories.chapterRepository.create({
      id: crypto.randomUUID(),
      notebookId: input.notebookId,
      title: input.title,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async createPage(input: CreatePageInput): Promise<Page> {
    const chapter = await this.repositories.chapterRepository.getById(
      input.chapterId,
    );

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    return this.repositories.pageRepository.create({
      id: crypto.randomUUID(),
      chapterId: input.chapterId,
      title: input.title,
      content: input.content,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
