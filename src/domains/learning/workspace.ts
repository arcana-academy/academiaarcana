export type PageContentBlock = {
    type: string;
    content: string;
  };
  
  export type PageContent = {
    type: "document";
    blocks: PageContentBlock[];
  };
  
  export type Grimoire = {
    id: string;
    ownerId: string;
    title: string;
    description?: string;
    icon?: string;
    cover?: string;
    createdAt: string;
    updatedAt: string;
  };
  
  export type Notebook = {
    id: string;
    grimoireId: string;
    title: string;
    description?: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  };
  
  export type Chapter = {
    id: string;
    notebookId: string;
    title: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  };
  
  export type Page = {
    id: string;
    chapterId: string;
    title: string;
    content: PageContent;
    position: number;
    createdAt: string;
    updatedAt: string;
  };
  
  export type WorkspaceState = {
    grimoireId: string | null;
    notebookId: string | null;
    chapterId: string | null;
    pageId: string | null;
  };
  
  export interface GrimoireRepository {
    create(grimoire: Grimoire): Promise<Grimoire>;
    getById(id: string): Promise<Grimoire | null>;
    listByOwner(ownerId: string): Promise<Grimoire[]>;
    update(id: string, changes: Partial<Grimoire>): Promise<Grimoire>;
    delete(id: string): Promise<void>;
  }
  
  export interface NotebookRepository {
    create(notebook: Notebook): Promise<Notebook>;
    listByGrimoire(grimoireId: string): Promise<Notebook[]>;
    getById(id: string): Promise<Notebook | null>;
    update(id: string, changes: Partial<Notebook>): Promise<Notebook>;
    delete(id: string): Promise<void>;
    reorder(id: string, position: number): Promise<void>;
  }
  
  export interface ChapterRepository {
    create(chapter: Chapter): Promise<Chapter>;
    listByNotebook(notebookId: string): Promise<Chapter[]>;
    getById(id: string): Promise<Chapter | null>;
    update(id: string, changes: Partial<Chapter>): Promise<Chapter>;
    delete(id: string): Promise<void>;
    reorder(id: string, position: number): Promise<void>;
  }
  
  export interface PageRepository {
    create(page: Page): Promise<Page>;
    listByChapter(chapterId: string): Promise<Page[]>;
    getById(id: string): Promise<Page | null>;
    update(id: string, changes: Partial<Page>): Promise<Page>;
    delete(id: string): Promise<void>;
    reorder(id: string, position: number): Promise<void>;
  }