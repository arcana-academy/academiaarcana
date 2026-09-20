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

type RepositoryClient = Parameters<typeof createPageRepository>[0];

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
