import type {
  Chapter,
  Grimoire,
  Notebook,
  Page,
  PageProgressStatus,
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
  setWorkspacePageProgress,
} from "./actions";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { resolveWorkspaceState } from "@/application/learning/workspace/state";
import { SupabasePageProgressRepository } from "@/infrastructure/supabase/learning/page-progress-repository";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/workspace");

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

  let tree: WorkspaceTree;
  let initialPageProgress: Record<string, PageProgressStatus>;

  try {
    tree = await loadWorkspaceTree(
      grimoireRepository,
      notebookRepository,
      chapterRepository,
      pageRepository,
      claims.sub,
    );

    const allPageIds = tree.flatMap((grimoire) =>
      grimoire.notebooks.flatMap((notebook) =>
        notebook.chapters.flatMap((chapter) => chapter.pages.map((page) => page.id)),
      ),
    );
    const pageProgressRepository = new SupabasePageProgressRepository(supabase);
    const pageProgressRows = await pageProgressRepository.listByPages(claims.sub, allPageIds);
    initialPageProgress = Object.fromEntries(
      pageProgressRows.map((item) => [item.pageId, item.status]),
    );
  } catch {
    return (
      <AuthenticatedShell currentPath="/workspace">
        <main className="aa-page aa-workspace-page" aria-labelledby="workspace-title">
          <header className="aa-card aa-card-elevated">
            <h1 id="workspace-title">Workspace</h1>
            <p className="aa-state-copy">
              Organize seus Grimórios, Cadernos, Capítulos e Páginas no seu ritmo.
            </p>
          </header>
          <section
            className="aa-card aa-card-default"
            role="alert"
            aria-labelledby="workspace-load-error-title"
          >
            <h2 id="workspace-load-error-title">
              Não foi possível carregar seu Workspace
            </h2>
            <p className="aa-state-copy">
              Não foi possível consultar seus materiais agora. Essa falha não significa
              que seus conteúdos foram removidos.
            </p>
            <form action="/workspace" method="get">
              <input type="hidden" name="view" value="tree" />
              {params.grimoire ? (
                <input type="hidden" name="grimoire" value={params.grimoire} />
              ) : null}
              {params.notebook ? (
                <input type="hidden" name="notebook" value={params.notebook} />
              ) : null}
              {params.chapter ? (
                <input type="hidden" name="chapter" value={params.chapter} />
              ) : null}
              {params.page ? (
                <input type="hidden" name="page" value={params.page} />
              ) : null}
              <button className="aa-button aa-button-secondary" type="submit">
                Tentar novamente
              </button>
            </form>
            <a className="aa-button aa-button-secondary" href="/academia">
              Voltar à Academia
            </a>
          </section>
        </main>
      </AuthenticatedShell>
    );
  }

  const initialState: WorkspaceState = resolveWorkspaceState(
    { grimoires: tree },
    {
      grimoireId: params.grimoire ?? null,
      notebookId: params.notebook ?? null,
      chapterId: params.chapter ?? null,
      pageId: params.page ?? null,
    },
  );

  return (
    <AuthenticatedShell currentPath="/workspace">
      <main className="aa-page aa-workspace-page" aria-label="Workspace">
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
        initialPageProgress={initialPageProgress}
          onSetPageProgress={setWorkspacePageProgress}
        />
      </main>
    </AuthenticatedShell>
  );
}
