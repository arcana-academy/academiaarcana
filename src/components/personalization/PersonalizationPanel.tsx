"use client";

import { useTheme } from "@/design-system/themes";
import type { ThemeId } from "@/design-system/tokens/types";
import { useAccessibilityPreferencesContext } from "@/application/accessibility-preferences/AccessibilityPreferencesContext";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";

const motionOptions = [
  { value: "system" as const, label: "Seguir o sistema" },
  { value: "normal" as const, label: "Movimento normal" },
  { value: "reduced" as const, label: "Reduzir movimento" },
];

export function PersonalizationPanel() {
  const { theme, setTheme } = useTheme();
  const { state, setMotionPreference } = useAccessibilityPreferencesContext();
  const selectedMotionLabel = state
    ? motionOptions.find((option) => option.value === state.configuredMotionPreference)?.label ?? "Indisponível"
    : "Carregando preferências";
  const appliedMotionLabel = state
    ? state.effectiveMotionPreference === "reduced" ? "Reduzido" : "Normal"
    : "Carregando preferências";

  return (
    <main className="aa-page aa-page-narrow aa-personalization" aria-labelledby="personalizar-title">
      <header className="aa-page-header">
        <div className="aa-page-header-copy">
          <p className="aa-eyebrow">Personalização · identidade</p>
          <h1 id="personalizar-title">Personalizar</h1>
          <p>Crie um ambiente que favoreça leitura, foco e conforto sem perder a identidade Arcana.</p>
        </div>
      </header>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="theme-title">
        <div className="aa-surface-header">
          <div><p className="aa-eyebrow">Theme Engine</p><h2 id="theme-title">Tema visual</h2></div>
        </div>
        <div className="aa-control-grid">
          <div className="aa-control">
            <label htmlFor="theme-select">
              Escolha um tema
              <select id="theme-select" value={theme} onChange={(event) => setTheme(event.target.value as ThemeId)}>
                {THEME_IDS.map((id) => <option key={id} value={id}>{themePresets[id].name}</option>)}
              </select>
            </label>
          </div>
          <div className="aa-control">
            <label htmlFor="motion-select">
              Preferência de movimento
              <select
                id="motion-select"
                value={state?.configuredMotionPreference ?? "system"}
                aria-describedby={state?.error ? "motion-description motion-error" : "motion-description"}
                onChange={(event) => { void setMotionPreference(event.target.value as "system" | "normal" | "reduced"); }}
              >
                {motionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <p id="motion-description" className="aa-field-description">
              Ao seguir o sistema, o movimento respeita a preferência do seu dispositivo.
            </p>
          </div>
        </div>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="personalization-principles">
        <div className="aa-surface-header">
          <div><p className="aa-eyebrow">Conforto</p><h2 id="personalization-principles">Seu ambiente, suas regras</h2></div>
        </div>
        <div className="aa-stat-grid">
          <div className="aa-stat"><span className="aa-stat-label">Tema atual</span><div className="aa-stat-value">{themePresets[theme].name}</div></div>
          <div className="aa-stat"><span className="aa-stat-label">Movimento escolhido</span><div className="aa-stat-value">{selectedMotionLabel}</div></div>
          <div className="aa-stat"><span className="aa-stat-label">Movimento aplicado</span><div className="aa-stat-value">{appliedMotionLabel}</div></div>
          <div className="aa-stat"><span className="aa-stat-label">Princípio</span><div className="aa-stat-value">Clareza</div><div className="aa-stat-meta">A estética serve ao estudo.</div></div>
        </div>
        {state?.error ? <p id="motion-error" role="alert" className="aa-field-error">Não foi possível persistir a preferência de movimento.</p> : null}
        <p role="status" aria-live="polite" className="aa-field-description">Tema atual: {themePresets[theme].name}. Movimento aplicado: {appliedMotionLabel.toLowerCase()}.</p>
      </section>
    </main>
  );
}
