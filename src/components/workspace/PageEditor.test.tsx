// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Page } from "@/domains/learning";
import { PageEditor } from "./PageEditor";

const page: Page = {
  id: "p1",
  chapterId: "c1",
  title: "Dor lombar",
  content: {
    type: "document",
    blocks: [{ type: "paragraph", content: "Conteúdo inicial." }],
  },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

type SaveInput = {
  id: string;
  title: string;
  content: Page["content"];
};

describe("PageEditor", () => {
  test("renders the selected page and saves title and content", async () => {
    const onSave = vi.fn((input: SaveInput) => Promise.resolve({
      ...page,
      title: input.title,
      content: input.content,
      updatedAt: "2026-01-02",
    }));

    render(<PageEditor page={page} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Dor lombar - revisão" },
    });
    fireEvent.change(screen.getByLabelText("Bloco 1"), {
      target: { value: "Conteúdo revisado." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({
      id: "p1",
      title: "Dor lombar - revisão",
      content: {
        type: "document",
        blocks: [{ type: "paragraph", content: "Conteúdo revisado." }],
      },
    });
    expect(await screen.findByText("Página salva.")).toBeTruthy();
  });

  test("allows adding a paragraph block", () => {
    render(<PageEditor page={page} onSave={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar bloco" }));

    expect(screen.getByLabelText("Bloco 2")).toBeTruthy();
  });

  test("shows a recovery message when saving fails", async () => {
    const onSave = vi.fn(() =>
      Promise.reject(new Error("save failed")),
    );

    render(<PageEditor page={page} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));

    expect(
      await screen.findByText("Não foi possível salvar a página."),
    ).toBeTruthy();
  });
});
