import { describe, expect, it, vi } from "vitest";

import type {
  Chapter,
  Grimoire,
  Notebook,
  Page,
} from "@/domains/learning";

import { createGrimoireRepository } from "./workspace/grimoire-repository";
import { createNotebookRepository } from "./workspace/notebook-repository";
import { createChapterRepository } from "./workspace/chapter-repository";
import { createPageRepository } from "./workspace/page-repository";

type QueryResult<T> = {
  data: T;
  error: { message: string } | null;
};

type QueryBuilder = {
  select: (columns?: string) => QueryBuilder;
  insert: (values: Record<string, unknown>) => QueryBuilder;
  update: (values: Record<string, unknown>) => QueryBuilder;
  delete: () => QueryBuilder;
  eq: (column: string, value: string | number) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  single: () => Promise<QueryResult<Record<string, unknown>>>;
  then: (
    resolve: (
      value: QueryResult<
        Record<string, unknown> | Record<string, unknown>[] | null
      >,
    ) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

type SupabaseClientLike = {
  from: (table: string) => QueryBuilder;
};

const createQueryBuilder = (
  result: QueryResult<
    Record<string, unknown> | Record<string, unknown>[] | null
  >,
): QueryBuilder => {
  const singleResult: QueryResult<Record<string, unknown>> =
    result.data !== null && !Array.isArray(result.data)
      ? {
          data: result.data,
          error: result.error,
        }
      : {
          data: {},
          error: result.error ?? {
            message: "Expected a single row",
          },
        };

  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),

    single: vi.fn(async () => singleResult),

    then: (
      resolve: (
        value: QueryResult<
          Record<string, unknown> | Record<string, unknown>[] | null
        >,
      ) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return builder;
}

const createSupabaseMock = (
  result: QueryResult<
    Record<string, unknown> | Record<string, unknown>[] | null
  >,
) => {
  const query = createQueryBuilder(result);

  const supabase: SupabaseClientLike = {
    from: vi.fn(() => query),
  };

  return {
    supabase,
    query,
  };
};

describe("GrimoireRepository", () => {
  const grimoire: Grimoire = {
    id: "grimoire-1",
    ownerId: "user-1",
    title: "Anatomia",
    description: "Estudos de anatomia",
    icon: "book-open",
    cover: "cover.png",
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
  };

  it("exports createGrimoireRepository", () => {
    expect(createGrimoireRepository).toBeTypeOf("function");
  });

  it("creates a grimoire", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: grimoire.id,
        owner_id: grimoire.ownerId,
        title: grimoire.title,
        description: grimoire.description,
        icon: grimoire.icon,
        cover: grimoire.cover,
        created_at: grimoire.createdAt,
        updated_at: grimoire.updatedAt,
      },
      error: null,
    });

    const repository = createGrimoireRepository(supabase);

    const result = await repository.create(grimoire);

    expect(supabase.from).toHaveBeenCalledWith("grimoires");
    expect(query.insert).toHaveBeenCalledWith({
      id: grimoire.id,
      owner_id: grimoire.ownerId,
      title: grimoire.title,
      description: grimoire.description,
      icon: grimoire.icon,
      cover: grimoire.cover,
      created_at: grimoire.createdAt,
      updated_at: grimoire.updatedAt,
    });
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.single).toHaveBeenCalled();
    expect(result).toEqual(grimoire);
  });

  it("gets a grimoire by id", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: grimoire.id,
        owner_id: grimoire.ownerId,
        title: grimoire.title,
        description: grimoire.description,
        icon: grimoire.icon,
        cover: grimoire.cover,
        created_at: grimoire.createdAt,
        updated_at: grimoire.updatedAt,
      },
      error: null,
    });

    const repository = createGrimoireRepository(supabase);

    const result = await repository.getById(grimoire.id);

    expect(supabase.from).toHaveBeenCalledWith("grimoires");
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.eq).toHaveBeenCalledWith("id", grimoire.id);
    expect(query.single).toHaveBeenCalled();
    expect(result).toEqual(grimoire);
  });

  it("returns null when the grimoire does not exist", async () => {
    const { supabase } = createSupabaseMock({
      data: null,
      error: { message: "No rows found" },
    });

    const repository = createGrimoireRepository(supabase);

    await expect(repository.getById("missing")).resolves.toBeNull();
  });

  it("lists grimoires by owner", async () => {
    const { supabase, query } = createSupabaseMock({
      data: [
        {
          id: grimoire.id,
          owner_id: grimoire.ownerId,
          title: grimoire.title,
          description: grimoire.description,
          icon: grimoire.icon,
          cover: grimoire.cover,
          created_at: grimoire.createdAt,
          updated_at: grimoire.updatedAt,
        },
      ],
      error: null,
    });

    const repository = createGrimoireRepository(supabase);

    const result = await repository.listByOwner(grimoire.ownerId);

    expect(supabase.from).toHaveBeenCalledWith("grimoires");
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.eq).toHaveBeenCalledWith("owner_id", grimoire.ownerId);
    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: true,
    });
    expect(result).toEqual([grimoire]);
  });

  it("updates a grimoire", async () => {
    const updated: Grimoire = {
      ...grimoire,
      title: "Anatomia Humana",
      updatedAt: "2026-09-14T11:00:00.000Z",
    };

    const { supabase, query } = createSupabaseMock({
      data: {
        id: updated.id,
        owner_id: updated.ownerId,
        title: updated.title,
        description: updated.description,
        icon: updated.icon,
        cover: updated.cover,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      },
      error: null,
    });

    const repository = createGrimoireRepository(supabase);

    const result = await repository.update(grimoire.id, {
      title: updated.title,
      updatedAt: updated.updatedAt,
    });

    expect(query.update).toHaveBeenCalledWith({
      title: updated.title,
      updated_at: updated.updatedAt,
    });
    expect(query.eq).toHaveBeenCalledWith("id", grimoire.id);
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.single).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it("deletes a grimoire", async () => {
    const { supabase, query } = createSupabaseMock({
      data: null,
      error: null,
    });

    const repository = createGrimoireRepository(supabase);

    await repository.delete(grimoire.id);

    expect(supabase.from).toHaveBeenCalledWith("grimoires");
    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", grimoire.id);
  });
});

