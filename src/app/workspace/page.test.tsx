import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkspacePage from "./page";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  client: vi.fn(),
  listByOwner: vi.fn(),
  listByGrimoire: vi.fn(),
  listByNotebook: vi.fn(),
  listByChapter: vi.fn(),
  listByPages: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.auth,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.client,
}));

vi.mock("@/infrastructure/supabase/workspace/grimoire-repository", () => ({
  createGrimoireRepository: vi.fn(() => ({ listByOwner: mocks.listByOwner })),
}));
vi.mock("@/infrastructure/supabase/workspace/notebook-repository", () => ({
  createNotebookRepository: vi.fn(() => ({ listByGrimoire: mocks.listByGrimoire })),
}));
vi.mock("@/infrastructure/supabase/workspace/chapter-repository", () => ({
  createChapterRepository: vi.fn(() => ({ listByNotebook: mocks.listByNotebook })),
}));
vi.mock("@/infrastructure/supabase/workspace/page-repository", () => ({
  createPageRepository: vi.fn(() => ({ listByChapter: mocks.listByChapter })),
}));
vi.mock("@/infrastructure/supabase/learning/page-progress-repository", () => ({
  SupabasePageProgressRepository: class MockSupabasePageProgressRepository {
    listByPages = mocks.listByPages;
  },
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/workspace/WorkspaceShell", () => ({
  WorkspaceShell: ({
    tree,
    initialState,
    initialPageProgress,
  }: {
    tree: { grimoires: Array<{ title: string }> };
    initialState: { pageId: string | null };
    initialPageProgress: Record<string, string>;
  }) => (
    <div
      data-testid="workspace-loaded"
      data-selected-page={initialState.pageId ?? ""}
      data-progress={JSON.stringify(initialPageProgress)}
    >
      {tree.grimoires.map((grimoire) => grimoire.title).join(",")}
    </div>
  ),
}));

vi.mock("./actions", () => ({
  createWorkspaceChapter: vi.fn(),
  createWorkspaceGrimoire: vi.fn(),
  createWorkspaceNotebook: vi.fn(),
  renameWorkspaceChapter: vi.fn(),
  renameWorkspaceGrimoire: vi.fn(),
  renameWorkspaceNotebook: vi.fn(),
  createWorkspacePage: vi.fn(),
  deleteWorkspacePage: vi.fn(),
  moveWorkspacePage: vi.fn(),
  updateWorkspacePage: vi.fn(),
  setWorkspacePageProgress: vi.fn(),
}));

const params = {
  grimoire: "grimoire-1",
  notebook: "notebook-1",
  chapter: "chapter-1",
  page: "page-1",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ sub: "user-1" });
  mocks.client.mockResolvedValue({});
  mocks.listByOwner.mockResolvedValue([
    { id: "grimoire-1", ownerId: "user-1", title: "Grimório de Fisiologia" },
  ]);
  mocks.listByGrimoire.mockResolvedValue([
    { id: "notebook-1", grimoireId: "grimoire-1", title: "Caderno 1", position: 0 },
  ]);
  mocks.listByNotebook.mockResolvedValue([
    { id: "chapter-1", notebookId: "notebook-1", title: "Capítulo 1", position: 0 },
  ]);
  mocks.listByChapter.mockResolvedValue([
    { id: "page-1", chapterId: "chapter-1", title: "Página 1", position: 0 },
  ]);
  mocks.listByPages.mockResolvedValue([{ pageId: "page-1", status: "completed" }]);
});

describe("WorkspacePage read recovery", () => {
  it("keeps the authorized hierarchy, selected page and real progress on success", async () => {
    render(await WorkspacePage({ searchParams: Promise.resolve(params) }));

    const loaded = screen.getByTestId("workspace-loaded");
    expect(loaded).toHaveTextContent("Grimório de Fisiologia");
    expect(loaded).toHaveAttribute("data-selected-page", "page-1");
    expect(loaded).toHaveAttribute("data-progress", '{"page-1":"completed"}');
    expect(mocks.listByOwner).toHaveBeenCalledWith("user-1");
    expect(mocks.listByPages).toHaveBeenCalledWith("user-1", ["page-1"]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps a genuine empty Workspace distinct from failed loading", async () => {
    mocks.listByOwner.mockResolvedValue([]);
    mocks.listByPages.mockResolvedValue([]);

    render(await WorkspacePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("workspace-loaded")).toBeInTheDocument();
    expect(mocks.listByPages).toHaveBeenCalledWith("user-1", []);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    "listByOwner",
    "listByGrimoire",
    "listByNotebook",
    "listByChapter",
    "listByPages",
  ] as const)("shows an accessible recoverable error if %s fails", async (read) => {
    mocks[read].mockRejectedValueOnce(new Error("private-db-error-must-not-leak"));

    render(await WorkspacePage({ searchParams: Promise.resolve(params) }));

    expect(screen.getByRole("heading", { name: "Editor de estudos", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar o editor de estudos");
    const retry = screen.getByRole("button", { name: "Tentar novamente" });
    const form = retry.closest("form");
    expect(form).toHaveAttribute("action", "/workspace");
    expect(form).toHaveAttribute("method", "get");
    expect(form?.querySelector('input[name="view"]')).toHaveValue("tree");
    for (const [name, value] of Object.entries(params)) {
      expect(form?.querySelector(`input[name="${name}"]`)).toHaveValue(value);
    }
    expect(screen.getByRole("link", { name: "Voltar à Academia" })).toHaveAttribute("href", "/academia");
    expect(screen.queryByTestId("workspace-loaded")).not.toBeInTheDocument();
    expect(screen.queryByText(/private-db-error-must-not-leak/)).not.toBeInTheDocument();
    expect(screen.queryByText("Nenhum grimório ainda")).not.toBeInTheDocument();
  });

  it("does not catch authentication rejection as a Workspace read error", async () => {
    mocks.auth.mockRejectedValueOnce(new Error("authentication required"));

    await expect(
      WorkspacePage({ searchParams: Promise.resolve(params) }),
    ).rejects.toThrow("authentication required");

    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.listByOwner).not.toHaveBeenCalled();
  });

  it("does not hide Supabase session creation failures", async () => {
    mocks.client.mockRejectedValueOnce(new Error("session initialization failed"));

    await expect(
      WorkspacePage({ searchParams: Promise.resolve(params) }),
    ).rejects.toThrow("session initialization failed");

    expect(mocks.listByOwner).not.toHaveBeenCalled();
  });
});
