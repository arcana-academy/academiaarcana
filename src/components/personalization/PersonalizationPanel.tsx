"use client";

import {
  useAccessibilityPreferencesContext,
} from "@/application/accessibility-preferences/AccessibilityPreferencesContext";
import { useTheme } from "@/design-system/themes";
import type { ThemeId } from "@/design-system/tokens/types";
import {
  THEME_IDS,
  themePresets,
} from "@/design-system/themes/presets";

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
    <main
      className="aa-page aa-page-wide"
      aria-labelledby="personalizar-title"
    >
      <header className="aa-card aa-card-elevated aa-page-header">
        <p className="aa-eyebrow">Personalização</p>
        <h1 id="personalizar-title">Personalizar</h1>
        <p className="aa-page-intro">
          Ajuste a atmosfera visual e o movimento para que o ambiente acompanhe
          sua forma de estudar.
        </p>
      </header>

      <section className="aa-card aa-card-default aa-section" aria-labelledby="theme-title">
        <header className="aa-page-header">
          <p className="aa-eyebrow">Aparência</p>
          <h2 id="theme-title">Tema visual</h2>
          <p className="aa-page-intro">
            Escolha entre {THEME_IDS.length} temas sem alterar a estrutura,
            conteúdo ou permissões da Academia.
          </p>
        </header>

        <div className="aa-form-field">
          <label htmlFor="theme-select">Escolha um tema</label>
          <select
            className="aa-select"
            id="theme-select"
            name="theme"
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

        <p className="aa-status" role="status" aria-live="polite">
          Tema atual: {themePresets[theme].name}.
        </p>
      </section>

      <section className="aa-card aa-card-default aa-section" aria-labelledby="motion-title">
        <header className="aa-page-header">
          <p className="aa-eyebrow">Acessibilidade</p>
          <h2 id="motion-title">Movimento</h2>
          <p className="aa-page-intro">
            Reduza animações quando movimentos possam atrapalhar sua leitura ou
            concentração.
          </p>
        </header>

        <div className="aa-form-field">
          <label htmlFor="motion-select">Preferência de movimento</label>
          <select
            className="aa-select"
            id="motion-select"
            name="motion"
            value={state?.configuredMotionPreference ?? "system"}
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

        {state?.error ? (
          <div className="aa-alert aa-alert-danger" role="alert">
            <p>
              Não foi possível persistir a preferência de movimento. Sua escolha
              continua aplicada enquanto a tela estiver aberta.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
