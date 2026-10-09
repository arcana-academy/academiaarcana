// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  statisticsPilotGamification,
  statisticsPilotScenarios,
  type StatisticsPilotScenario,
} from "@/app/design-system/pilots/statistics/statistics-pilot-fixtures";
import { StatisticsView } from "./StatisticsView";

function renderScenario(scenario: StatisticsPilotScenario) {
  return render(
    <StatisticsView
      gamification={statisticsPilotGamification}
      educational={statisticsPilotScenarios[scenario]}
    />,
  );
}

describe("StatisticsView accessibility and educational evidence contract", () => {
  it("preserves progress semantics and non-colour evidence separation", () => {
    const { container } = renderScenario("mixed-evidence");

    const progress = screen.getByRole("progressbar", {
      name: "Progresso para o próximo nível",
    });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(progress).toHaveAttribute("aria-valuenow", "62");

    const selfReported = container.querySelector('[data-evidence-kind="self-reported"]');
    const objective = container.querySelector('[data-evidence-kind="objective"]');
    expect(selfReported).not.toBeNull();
    expect(objective).not.toBeNull();
    expect(
      within(selfReported as HTMLElement).getByRole("heading", {
        name: "Evidência autorreportada por conteúdo",
      }),
    ).toBeInTheDocument();
    expect(
      within(objective as HTMLElement).getByRole("heading", {
        name: "Evidência objetiva",
      }),
    ).toBeInTheDocument();
    expect(
      within(selfReported as HTMLElement).getByText(/fonte: autoavaliação/),
    ).toBeInTheDocument();
    expect(
      within(objective as HTMLElement).getByText(/fonte: critério explícito/),
    ).toBeInTheDocument();
    expect(
      within(objective as HTMLElement).getByText(/Não confirmado/),
    ).toBeInTheDocument();
  });

  it("keeps no-data states honest without implying mastery", () => {
    renderScenario("no-data");

    expect(screen.getByText("Sem atividades de prática ainda.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhuma avaliação objetiva foi criada ainda. A ausência aqui não significa ausência de aprendizagem.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma lacuna sinalizada com a evidência disponível/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Não há revisão liberada neste momento."),
    ).toBeInTheDocument();
  });

  it("preserves objective confirmation and canonical review handoff", () => {
    const { unmount } = renderScenario("objective-confirmed");
    expect(screen.getByText(/Confirmado · 2\/2 aprovações/)).toBeInTheDocument();
    expect(screen.getByText(/fonte: critério explícito/)).toBeInTheDocument();
    unmount();

    renderScenario("review-gap");
    expect(screen.getByRole("heading", { name: "Possíveis lacunas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar" })).toHaveAttribute(
      "href",
      "/pratica?pagina=page-fractions&item=self-item-gap",
    );
  });

  it("represents low-confidence practice without fabricating mastery or empty evidence", () => {
    const { container } = renderScenario("low-confidence");

    expect(screen.getAllByText(/confiança Insuficiente/)).toHaveLength(3);
    expect(screen.getByText("1 tentativa(s)")).toBeInTheDocument();
    const evidence = container.querySelector('[data-evidence-kind="self-reported"]');
    expect(evidence).not.toBeNull();
    expect(within(evidence as HTMLElement).getByText(/30% · 1 tentativa/)).toBeInTheDocument();
    expect(
      within(evidence as HTMLElement).getByText(/Uma única autoavaliação/),
    ).toBeInTheDocument();
    expect(
      within(evidence as HTMLElement).queryByText("Sem atividades de prática ainda."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Não há revisão liberada neste momento.")).toBeInTheDocument();
  });
});
