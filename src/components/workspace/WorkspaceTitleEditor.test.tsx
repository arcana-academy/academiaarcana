// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { WorkspaceTitleEditor } from "./WorkspaceTitleEditor";

describe("WorkspaceTitleEditor", () => {
  test("saves a trimmed title", async () => {
    const onSave = vi.fn(() => Promise.resolve());

    render(
      <WorkspaceTitleEditor
        title="Caderno"
        itemLabel="caderno"
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "  Caderno renomeado  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar título" }));

    expect(onSave).toHaveBeenCalledWith("  Caderno renomeado  ");
    expect(await screen.findByDisplayValue("Caderno renomeado")).toBeTruthy();
  });

  test("shows an accessible error when save fails", async () => {
    const onSave = vi.fn(() => Promise.reject(new Error("failed")));

    render(
      <WorkspaceTitleEditor
        title="Capítulo"
        itemLabel="capítulo"
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Capítulo novo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar título" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Não foi possível renomear o capítulo.");
  });
});
