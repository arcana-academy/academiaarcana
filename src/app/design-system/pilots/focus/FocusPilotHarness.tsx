"use client";

import { useEffect } from "react";

import { FocusSession } from "@/components/foco/FocusSession";
import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_IDS.includes(value as ThemeId));
}

export function FocusPilotHarness() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("theme");
    if (isThemeId(requested)) setTheme(requested);
  }, [setTheme]);

  return (
    <main
      className="aa-app-shell"
      data-testid="focus-production-pilot"
      data-pilot-status="validation"
    >
      <header className="aa-surface aa-card-default">
        <p className="aa-eyebrow">Fase 2 · Ciclo 6 · production pilot</p>
        <h1>Foco — validação do consumer real</h1>
        <p className="aa-state-copy">
          Este harness renderiza o componente FocusSession de produção com actions locais de teste.
          Não cria uma segunda implementação visual nem grava dados reais.
        </p>
        <label className="aa-field">
          Tema de validação
          <select
            className="aa-input"
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeId)}
            data-testid="focus-pilot-theme-select"
          >
            {THEME_IDS.map((id) => (
              <option key={id} value={id}>
                {themePresets[id].name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <FocusSession
        startSession={async () => "focus-pilot-session"}
        completeSession={async () => undefined}
      />
    </main>
  );
}
