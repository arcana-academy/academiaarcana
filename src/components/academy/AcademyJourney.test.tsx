import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AcademyJourney,
  type AcademyJourneyProjection,
} from "./AcademyJourney";

const ready: AcademyJourneyProjection = {
  continueLearning: {
    status: "ready",
    data: {
      intent: "resume",
      grimoireId: "g1",
      grimoireTitle: "Alquimia",
      notebookId: "n1",
      notebookTitle: "Caderno",
      chapterId: "c1",
      chapterTitle: "Capítulo I",
      pageId: "p1",
      pageTitle: "A primeira página",
      href: "/workspace?view=tree&page=p1#current",
    },
  },
  progress: {
    status: "ready",
    data: { percentage: 50, label: "1 de 2 páginas concluídas" },
  },
  missions: {
    status: "ready",
    data: [
      { id: "m1", title: "Estudar", reward: "+10 XP", isCompleted: true },
      { id: "m2", title: "Revisar", reward: "+10 XP", isCompleted: false },
    ],
  },
  schedule: {
    status: "ready",
    data: [{ id: "t1", title: "Ler página", time: "10:00" }],
  },
};

function render(journey: AcademyJourneyProjection) {
  return renderToStaticMarkup(<AcademyJourney journey={journey} />);
}

describe("AcademyJourney", () => {
  it("connects real study hierarchy to the canonical Workspace and mission links", () => {
    const html = render(ready);

    expect(html).toContain("Alquimia");
    expect(html).toContain("Caderno");
    expect(html).toContain("Capítulo I");
    expect(html).toContain("A primeira página");
    expect(html).toContain('href="/workspace?view=tree&amp;page=p1#current"');
    expect(html).toContain("Retomar conteúdo");
    expect(html).toContain('href="/grimorios"');
    expect(html).toContain('href="/pratica"');
    expect(html).toContain('href="/missoes"');
    expect(html).toContain('href="/cronograma"');
    expect(html).toContain('href="/santuario"');
    expect(html).toContain('aria-label="Explorar materiais de estudo"');
  });

  it("only displays counts obtained from loaded projections", () => {
    const html = render(ready);

    expect(html).toContain("1 de 2 páginas concluídas");
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain("1 de 2 missões concluídas hoje");
    expect(html).toContain("1 tarefa de estudo disponível");
  });

  it("offers a genuine first step when no hierarchy, missions or schedule exist", () => {
    const html = render({
      continueLearning: { status: "empty", data: null },
      progress: { status: "empty", data: null },
      missions: { status: "empty", data: null },
      schedule: { status: "empty", data: null },
    });

    expect(html).toContain("Criar primeiro grimório");
    expect(html).toContain('href="/workspace"');
    expect(html).toContain("Nenhuma missão registrada hoje");
    expect(html).toContain("Nenhuma tarefa futura");
    expect(html).not.toContain("missões concluídas hoje");
    expect(html).not.toContain('aria-valuenow="0"');
  });

  it("does not call a repository failure an empty library or zero progress", () => {
    const html = render({
      continueLearning: { status: "error", data: null, message: "unavailable" },
      progress: { status: "error", data: null, message: "unavailable" },
      missions: { status: "error", data: null, message: "unavailable" },
      schedule: { status: "error", data: null, message: "unavailable" },
    });

    expect(html).toContain("temporariamente indisponível");
    expect(html).toContain("estudos não foram reiniciados");
    expect(html).toContain("Não foi possível consultar as missões");
    expect(html).toContain("Não foi possível consultar seu cronograma");
    expect(html).not.toContain("Nenhuma missão registrada hoje");
    expect(html).not.toContain("Criar primeiro grimório");
  });

  it("handles not-configured states without suggesting empty persisted results", () => {
    const html = render({
      continueLearning: { status: "not-configured", data: null },
      progress: { status: "not-configured", data: null },
      missions: { status: "not-configured", data: null },
      schedule: { status: "not-configured", data: null },
    });

    expect(html).toContain("ainda não está configurado");
    expect(html).not.toContain("Nenhuma missão registrada hoje");
  });

  it("escapes titles from persisted records instead of injecting markup", () => {
    if (ready.continueLearning.status !== "ready") {
      throw new Error("Expected the ready fixture");
    }

    const html = render({
      ...ready,
      continueLearning: {
        status: "ready",
        data: {
          ...ready.continueLearning.data,
          grimoireTitle: "<script>alert(1)</script>",
        },
      },
    });

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});
