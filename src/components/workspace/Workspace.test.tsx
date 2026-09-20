// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Workspace } from "./Workspace";

describe("Workspace", () => {
  test("renders the three-region workspace shell", () => {
    render(
      <Workspace
        tree={{ grimoires: [] }}
        state={{
          grimoireId: null,
          notebookId: null,
          chapterId: null,
          pageId: null,
        }}
        title="Academia Arcana"
        selectedPage={null}
        onOpenGrimoire={vi.fn()}
        onOpenNotebook={vi.fn()}
        onOpenChapter={vi.fn()}
        onOpenPage={vi.fn()}
        onCreateGrimoire={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onRenameGrimoire={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onRenameNotebook={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onRenameChapter={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onCreateNotebook={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onCreateChapter={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onCreatePage={vi.fn(() =>
          Promise.reject(new Error("not used in this test")),
        )}
        onDeletePage={vi.fn(() =>
          Promise.reject(new Error("not used in this test")),
        )}
        onSavePage={vi.fn(() =>
          Promise.reject(new Error("not used in this test")),
        )}
      />,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Navegação do workspace" }),
    ).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
  });
});
