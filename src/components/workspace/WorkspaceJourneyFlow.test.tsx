// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Chapter, Grimoire, Notebook, Page } from "@/domains/learning";
import { WorkspaceShell } from "./WorkspaceShell";

const now = "2026-10-13T00:00:00.000Z";
const grimoire: Grimoire = {
  id: "g-synthetic",
  ownerId: "learner-synthetic",
  title: "Grimório inicial",
  createdAt: now,
  updatedAt: now,
};
const notebook: Notebook = {
  id: "n-synthetic",
  grimoireId: grimoire.id,
  title: "Caderno inicial",
  position: 0,
  createdAt: now,
  updatedAt: now,
};
const chapter: Chapter = {
  id: "c-synthetic",
  notebookId: notebook.id,
  title: "Capítulo inicial",
  position: 0,
  createdAt: now,
  updatedAt: now,
};
const page: Page = {
  id: "p-synthetic",
  chapterId: chapter.id,
  title: "Página inicial",
  content: { type: "document", blocks: [] },
  position: 0,
  createdAt: now,
  updatedAt: now,
};

function nextStep() {
  return document.querySelector("[data-journey-step]")?.getAttribute("data-journey-step");
}

beforeEach(() => {
  window.history.replaceState({}, "", "/workspace?view=tree#current");
});

describe("Workspace journey with synthetic persisted-action fixtures", () => {
  it("creates and renames the full hierarchy, edits/saves a page and opens real study modules", async () => {
    const onCreateGrimoire = vi.fn(async () => grimoire);
    const onCreateNotebook = vi.fn(async () => notebook);
    const onCreateChapter = vi.fn(async () => chapter);
    const onCreatePage = vi.fn(async () => page);
    const onRenameGrimoire = vi.fn(async (input: { id: string; title: string }) => ({
      ...grimoire,
      title: input.title,
    }));
    const onRenameNotebook = vi.fn(async (input: { id: string; title: string }) => ({
      ...notebook,
      title: input.title,
    }));
    const onRenameChapter = vi.fn(async (input: { id: string; title: string }) => ({
      ...chapter,
      title: input.title,
    }));
    const onSavePage = vi.fn(async (input: {
      id: string;
      title: string;
      content: Page["content"];
    }) => ({
      ...page,
      title: input.title,
      content: input.content,
    }));

    render(
      <WorkspaceShell
        tree={{ grimoires: [] }}
        initialState={{
          grimoireId: null,
          notebookId: null,
          chapterId: null,
          pageId: null,
        }}
        onCreateGrimoire={onCreateGrimoire}
        onCreateNotebook={onCreateNotebook}
        onCreateChapter={onCreateChapter}
        onCreatePage={onCreatePage}
        onRenameGrimoire={onRenameGrimoire}
        onRenameNotebook={onRenameNotebook}
        onRenameChapter={onRenameChapter}
        onMovePage={vi.fn(async () => ({ movedPage: page, swappedPage: null }))}
        onDeletePage={vi.fn(async () => undefined)}
        onSavePage={onSavePage}
      />,
    );

    expect(nextStep()).toBe("Grimório");
    fireEvent.change(screen.getByLabelText("Novo grimório"), {
      target: { value: "Grimório inicial" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar grimório" }));
    await waitFor(() => expect(nextStep()).toBe("Caderno"));
    expect(onCreateGrimoire).toHaveBeenCalledWith({ title: "Grimório inicial" });

    const grimoireForm = screen.getByRole("form", { name: "Renomear grimório" });
    fireEvent.change(within(grimoireForm).getByRole("textbox", { name: "Título" }), {
      target: { value: "Alquimia arcana" },
    });
    fireEvent.click(within(grimoireForm).getByRole("button", { name: "Salvar título" }));
    await waitFor(() => expect(onRenameGrimoire).toHaveBeenCalledWith({
      id: grimoire.id,
      title: "Alquimia arcana",
    }));

    fireEvent.change(screen.getByLabelText("Novo caderno"), {
      target: { value: "Caderno inicial" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar caderno" }));
    await waitFor(() => expect(nextStep()).toBe("Capítulo"));
    expect(onCreateNotebook).toHaveBeenCalledWith({
      grimoireId: grimoire.id,
      title: "Caderno inicial",
    });

    const notebookForm = screen.getByRole("form", { name: "Renomear caderno" });
    fireEvent.change(within(notebookForm).getByRole("textbox", { name: "Título" }), {
      target: { value: "Anotações de alquimia" },
    });
    fireEvent.click(within(notebookForm).getByRole("button", { name: "Salvar título" }));
    await waitFor(() => expect(onRenameNotebook).toHaveBeenCalledWith({
      id: notebook.id,
      title: "Anotações de alquimia",
    }));

    fireEvent.change(screen.getByLabelText("Novo capítulo"), {
      target: { value: "Capítulo inicial" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar capítulo" }));
    await waitFor(() => expect(nextStep()).toBe("Página"));
    expect(onCreateChapter).toHaveBeenCalledWith({
      notebookId: notebook.id,
      title: "Capítulo inicial",
    });

    const chapterForm = screen.getByRole("form", { name: "Renomear capítulo" });
    fireEvent.change(within(chapterForm).getByRole("textbox", { name: "Título" }), {
      target: { value: "Primeiro experimento" },
    });
    fireEvent.click(within(chapterForm).getByRole("button", { name: "Salvar título" }));
    await waitFor(() => expect(onRenameChapter).toHaveBeenCalledWith({
      id: chapter.id,
      title: "Primeiro experimento",
    }));

    fireEvent.change(screen.getByLabelText("Nova página"), {
      target: { value: "Página inicial" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar página" }));
    expect(await screen.findByLabelText("Editor da página")).toBeTruthy();
    expect(onCreatePage).toHaveBeenCalledWith({
      chapterId: chapter.id,
      title: "Página inicial",
    });
    await waitFor(() => expect(window.location.search).toContain("page=p-synthetic"));

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Propriedades da matéria" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar bloco" }));
    fireEvent.change(screen.getByLabelText("Bloco 1"), {
      target: { value: "Anotações do primeiro estudo." },
    });
    expect(screen.queryByRole("link", { name: "Praticar este conteúdo" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeTruthy();
    expect(onSavePage).toHaveBeenCalledWith({
      id: "p-synthetic",
      title: "Propriedades da matéria",
      content: {
        type: "document",
        blocks: [{ type: "paragraph", content: "Anotações do primeiro estudo." }],
      },
    });

    expect(screen.getByRole("link", { name: "Praticar este conteúdo" })).toHaveAttribute(
      "href",
      "/pratica?pagina=p-synthetic",
    );
    expect(screen.getByRole("link", { name: "Planejar uma tarefa de estudo" })).toHaveAttribute(
      "href",
      "/cronograma",
    );
    expect(screen.getByRole("link", { name: "Ver minhas missões" })).toHaveAttribute(
      "href",
      "/missoes",
    );
    expect(screen.getByText(/abrir esta página não gera XP/)).toBeTruthy();
  });
});
