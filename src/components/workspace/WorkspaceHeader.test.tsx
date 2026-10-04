﻿// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { WorkspaceHeader } from "./WorkspaceHeader";

describe("WorkspaceHeader", () => {
  test("renders the workspace title and an accessible navigation landmark", () => {
    render(<WorkspaceHeader title="Meu Workspace" />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Meu Workspace" })).toBeTruthy();
  });

  test("renders an accessible action label when provided", () => {
    render(
      <WorkspaceHeader
        title="Meu Workspace"
        actionLabel="Novo grimório"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Novo grimório" }),
    ).toBeTruthy();
  });
});
