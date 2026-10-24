"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { StatisticsView } from "@/app/estatisticas/StatisticsView";
import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";
import {
  statisticsPilotGamification,
  statisticsPilotScenarios,
  type StatisticsPilotScenario,
} from "./statistics-pilot-fixtures";

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_IDS.includes(value as ThemeId));
}

export function StatisticsPilotHarness({
  scenario,
}: {
  scenario: StatisticsPilotScenario;
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const educational = statisticsPilotScenarios[scenario];

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
          Este harness renderiza a StatisticsView real com projeções preparadas, sem
          consultar os repositórios de dados educacionais. O layout compartilhado
          ainda resolve a identidade da aplicação.
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
        <label className="aa-field">
          Cenário de validação
          <select
            className="aa-input"
            value={scenario}
            data-testid="statistics-pilot-scenario-select"
            onChange={(event) => {
              const url = new URL(window.location.href);
              url.searchParams.set("scenario", event.target.value);
              router.replace(`${url.pathname}${url.search}`, { scroll: false });
            }}
          >
            <option value="no-data">Sem dados</option>
            <option value="mixed-evidence">Evidências mistas</option>
            <option value="objective-confirmed">Confirmação objetiva</option>
            <option value="review-gap">Revisão e lacunas</option>
            <option value="low-confidence">Baixa confiança</option>
          </select>
        </label>
      </header>

      <StatisticsView
        gamification={statisticsPilotGamification}
        educational={educational}
      />
    </div>
  );
}
