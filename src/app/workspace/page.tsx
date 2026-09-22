import type {
  Chapter,
  Grimoire,
  Notebook,
  Page,
  WorkspaceState,
} from "@/domains/learning";
import { createChapterRepository } from "@/infrastructure/supabase/workspace/chapter-repository";
import { createGrimoireRepository } from "@/infrastructure/supabase/workspace/grimoire-repository";
import { createNotebookRepository } from "@/infrastructure/supabase/workspace/notebook-repository";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import {
  createWorkspaceChapter,
  createWorkspaceGrimoire,
  createWorkspaceNotebook,
  renameWorkspaceChapter,
  renameWorkspaceGrimoire,
  renameWorkspaceNotebook,
  createWorkspacePage,
  deleteWorkspacePage,
  moveWorkspacePage,
  updateWorkspacePage,
} from "./actions";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

type WorkspacePageProps = {
  searchParams: Promise<{
    grimoire?: string;
    notebook?: string;
    chapter?: string;
    page?: string;
  }>;
};

type WorkspaceTreeItem = Grimoire & {
  notebooks: Array<
    Notebook & {
      chapters: Array<
        Chapter & {
          pages: Page[];
        }
      >;
    }
  >;
};

type WorkspaceTree = WorkspaceTreeItem[];

/** Load the pages belonging to one chapter for the Workspace tree. */
async function loadChapterTree(
  pageRepository: ReturnType<typeof createPageRepository>,
  chapter: Chapter,
): Promise<Chapter & { pages: Page[] }> {
  const pages = await pageRepository.listByChapter(chapter.id);
  return { ...chapter, pages };
}

/** Load one notebook with its chapters and pages. */
async function loadNotebookTree(
  chapterRepository: ReturnType<typeof createChapterRepository>,
  pageRepository: ReturnType<typeof createPageRepository>,
  notebook: Notebook,
): Promise<Notebook & { chapters: Array<Chapter & { pages: Page[] }> }> {
  const chapters = await chapterRepository.listByNotebook(notebook.id);
  const chapterTree = await Promise.all(
    chapters.map((chapter) => loadChapterTree(pageRepository, chapter)),
  );

  return { ...notebook, chapters: chapterTree };
}

/** Load the authenticated user's complete Workspace hierarchy. */
async function loadWorkspaceTree(
  grimoireRepository: ReturnType<typeof createGrimoireRepository>,
  notebookRepository: ReturnType<typeof createNotebookRepository>,
  chapterRepository: ReturnType<typeof createChapterRepository>,
  pageRepository: ReturnType<typeof createPageRepository>,
  ownerId: string,
): Promise<WorkspaceTree> {
  const grimoires = await grimoireRepository.listByOwner(ownerId);

  return Promise.all(
    grimoires.map(async (grimoire) => {
      const notebooks = await notebookRepository.listByGrimoire(grimoire.id);
      const notebookTree = await Promise.all(
        notebooks.map((notebook) =>
          loadNotebookTree(chapterRepository, pageRepository, notebook),
        ),
      );

      return { ...grimoire, notebooks: notebookTree };
    }),
  );
}

/** Render the authenticated Workspace route with its persisted hierarchy. */
export default async function WorkspacePage({
  searchParams,
}: WorkspacePageProps) {
  const claims = await requireAuthenticatedUser();
  const params = await searchParams;
  const supabase = await createClient();

  const repositoryClient = supabase as unknown as Parameters<
    typeof createGrimoireRepository
  >[0];

  const grimoireRepository = createGrimoireRepository(repositoryClient);
  const notebookRepository = createNotebookRepository(repositoryClient);
  const chapterRepository = createChapterRepository(repositoryClient);
  const pageRepository = createPageRepository(repositoryClient);

  const tree = await loadWorkspaceTree(
    grimoireRepository,
    notebookRepository,
    chapterRepository,
    pageRepository,
    claims.sub,
  );

  const initialState: WorkspaceState = {
    grimoireId: params.grimoire ?? null,
    notebookId: params.notebook ?? null,
    chapterId: params.chapter ?? null,
    pageId: params.page ?? null,
  };

  return (
    <>

      <WorkspaceShell
        tree={{ grimoires: tree }}
        initialState={initialState}
        onCreateGrimoire={createWorkspaceGrimoire}
        onCreateNotebook={createWorkspaceNotebook}
        onRenameGrimoire={renameWorkspaceGrimoire}
        onRenameNotebook={renameWorkspaceNotebook}
        onRenameChapter={renameWorkspaceChapter}
        onCreateChapter={createWorkspaceChapter}
        onCreatePage={createWorkspacePage}
        onMovePage={moveWorkspacePage}
        onDeletePage={deleteWorkspacePage}
        onSavePage={updateWorkspacePage}
      />
    </>
  );
}
