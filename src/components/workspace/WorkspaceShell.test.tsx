// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Page } from "@/domains/learning";
import { WorkspaceShell } from "./WorkspaceShell";

const createdPage: Page = {
  id: "p1",
  chapterId: "c1",
  title: "Nova página",
  content: {
    type: "document",
    blocks: [],
  },
  position: 0,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

/** Build the smallest hierarchy needed to exercise page creation. */
function createTree() {
  return {
    grimoires: [
      {
        id: "g1",
        ownerId: "u1",
        title: "Grimório",
        createdAt: "2026-09-20T00:00:00.000Z",
        updatedAt: "2026-09-20T00:00:00.000Z",
        notebooks: [
          {
            id: "n1",
            grimoireId: "g1",
            title: "Caderno",
            position: 0,
            createdAt: "2026-09-20T00:00:00.000Z",
            updatedAt: "2026-09-20T00:00:00.000Z",
            chapters: [
              {
                id: "c1",
                notebookId: "n1",
                title: "Capítulo",
                position: 0,
                createdAt: "2026-09-20T00:00:00.000Z",
                updatedAt: "2026-09-20T00:00:00.000Z",
                pages: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("WorkspaceShell", () => {
  test("creates a page and opens it in the editor", async () => {
    const onCreatePage = vi.fn(() => Promise.resolve(createdPage));
    const onSavePage = vi.fn(() => Promise.resolve(createdPage));

    render(
      <WorkspaceShell
        tree={createTree()}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: null,
        }}
        onCreatePage={onCreatePage}
        onSavePage={onSavePage}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nova página"), {
      target: { value: "Nova página" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Criar página" }),
    );

    expect(await screen.findByDisplayValue("Nova página")).toBeTruthy();
    expect(onCreatePage).toHaveBeenCalledWith({
      chapterId: "c1",
      title: "Nova página",
    });
    expect(screen.getByRole("button", { name: "Nova página" })).toBeTruthy();
  });
});
