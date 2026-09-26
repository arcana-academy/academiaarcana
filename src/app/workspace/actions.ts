"use server";

import type { Chapter, Grimoire, Notebook, Page, PageContent, PageProgressStatus } from "@/domains/learning";
import { SupabasePageProgressRepository } from "@/infrastructure/supabase/learning/page-progress-repository";
import { createChapterRepository } from "@/infrastructure/supabase/workspace/chapter-repository";
import { createGrimoireRepository } from "@/infrastructure/supabase/workspace/grimoire-repository";
import { createNotebookRepository } from "@/infrastructure/supabase/workspace/notebook-repository";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type UpdatePageInput = {
  id: string;
  title: string;
  content: PageContent;
};

type CreateGrimoireInput = {
  title: string;
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


type RenameWorkspaceItemInput = {
  id: string;
  title: string;
};

type MoveWorkspacePageInput = {
  id: string;
  direction: "up" | "down";
};

type MoveWorkspacePageResult = {
  movedPage: Page;
  swappedPage: Page | null;
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


/** Create an authenticated Workspace grimoire for the current user. */
export async function createWorkspaceGrimoire(
  input: CreateGrimoireInput,
): Promise<Grimoire> {
  const claims = await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createGrimoireRepository(
    supabase as unknown as Parameters<typeof createGrimoireRepository>[0],
  );

  const title = input.title.trim();
  if (!title) {
    throw new Error("O título do grimório é obrigatório.");
  }

  const now = new Date().toISOString();

  return repository.create({
    id: globalThis.crypto.randomUUID(),
    ownerId: claims.sub,
    title,
    createdAt: now,
    updatedAt: now,
  });
}

/** Persist the authenticated learning progress for one page. */
export async function setWorkspacePageProgress(input: {
  pageId: string;
  status: PageProgressStatus;
}): Promise<void> {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabasePageProgressRepository(supabase);

  await repository.setStatus(
    claims.sub,
    input.pageId,
    input.status,
    input.status === "completed" ? new Date().toISOString() : null,
  );
}

/** Move an authenticated Workspace page one position within its chapter. */
export async function moveWorkspacePage(
  input: MoveWorkspacePageInput,
): Promise<MoveWorkspacePageResult> {
  await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createPageRepository(
    supabase as unknown as RepositoryClient,
  );

  const page = await repository.getById(input.id);
  if (!page) {
    throw new Error("Página não encontrada.");
  }

  const pages = (await repository.listByChapter(page.chapterId)).sort(
    (left, right) => left.position - right.position,
  );
  const index = pages.findIndex((item) => item.id === page.id);

  if (index < 0) {
    throw new Error("Página não encontrada.");
  }

  const targetIndex = input.direction === "up" ? index - 1 : index + 1;
  const target = pages[targetIndex];

  if (!target) {
    return {
      movedPage: page,
      swappedPage: null,
    };
  }

  await repository.reorder(page.id, target.position);
  await repository.reorder(target.id, page.position);

  return {
    movedPage: {
      ...page,
      position: target.position,
    },
    swappedPage: {
      ...target,
      position: page.position,
    },
  };
}


/** Rename an authenticated Workspace grimoire. */
export async function renameWorkspaceGrimoire(
  input: RenameWorkspaceItemInput,
): Promise<Grimoire> {
  await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = createGrimoireRepository(
    supabase as unknown as Parameters<typeof createGrimoireRepository>[0],
  );

  const title = input.title.trim();
  if (!title) {
    throw new Error("O título do grimório é obrigatório.");
  }

  return repository.update(input.id, {
    title,
    updatedAt: new Date().toISOString(),
  });
}

/** Rename an authenticated Workspace notebook. */
export async function renameWorkspaceNotebook(
  input: RenameWorkspaceItemInput,
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

  return repository.update(input.id, {
    title,
    updatedAt: new Date().toISOString(),
  });
}

/** Rename an authenticated Workspace chapter. */
export async function renameWorkspaceChapter(
  input: RenameWorkspaceItemInput,
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

  return repository.update(input.id, {
    title,
    updatedAt: new Date().toISOString(),
  });
}
