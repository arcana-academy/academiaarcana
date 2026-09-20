"use server";

import type { Chapter, Notebook, Page, PageContent } from "@/domains/learning";
import { createChapterRepository } from "@/infrastructure/supabase/workspace/chapter-repository";
import { createNotebookRepository } from "@/infrastructure/supabase/workspace/notebook-repository";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type UpdatePageInput = {
  id: string;
  title: string;
  content: PageContent;
};

type CreateNotebookInput = {
  grimoireId: string;
  title: string;
};

type CreateChapterInput = {
  notebookId: string;
  title: string;
};

type CreatePageInput = {
  chapterId: string;
  title: string;
};

type RepositoryClient = Parameters<typeof createPageRepository>[0];

/** Persist an authenticated Workspace page update through the learning repository. */
export async function updateWorkspacePage(input: UpdatePageInput): Promise<Page> {
  await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createPageRepository(
    supabase as unknown as RepositoryClient,
  );

  const title = input.title.trim();
  if (!title) {
    throw new Error("O título da página é obrigatório.");
  }

  return repository.update(input.id, {
    title,
    content: input.content,
    updatedAt: new Date().toISOString(),
  });
}

/** Create an authenticated Workspace page at the end of its chapter. */
export async function createWorkspacePage(
  input: CreatePageInput,
): Promise<Page> {
  await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createPageRepository(
    supabase as unknown as RepositoryClient,
  );

  const title = input.title.trim();
  if (!title) {
    throw new Error("O título da página é obrigatório.");
  }

  const existingPages = await repository.listByChapter(input.chapterId);
  const position =
    existingPages.length === 0
      ? 0
      : Math.max(...existingPages.map((page) => page.position)) + 1;
  const now = new Date().toISOString();

  return repository.create({
    id: globalThis.crypto.randomUUID(),
    chapterId: input.chapterId,
    title,
    content: {
      type: "document",
      blocks: [],
    },
    position,
    createdAt: now,
    updatedAt: now,
  });
}

/** Delete an authenticated Workspace page through the learning repository. */
export async function deleteWorkspacePage(id: string): Promise<void> {
  await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createPageRepository(
    supabase as unknown as RepositoryClient,
  );

  await repository.delete(id);
}

/** Create an authenticated Workspace chapter at the end of its notebook. */
export async function createWorkspaceChapter(
  input: CreateChapterInput,
): Promise<Chapter> {
  await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createChapterRepository(
    supabase as unknown as Parameters<typeof createChapterRepository>[0],
  );

  const title = input.title.trim();
  if (!title) {
    throw new Error("O título do capítulo é obrigatório.");
  }

  const existingChapters = await repository.listByNotebook(input.notebookId);
  const position =
    existingChapters.length === 0
      ? 0
      : Math.max(...existingChapters.map((chapter) => chapter.position)) + 1;
  const now = new Date().toISOString();

  return repository.create({
    id: globalThis.crypto.randomUUID(),
    notebookId: input.notebookId,
    title,
    position,
    createdAt: now,
    updatedAt: now,
  });
}


/** Create an authenticated Workspace notebook at the end of its grimoire. */
export async function createWorkspaceNotebook(
  input: CreateNotebookInput,
): Promise<Notebook> {
  await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createNotebookRepository(
    supabase as unknown as Parameters<typeof createNotebookRepository>[0],
  );

  const title = input.title.trim();
  if (!title) {
    throw new Error("O título do caderno é obrigatório.");
  }

  const existingNotebooks = await repository.listByGrimoire(input.grimoireId);
  const position =
    existingNotebooks.length === 0
      ? 0
      : Math.max(...existingNotebooks.map((notebook) => notebook.position)) + 1;
  const now = new Date().toISOString();

  return repository.create({
    id: globalThis.crypto.randomUUID(),
    grimoireId: input.grimoireId,
    title,
    position,
    createdAt: now,
    updatedAt: now,
  });
}
