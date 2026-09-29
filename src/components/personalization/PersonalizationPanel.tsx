"use client";

import { Palette, Sparkles } from "lucide-react";

import {
  useAccessibilityPreferencesContext,
} from "@/application/accessibility-preferences/AccessibilityPreferencesContext";
import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";

const motionOptions = [
  { value: "system" as const, label: "Seguir o sistema" },
  { value: "normal" as const, label: "Movimento normal" },
  { value: "reduced" as const, label: "Reduzir movimento" },
];

export function PersonalizationPanel() {
  const { theme, setTheme } = useTheme();
  const { state, setMotionPreference } =
    useAccessibilityPreferencesContext();

  return (
    <main className="aa-page" aria-labelledby="personalizar-title">
      <header className="aa-card aa-card-elevated aa-page-header">
        <div className="aa-card-icon" aria-hidden="true">
          <Palette size={20} strokeWidth={1.8} />
        </div>
        <p className="aa-eyebrow">Preferências</p>
        <h1 id="personalizar-title">Personalizar</h1>
        <p>
          Ajuste a atmosfera visual e o movimento da interface para criar um
          ambiente de estudo previsível e confortável.
        </p>
      </header>

      <div className="aa-preference-grid">
        <section className="aa-card aa-card-default aa-preference-card" aria-labelledby="theme-title">
          <header>
            <p className="aa-eyebrow">Atmosfera</p>
            <h2 id="theme-title">Tema visual</h2>
            <p>As áreas da Academia usam o mesmo sistema semântico de temas.</p>
          </header>

          <div className="aa-preference-field">
            <label htmlFor="theme-select">Escolha um tema</label>
            <select
              className="aa-native-control"
              id="theme-select"
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeId)}
            >
              {THEME_IDS.map((id) => (
                <option key={id} value={id}>
                  {themePresets[id].name}
                </option>
              ))}
            </select>
          </div>

          <p className="aa-preference-current" role="status" aria-live="polite">
            <Sparkles size={16} aria-hidden="true" />
            Tema atual: {themePresets[theme].name}.
          </p>
        </section>

        <section className="aa-card aa-card-default aa-preference-card" aria-labelledby="motion-title">
          <header>
            <p className="aa-eyebrow">Conforto</p>
            <h2 id="motion-title">Movimento</h2>
            <p>
              Escolha como a interface deve responder a transições e
              microinterações.
            </p>
          </header>

          <div className="aa-preference-field">
            <label htmlFor="motion-select">Preferência de movimento</label>
            <select
              className="aa-native-control"
              id="motion-select"
              value={state?.configuredMotionPreference ?? "system"}
              disabled={!state}
              aria-busy={!state}
              onChange={(event) => {
                void setMotionPreference(
                  event.target.value as "system" | "normal" | "reduced",
                );
              }}
            >
              {motionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {!state ? (
            <p className="aa-field-description" role="status">
              Carregando sua preferência de movimento…
            </p>
          ) : null}

          {state?.error ? (
            <p className="aa-preference-error" role="alert">
              Não foi possível persistir a preferência de movimento.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
