import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { SanctuaryContinueLearning } from "./SanctuaryContinueLearning";

type LearningState = SanctuaryViewModel["continueLearning"];

const learning = {
  intent: "explore" as const,
  grimoireId: "grimoire-1",
  grimoireTitle: "Anatomia",
  notebookId: "notebook-1",
  notebookTitle: "Sistema musculoesquelético",
  chapterId: "chapter-1",
  chapterTitle: "Introdução",
  pageId: "page-1",
  pageTitle: "Página inicial",
  href: "/workspace?view=tree#current",
};

function renderSection(value: LearningState) {
  render(<SanctuaryContinueLearning continueLearning={value} />);
}

describe("SanctuaryContinueLearning", () => {
  it("renders a real exploration context when learning is ready", () => {
    renderSection({ status: "ready", data: learning });

    const section = screen.getByRole("region", { name: "Explorar conteúdo" });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Conteúdo sugerido" }))
      .toContainElement(screen.getByText("Página inicial"));
    expect(screen.getByRole("link", { name: "Abrir este estudo" }))
      .toHaveAttribute("href", learning.href);
    expect(screen.queryByText(/não foi possível carregar/i)).not.toBeInTheDocument();
  });

  it("uses resume semantics only when ready data explicitly marks a real continuation", () => {
    renderSection({
      status: "ready",
      data: { ...learning, intent: "resume" },
    });

    expect(screen.getByRole("region", { name: "Continuar aprendendo" }))
      .toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Caminho atual" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retomar este estudo" }))
      .toHaveAttribute("href", learning.href);
  });

  it("renders only the hierarchy levels present in ready data", () => {
    renderSection({
      status: "ready",
      data: {
        ...learning,
        notebookTitle: undefined,
        chapterTitle: undefined,
        pageTitle: undefined,
      },
    });

    expect(screen.getByText("Anatomia")).toBeInTheDocument();
    expect(screen.queryByText("Sistema musculoesquelético")).not.toBeInTheDocument();
    expect(screen.queryByText("Introdução")).not.toBeInTheDocument();
    expect(screen.queryByText("Página inicial")).not.toBeInTheDocument();
  });

  it("renders a true empty state only when the source returned no content", () => {
    renderSection({ status: "empty", data: null });

    expect(screen.getByRole("region", { name: "Próximo estudo" }))
      .toBeInTheDocument();
    expect(screen.getByText(/Nenhum conteúdo disponível/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar Grimórios" }))
      .toHaveAttribute("href", "/grimorios");
    expect(screen.queryByText(/Não foi possível carregar/i)).not.toBeInTheDocument();
  });

  it("renders a friendly error without empty-state claims or technical details", () => {
    renderSection({
      status: "error",
      data: null,
      message: "DB connection failed digest abc123 stack trace",
    });

    expect(screen.getByRole("region", {
      name: "Contexto de aprendizagem indisponível",
    })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Não foi possível carregar seu contexto de aprendizagem agora.",
    );
    expect(screen.getByText(/Recarregue a página/i)).toBeInTheDocument();

    expect(screen.queryByText(/Nenhum conteúdo disponível/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Explorar Grimórios" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/DB connection failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/abc123|stack trace|digest/i)).not.toBeInTheDocument();
  });
});
