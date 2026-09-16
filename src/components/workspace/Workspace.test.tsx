﻿// @vitest-environment jsdom

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
        onOpenGrimoire={vi.fn()}
        onOpenNotebook={vi.fn()}
        onOpenChapter={vi.fn()}
        onOpenPage={vi.fn()}
      />,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Navegação do workspace" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
  });
});