describe("NotebookRepository", () => {
  const notebook: Notebook = {
    id: "notebook-1",
    grimoireId: "grimoire-1",
    title: "Sistema ósseo",
    description: "Conteúdo sobre sistema ósseo",
    position: 0,
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
  };

  it("exports createNotebookRepository", () => {
    expect(createNotebookRepository).toBeTypeOf("function");
  });

  it("creates a notebook", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: notebook.id,
        grimoire_id: notebook.grimoireId,
        title: notebook.title,
        description: notebook.description,
        position: notebook.position,
        created_at: notebook.createdAt,
        updated_at: notebook.updatedAt,
      },
      error: null,
    });

    const repository = createNotebookRepository(supabase);

    const result = await repository.create(notebook);

    expect(supabase.from).toHaveBeenCalledWith("notebooks");
    expect(query.insert).toHaveBeenCalledWith({
      id: notebook.id,
      grimoire_id: notebook.grimoireId,
      title: notebook.title,
      description: notebook.description,
      position: notebook.position,
      created_at: notebook.createdAt,
      updated_at: notebook.updatedAt,
    });
    expect(result).toEqual(notebook);
  });

  it("lists notebooks by grimoire", async () => {
    const { supabase, query } = createSupabaseMock({
      data: [
        {
          id: notebook.id,
          grimoire_id: notebook.grimoireId,
          title: notebook.title,
          description: notebook.description,
          position: notebook.position,
          created_at: notebook.createdAt,
          updated_at: notebook.updatedAt,
        },
      ],
      error: null,
    });

    const repository = createNotebookRepository(supabase);

    const result = await repository.listByGrimoire(notebook.grimoireId);

    expect(supabase.from).toHaveBeenCalledWith("notebooks");
    expect(query.eq).toHaveBeenCalledWith("grimoire_id", notebook.grimoireId);
    expect(query.order).toHaveBeenCalledWith("position", {
      ascending: true,
    });
    expect(result).toEqual([notebook]);
  });

  it("gets a notebook by id", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: notebook.id,
        grimoire_id: notebook.grimoireId,
        title: notebook.title,
        description: notebook.description,
        position: notebook.position,
        created_at: notebook.createdAt,
        updated_at: notebook.updatedAt,
      },
      error: null,
    });

    const repository = createNotebookRepository(supabase);

    const result = await repository.getById(notebook.id);

    expect(query.eq).toHaveBeenCalledWith("id", notebook.id);
    expect(result).toEqual(notebook);
  });

  it("updates a notebook", async () => {
    const updated: Notebook = {
      ...notebook,
      title: "Sistema muscular",
      updatedAt: "2026-09-14T11:00:00.000Z",
    };

    const { supabase, query } = createSupabaseMock({
      data: {
        id: updated.id,
        grimoire_id: updated.grimoireId,
        title: updated.title,
        description: updated.description,
        position: updated.position,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      },
      error: null,
    });

    const repository = createNotebookRepository(supabase);

    const result = await repository.update(notebook.id, {
      title: updated.title,
      updatedAt: updated.updatedAt,
    });

    expect(query.update).toHaveBeenCalledWith({
      title: updated.title,
      updated_at: updated.updatedAt,
    });
    expect(result).toEqual(updated);
  });

  it("deletes a notebook", async () => {
    const { supabase, query } = createSupabaseMock({
      data: null,
      error: null,
    });

    const repository = createNotebookRepository(supabase);

    await repository.delete(notebook.id);

    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", notebook.id);
  });

  it("reorders a notebook", async () => {
    const { supabase, query } = createSupabaseMock({
      data: null,
      error: null,
    });

    const repository = createNotebookRepository(supabase);

    await repository.reorder(notebook.id, 3);

    expect(query.update).toHaveBeenCalledWith({
      position: 3,
    });
    expect(query.eq).toHaveBeenCalledWith("id", notebook.id);
  });

  it("propagates Supabase errors", async () => {
    const { supabase } = createSupabaseMock({
      data: null,
      error: { message: "database error" },
    });

    const repository = createNotebookRepository(supabase);

    await expect(repository.delete(notebook.id)).rejects.toThrow(
      "database error",
    );
  });
});

