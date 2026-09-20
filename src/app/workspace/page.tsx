import type { Grimoire, Notebook, Chapter, Page, WorkspaceState } from "@/domains/learning";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { createGrimoireRepository } from "@/infrastructure/supabase/workspace/grimoire-repository";
import { createNotebookRepository } from "@/infrastructure/supabase/workspace/notebook-repository";
import { createChapterRepository } from "@/infrastructure/supabase/workspace/chapter-repository";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";

type WorkspacePageProps = {
  searchParams: Promise<{
    grimoire?: string;
    notebook?: string;
    chapter?: string;
    page?: string;
  }>;
};

type WorkspaceTree = Array<
  Grimoire & {
    notebooks?: Array<
      Notebook & {
        chapters?: Array<
          Chapter & {
            pages?: Page[];
          }
        >;
      }
    >;
  }
>;

export default async function WorkspacePage({
  searchParams,
}: WorkspacePageProps) {
  const claims = await requireAuthenticatedUser();
  const params = await searchParams;
  const supabase = await createClient();

  const grimoireRepository = createGrimoireRepository(supabase);
  const notebookRepository = createNotebookRepository(supabase);
  const chapterRepository = createChapterRepository(supabase);
  const pageRepository = createPageRepository(supabase);

  const grimoires = await grimoireRepository.listByOwner(claims.sub);

  const tree: WorkspaceTree = [];
  for (const grimoire of grimoires) {
    const notebooks = await notebookRepository.listByGrimoire(grimoire.id);
    const notebookTree = [];

    for (const notebook of notebooks) {
      const chapters = await chapterRepository.listByNotebook(notebook.id);
      const chapterTree = [];

      for (const chapter of chapters) {
        const pages = await pageRepository.listByChapter(chapter.id);
        chapterTree.push({ ...chapter, pages });
      }

      notebookTree.push({ ...notebook, chapters: chapterTree });
    }

    tree.push({ ...grimoire, notebooks: notebookTree });
  }

  const initialState: WorkspaceState = {
    grimoireId: params.grimoire ?? null,
    notebookId: params.notebook ?? null,
    chapterId: params.chapter ?? null,
    pageId: params.page ?? null,
  };

  return <WorkspaceShell tree={{ grimoires: tree }} initialState={initialState} />;
}
