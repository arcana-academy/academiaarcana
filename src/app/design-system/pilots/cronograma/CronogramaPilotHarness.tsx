"use client";

import { useEffect, useMemo, useState } from "react";

import { StudyTaskBoard } from "@/components/planning/StudyTaskBoard";
import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";
import type { StudyTask } from "@/domains/planning";

type Scenario = "default" | "empty" | "error" | "connected";

const task: StudyTask = {
  id: "pilot-task-1",
  ownerId: "pilot-user",
  title: "Revisar capítulo de Fisiologia",
  dueAt: "2026-10-08T18:00:00.000Z",
  status: "pending",
  completedAt: null,
  createdAt: "2026-10-07T20:00:00.000Z",
  updatedAt: "2026-10-07T20:00:00.000Z",
};

const outlookEvents = [
  {
    id: "pilot-event-1",
    subject: "Revisão guiada",
    start: { dateTime: "2026-10-08T18:00:00.000Z", timeZone: "UTC" },
    end: { dateTime: "2026-10-08T18:45:00.000Z", timeZone: "UTC" },
    webLink: "https://example.com/outlook-event",
    isCancelled: false,
  },
];

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_IDS.includes(value as ThemeId));
}

function isScenario(value: string | null): value is Scenario {
  return value === "default" || value === "empty" || value === "error" || value === "connected";
}

export function CronogramaPilotHarness() {
  const { theme, setTheme } = useTheme();
  const [scenario, setScenario] = useState<Scenario>("default");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTheme = params.get("theme");
    const requestedScenario = params.get("scenario");

    if (isThemeId(requestedTheme)) setTheme(requestedTheme);
    if (isScenario(requestedScenario)) setScenario(requestedScenario);
  }, [setTheme]);

  const initialTasks = useMemo(() => (scenario === "empty" ? [] : [task]), [scenario]);

  return (
    <div
      className="aa-app-shell"
      data-testid="cronograma-production-pilot"
      data-pilot-status="validation"
      data-scenario={scenario}
    >
      <header className="aa-surface aa-card-default">
        <p className="aa-eyebrow">Fase 2 · Ciclo 8 · production pilot</p>
        <h1> Cronograma — validação do consumer real</h1>
        <p className="aa-state-copy">
          Este harness renderiza o StudyTaskBoard de produção com dados e actions locais.
          Não duplica a implementação e não chama provedores externos reais.
        </p>
        <label className="aa-field">
          Tema de validação
          <select
            className="aa-input"
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeId)}
            data-testid="cronograma-pilot-theme-select"
          >
            {THEME_IDS.map((id) => (
              <option key={id} value={id}>
                {themePresets[id].name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <StudyTaskBoard
        key={scenario}
        tasks={initialTasks}
        outlookConnected={scenario === "connected"}
        outlookEvents={scenario === "connected" ? outlookEvents : []}
        onCreate={async ({ title, dueAt }) => {
          if (scenario === "error") throw new Error("pilot-create-error");
          return {
            ...task,
            id: "pilot-created-task",
            title,
            dueAt,
            createdAt: new Date(0).toISOString(),
            updatedAt: new Date(0).toISOString(),
          };
        }}
        onComplete={async (id) => ({ ...task, id, status: "completed", completedAt: new Date(0).toISOString() })}
        onScheduleInOutlook={async () => ({ webLink: null })}
      />
    </div>
  );
}
