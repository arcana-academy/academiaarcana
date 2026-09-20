"use server";

import type { Page, PageContent } from "@/domains/learning";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type UpdatePageInput = {
  id: string;
  title: string;
  content: PageContent;
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
