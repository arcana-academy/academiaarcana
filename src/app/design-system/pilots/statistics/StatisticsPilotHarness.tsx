"use client";

import { useEffect } from "react";

import { StatisticsView } from "@/app/estatisticas/StatisticsView";
import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";
import {
  STATISTICS_PILOT_SCENARIOS,
  type StatisticsPilotScenario,
} from "./statistics-pilot-data";

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_IDS.includes(value as ThemeId));
}

export function StatisticsPilotHarness({
  scenario,
}: {
  scenario: StatisticsPilotScenario;
}) {
  const { theme, setTheme } = useTheme();
  const projection = STATISTICS_PILOT_SCENARIOS[scenario];

  useEffect(() => {
    const requestedTheme = new URLSearchParams(window.location.search).get("theme");
    if (isThemeId(requestedTheme)) setTheme(requestedTheme);
  }, [setTheme]);

  return (
    <div
      className="aa-app-shell"
      data-testid="statistics-production-pilot"
      data-pilot-status="validation"
      data-scenario={scenario}
    >
      <header className="aa-surface aa-card-default">
        <p className="aa-eyebrow">Fase 2 · Ciclo 12 · production pilot</p>
        <h1>Estatísticas — validação da presentation layer real</h1>
        <p className="aa-state-copy">
          Este harness renderiza StatisticsView com projections prontas. Não executa
          autenticação, repositories nem lógica de domínio.
        </p>
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
      </header>

      <StatisticsView
        gamification={projection.gamification}
        educational={projection.educational}
      />
    </div>
  );
}
