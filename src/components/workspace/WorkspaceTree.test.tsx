﻿// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, test, vi } from "vitest";
import { WorkspaceTree } from "./WorkspaceTree";

const tree: ComponentProps<typeof WorkspaceTree>["data"] = {
  grimoires: [
    {
      id: "g1",
      ownerId: "u1",
      title: "Anatomia",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      notebooks: [
        {
          id: "n1",
          grimoireId: "g1",
          title: "Sistema Musculoesquelético",
          position: 0,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          chapters: [
            {
              id: "c1",
              notebookId: "n1",
              title: "Coluna",
              position: 0,
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
              pages: [
                {
                  id: "p1",
                  chapterId: "c1",
                  title: "Dor lombar",
                  content: { type: "document", blocks: [] },
                  position: 0,
                  createdAt: "2026-01-01",
                  updatedAt: "2026-01-01",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("WorkspaceTree", () => {
  test("renders the canonical hierarchy and exposes the selected page", () => {
    render(
      <WorkspaceTree
        data={tree}
        state={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: "p1",
        }}
        onOpenGrimoire={vi.fn()}
        onOpenNotebook={vi.fn()}
        onOpenChapter={vi.fn()}
        onOpenPage={vi.fn()}
      />,
    );

    expect(screen.getByText("Anatomia")).toBeTruthy();
    expect(screen.getByText("Sistema Musculoesquelético")).toBeTruthy();
    expect(screen.getByText("Coluna")).toBeTruthy();

    const page = screen.getByRole("button", { name: "Dor lombar" });
    expect(page).toHaveAttribute("aria-current", "page");
  });

  test("supports keyboard-accessible page selection", () => {
    render(
      <WorkspaceTree
        data={tree}
        state={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: null,
        }}
        onOpenGrimoire={vi.fn()}
        onOpenNotebook={vi.fn()}
        onOpenChapter={vi.fn()}
        onOpenPage={vi.fn()}
      />,
    );

    const page = screen.getByRole("button", { name: "Dor lombar" });
    expect(page).toHaveAttribute("tabindex", "0");
  });

  test("shows an accessible empty state when there are no grimoires", () => {
    render(
      <WorkspaceTree
        data={{ grimoires: [] }}
        state={{
          grimoireId: null,
          notebookId: null,
          chapterId: null,
          pageId: null,
        }}
        onOpenGrimoire={vi.fn()}
        onOpenNotebook={vi.fn()}
        onOpenChapter={vi.fn()}
        onOpenPage={vi.fn()}
      />,
    );

    expect(screen.getByText("Nenhum grimório encontrado")).toBeTruthy();
  });

  test("collapses and expands a hierarchy group", () => {
    render(
      <WorkspaceTree
        data={tree}
        state={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: "p1",
        }}
        onOpenGrimoire={vi.fn()}
        onOpenNotebook={vi.fn()}
        onOpenChapter={vi.fn()}
        onOpenPage={vi.fn()}
      />,
    );

    const toggle = screen.getByRole("button", {
      name: "Recolher Anatomia",
    });

    expect(screen.getByRole("button", { name: "Dor lombar" })).toBeTruthy();

    fireEvent.click(toggle);

    expect(
      screen.queryByRole("button", { name: "Dor lombar" }),
    ).toBeNull();

    expect(
      screen.getByRole("button", { name: "Expandir Anatomia" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Expandir Anatomia" }),
    );

    expect(screen.getByRole("button", { name: "Dor lombar" })).toBeTruthy();
  });
});
