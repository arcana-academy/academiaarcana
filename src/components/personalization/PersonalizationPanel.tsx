"use client";

import { useTheme } from "@/design-system/themes";
import type { ThemeId } from "@/design-system/tokens/types";
import {
  useAccessibilityPreferencesContext,
} from "@/application/accessibility-preferences/AccessibilityPreferencesContext";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";

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
    <main aria-labelledby="personalizar-title">
      <h1 id="personalizar-title">Personalizar</h1>

      <section aria-labelledby="theme-title">
        <h2 id="theme-title">Tema visual</h2>
        <label htmlFor="theme-select">Escolha um tema</label>
        <select
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
      </section>

      <section aria-labelledby="motion-title">
        <h2 id="motion-title">Movimento</h2>
        <label htmlFor="motion-select">Preferência de movimento</label>
        <select
          id="motion-select"
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

        {state?.error ? (
          <p role="alert">
            Não foi possível persistir a preferência de movimento.
          </p>
        ) : null}
      </section>

      <p role="status" aria-live="polite">
        Tema atual: {themePresets[theme].name}.
      </p>
    </main>
  );
}
