import type { Grimoire, Notebook, Chapter, Page } from "@/domains/learning";

export type SanctuaryPage = Pick<Page, "id" | "chapterId" | "title" | "position">;

export type SanctuaryChapter = Pick<Chapter, "id" | "notebookId" | "title" | "position"> & {
  pages: SanctuaryPage[];
};

export type SanctuaryNotebook = Pick<Notebook, "id" | "grimoireId" | "title" | "position"> & {
  chapters: SanctuaryChapter[];
};

export type SanctuaryGrimoire = Pick<Grimoire, "id" | "ownerId" | "title" | "icon" | "cover"> & {
  notebooks: SanctuaryNotebook[];
};

export interface SanctuaryRepository {
  getLearningHierarchy(): Promise<SanctuaryGrimoire[]>;
}