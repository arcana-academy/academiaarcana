import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { WorkspaceState } from "@/domains/learning";
import { WorkspaceJourneyGuide } from "./WorkspaceJourneyGuide";

const empty: WorkspaceState = {
  grimoireId: null,
  notebookId: null,
  chapterId: null,
  pageId: null,
};

function html(state: WorkspaceState) {
  return renderToStaticMarkup(<WorkspaceJourneyGuide state={state} />);
}

describe("WorkspaceJourneyGuide", () => {
  it.each([
    [{ ...empty }, "Grimório", "Crie seu primeiro grimório"],
    [{ ...empty, grimoireId: "g1" }, "Caderno", "Crie um caderno"],
    [{ ...empty, grimoireId: "g1", notebookId: "n1" }, "Capítulo", "Crie um capítulo"],
    [
      { grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: null },
      "Página",
      "Crie ou selecione uma página",
    ],
  ] as const)("prompts the next persisted creation step: %s", (state, stage, message) => {
    const result = html(state);
    expect(result).toContain(`data-journey-step="${stage}"`);
    expect(result).toContain(message);
    expect(result).toContain('aria-current="step"');
  });

  it("does not claim a mission or XP on page selection", () => {
    const result = html({
      grimoireId: "g1",
      notebookId: "n1",
      chapterId: "c1",
      pageId: "p1",
    });

    expect(result).toContain("Página selecionada");
    expect(result).toContain("abrir esta página não gera XP");
    expect(result).not.toContain("10 XP");
  });
});
