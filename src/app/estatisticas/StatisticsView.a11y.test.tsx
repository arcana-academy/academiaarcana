// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { STATISTICS_PILOT_SCENARIOS } from "@/app/design-system/pilots/statistics/statistics-pilot-data";
import { StatisticsView } from "./StatisticsView";

function renderScenario(
  scenario: keyof typeof STATISTICS_PILOT_SCENARIOS,
) {
  const projection = STATISTICS_PILOT_SCENARIOS[scenario];
  return render(
    <StatisticsView
      gamification={projection.gamification}
      educational={projection.educational}
    />,
  );
}

describe("StatisticsView accessibility and semantic boundary contract", () => {
  it("keeps gamification progress semantics and non-colour evidence distinctions", () => {
    renderScenario("mixed");

    const progress = screen.getByRole("progressbar", {
      name: "Progresso para o próximo nível",
    });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(progress).toHaveAttribute("aria-valuenow", "40");

    expect(
      screen.getByRole("heading", {
        name: "Evidência autorreportada por conteúdo",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Evidência objetiva" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/fonte: autoavaliação/)).toBeInTheDocument();
    expect(screen.getByText(/fonte: critério explícito/)).toBeInTheDocument();
    expect(screen.getByText("Não confirmado", { exact: false })).toBeInTheDocument();
  });

  it("preserves honest no-data semantics without implying mastery", () => {
    renderScenario("no-data");

    expect(screen.getByText("Sem atividades de prática ainda.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhuma avaliação objetiva foi criada ainda. A ausência aqui não significa ausência de aprendizagem.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Nenhuma lacuna sinalizada com a evidência disponível/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Não há revisão liberada neste momento."),
    ).toBeInTheDocument();
  });

  it("preserves objective confirmation, confidence and canonical review handoffs", () => {
    const { unmount } = renderScenario("objective-confirmed");
    expect(screen.getByText("Confirmado", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/fonte: critério explícito/)).toBeInTheDocument();
    unmount();

    renderScenario("review-gap");
    expect(screen.getByRole("heading", { name: "Possíveis lacunas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar" })).toHaveAttribute(
      "href",
      "/pratica?pagina=page-cardio&item=self-cardio",
    );
  });

  it("keeps low-confidence profile signals explicit", () => {
    renderScenario("low-confidence");

    expect(screen.getAllByText(/confiança Insuficiente/)).toHaveLength(3);
    expect(screen.getByText("1 tentativa(s)")).toBeInTheDocument();
  });
});