describe("ChapterRepository", () => {
  const chapter: Chapter = {
    id: "chapter-1",
    notebookId: "notebook-1",
    title: "Introdução",
    position: 0,
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
  };

  it("exports createChapterRepository", () => {
    expect(createChapterRepository).toBeTypeOf("function");
  });

  it("creates a chapter", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: chapter.id,
        notebook_id: chapter.notebookId,
        title: chapter.title,
        position: chapter.position,
        created_at: chapter.createdAt,
        updated_at: chapter.updatedAt,
      },
      error: null,
    });

    const repository = createChapterRepository(supabase);

    const result = await repository.create(chapter);

    expect(supabase.from).toHaveBeenCalledWith("chapters");
    expect(query.insert).toHaveBeenCalledWith({
      id: chapter.id,
      notebook_id: chapter.notebookId,
      title: chapter.title,
      position: chapter.position,
      created_at: chapter.createdAt,
      updated_at: chapter.updatedAt,
    });
    expect(result).toEqual(chapter);
  });

  it("lists chapters by notebook", async () => {
    const { supabase, query } = createSupabaseMock({
      data: [
        {
          id: chapter.id,
          notebook_id: chapter.notebookId,
          title: chapter.title,
          position: chapter.position,
          created_at: chapter.createdAt,
          updated_at: chapter.updatedAt,
        },
      ],
      error: null,
    });

    const repository = createChapterRepository(supabase);

    const result = await repository.listByNotebook(chapter.notebookId);

    expect(supabase.from).toHaveBeenCalledWith("chapters");
    expect(query.eq).toHaveBeenCalledWith("notebook_id", chapter.notebookId);
    expect(query.order).toHaveBeenCalledWith("position", {
      ascending: true,
    });
    expect(result).toEqual([chapter]);
  });

  it("gets a chapter by id", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: chapter.id,
        notebook_id: chapter.notebookId,
        title: chapter.title,
        position: chapter.position,
        created_at: chapter.createdAt,
        updated_at: chapter.updatedAt,
      },
      error: null,
    });

    const repository = createChapterRepository(supabase);

    const result = await repository.getById(chapter.id);

    expect(query.eq).toHaveBeenCalledWith("id", chapter.id);
    expect(result).toEqual(chapter);
  });

  it("updates a chapter", async () => {
    const updated: Chapter = {
      ...chapter,
      title: "Fundamentos",
      updatedAt: "2026-09-14T11:00:00.000Z",
    };

    const { supabase, query } = createSupabaseMock({
      data: {
        id: updated.id,
        notebook_id: updated.notebookId,
        title: updated.title,
        position: updated.position,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      },
      error: null,
    });

    const repository = createChapterRepository(supabase);

    const result = await repository.update(chapter.id, {
      title: updated.title,
      updatedAt: updated.updatedAt,
    });

    expect(query.update).toHaveBeenCalledWith({
      title: updated.title,
      updated_at: updated.updatedAt,
    });
    expect(result).toEqual(updated);
  });

  it("deletes a chapter", async () => {
    const { supabase, query } = createSupabaseMock({
      data: null,
      error: null,
    });

    const repository = createChapterRepository(supabase);

    await repository.delete(chapter.id);

    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", chapter.id);
  });

  it("reorders a chapter", async () => {
    const { supabase, query } = createSupabaseMock({
      data: null,
      error: null,
    });

    const repository = createChapterRepository(supabase);

    await repository.reorder(chapter.id, 2);

    expect(query.update).toHaveBeenCalledWith({
      position: 2,
    });
    expect(query.eq).toHaveBeenCalledWith("id", chapter.id);
  });

  it("propagates Supabase errors", async () => {
    const { supabase } = createSupabaseMock({
      data: null,
      error: { message: "chapter database error" },
    });

    const repository = createChapterRepository(supabase);

    await expect(repository.delete(chapter.id)).rejects.toThrow(
      "chapter database error",
    );
  });
});

