"use client";

import { useEffect, useState } from "react";

import { StatisticsView } from "@/app/estatisticas/StatisticsView";
import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";
import {
  statisticsPilotGamification,
  statisticsPilotScenarios,
  type StatisticsPilotScenario,
} from "./statistics-pilot-fixtures";

const scenarioLabels: Record<StatisticsPilotScenario, string> = {
  "no-data": "Sem dados",
  "mixed-evidence": "Evidência mista",
  "objective-confirmed": "Avaliação objetiva confirmada",
  "review-gap": "Revisão e possível lacuna",
  "low-confidence": "Sinais de baixa confiança",
};

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_IDS.includes(value as ThemeId));
}

export function StatisticsPilotHarness({
  initialScenario,
}: {
  initialScenario: StatisticsPilotScenario;
}) {
  const { theme, setTheme } = useTheme();
  const [scenario, setScenario] = useState(initialScenario);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTheme = params.get("theme");
    if (isThemeId(requestedTheme)) setTheme(requestedTheme);
  }, [setTheme]);

  return (
    <div className="aa-app-shell" data-testid="statistics-production-pilot">
      <header className="aa-surface aa-card-default">
        <p className="aa-eyebrow">Fase 2 · Ciclo 12 · production pilot</p>
        <h1>Estatísticas — validação da superfície analítica</h1>
        <p className="aa-state-copy">
          Este harness renderiza a StatisticsView real com projeções preparadas. Não chama
          autenticação, repositórios ou serviços externos.
        </p>
        <div className="aa-feature-grid">
          <label className="aa-field">
            Tema de validação
            <select
              className="aa-input"
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeId)}
              data-testid="statistics-pilot-theme-select"
            >
              {THEME_IDS.map((id) => (
                <option key={id} value={id}>
                  {themePresets[id].name}
                </option>
              ))}
            </select>
          </label>
          <label className="aa-field">
            Cenário de validação
            <select
              className="aa-input"
              value={scenario}
              onChange={(event) => setScenario(event.target.value as StatisticsPilotScenario)}
              data-testid="statistics-pilot-scenario-select"
            >
              {Object.entries(scenarioLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div data-scenario={scenario}>
        <StatisticsView
          gamification={statisticsPilotGamification}
          educational={statisticsPilotScenarios[scenario]}
        />
      </div>
    </div>
  );
}