describe("PageRepository", () => {
  const page: Page = {
    id: "page-1",
    chapterId: "chapter-1",
    title: "Página inicial",
    content: {
      type: "document",
      blocks: [
        {
          type: "paragraph",
          content: "Conteúdo inicial",
        },
      ],
    },
    position: 0,
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
  };

  it("exports createPageRepository", () => {
    expect(createPageRepository).toBeTypeOf("function");
  });

  it("creates a page", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: page.id,
        chapter_id: page.chapterId,
        title: page.title,
        content: page.content,
        position: page.position,
        created_at: page.createdAt,
        updated_at: page.updatedAt,
      },
      error: null,
    });

    const repository = createPageRepository(supabase);

    const result = await repository.create(page);

    expect(supabase.from).toHaveBeenCalledWith("pages");
    expect(query.insert).toHaveBeenCalledWith({
      id: page.id,
      chapter_id: page.chapterId,
      title: page.title,
      content: page.content,
      position: page.position,
      created_at: page.createdAt,
      updated_at: page.updatedAt,
    });
    expect(result).toEqual(page);
  });

  it("lists pages by chapter", async () => {
    const { supabase, query } = createSupabaseMock({
      data: [
        {
          id: page.id,
          chapter_id: page.chapterId,
          title: page.title,
          content: page.content,
          position: page.position,
          created_at: page.createdAt,
          updated_at: page.updatedAt,
        },
      ],
      error: null,
    });

    const repository = createPageRepository(supabase);

    const result = await repository.listByChapter(page.chapterId);

    expect(supabase.from).toHaveBeenCalledWith("pages");
    expect(query.eq).toHaveBeenCalledWith("chapter_id", page.chapterId);
    expect(query.order).toHaveBeenCalledWith("position", {
      ascending: true,
    });
    expect(result).toEqual([page]);
  });

  it("gets a page by id", async () => {
    const { supabase, query } = createSupabaseMock({
      data: {
        id: page.id,
        chapter_id: page.chapterId,
        title: page.title,
        content: page.content,
        position: page.position,
        created_at: page.createdAt,
        updated_at: page.updatedAt,
      },
      error: null,
    });

    const repository = createPageRepository(supabase);

    const result = await repository.getById(page.id);

    expect(query.eq).toHaveBeenCalledWith("id", page.id);
    expect(result).toEqual(page);
  });

  it("updates a page", async () => {
    const updated: Page = {
      ...page,
      title: "Página atualizada",
      updatedAt: "2026-09-14T11:00:00.000Z",
    };

    const { supabase, query } = createSupabaseMock({
      data: {
        id: updated.id,
        chapter_id: updated.chapterId,
        title: updated.title,
        content: updated.content,
        position: updated.position,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      },
      error: null,
    });

    const repository = createPageRepository(supabase);

    const result = await repository.update(page.id, {
      title: updated.title,
      updatedAt: updated.updatedAt,
    });

    expect(query.update).toHaveBeenCalledWith({
      title: updated.title,
      updated_at: updated.updatedAt,
    });
    expect(result).toEqual(updated);
  });

  it("deletes a page", async () => {
    const { supabase, query } = createSupabaseMock({
      data: null,
      error: null,
    });

    const repository = createPageRepository(supabase);

    await repository.delete(page.id);

    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", page.id);
  });

  it("reorders a page", async () => {
    const { supabase, query } = createSupabaseMock({
      data: null,
      error: null,
    });

    const repository = createPageRepository(supabase);

    await repository.reorder(page.id, 4);

    expect(query.update).toHaveBeenCalledWith({
      position: 4,
    });
    expect(query.eq).toHaveBeenCalledWith("id", page.id);
  });

  it("propagates Supabase errors", async () => {
    const { supabase } = createSupabaseMock({
      data: null,
      error: { message: "page database error" },
    });

    const repository = createPageRepository(supabase);

    await expect(repository.delete(page.id)).rejects.toThrow(
      "page database error",
    );
  });
});
