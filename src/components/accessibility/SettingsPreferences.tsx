"use client";

import { useReadingPreferences } from "@/application/accessibility-preferences/useReadingPreferences";
import { useSiteAppearance } from "@/application/appearance/SiteAppearanceProvider";
import { useAccessibilityPreferencesContext } from "@/application/accessibility-preferences/AccessibilityPreferencesContext";

/** Settings view of the existing preferences; no parallel state or storage keys. */
export function SettingsPreferences() {
  const { appearance, setAppearance } = useSiteAppearance();
  const { reading, updateReading, storageWarning } = useReadingPreferences();
  const { state, setMotionPreference } = useAccessibilityPreferencesContext();

  return (
    <section aria-label="Preferências de aparência e leitura" className="aa-settings-preferences">
      <div className="aa-settings-preference-group">
        <label htmlFor="aa-settings-theme">Aparência do site</label>
        <select
          className="aa-input"
          id="aa-settings-theme"
          value={appearance}
          onChange={(event) =>
            setAppearance(event.target.value as "system" | "dark" | "light")
          }
        >
          <option value="system">Automático — seguir o dispositivo</option>
          <option value="dark">Biblioteca Noturna</option>
          <option value="light">Pergaminho Claro</option>
        </select>
        <p>As preferências dos grimórios pessoais são independentes da identidade do site.</p>
      </div>
      <fieldset className="aa-settings-reading">
        <legend>Conforto de leitura</legend>
        <label>
          <input type="checkbox" checked={reading.largeText}
            onChange={(event) => updateReading("largeText", event.target.checked)} />
          Ampliar texto
        </label>
        <label>
          <input type="checkbox" checked={reading.extraSpacing}
            onChange={(event) => updateReading("extraSpacing", event.target.checked)} />
          Aumentar espaçamento
        </label>
        <label>
          <input type="checkbox" checked={reading.highContrast}
            onChange={(event) => updateReading("highContrast", event.target.checked)} />
          Reforçar contraste
        </label>
        <label>
          <input type="checkbox" checked={reading.focusMode}
            onChange={(event) => updateReading("focusMode", event.target.checked)} />
          Modo Foco
        </label>
      </fieldset>
      <div className="aa-settings-preference-group">
        <label htmlFor="aa-settings-motion">Animações</label>
        <select
          id="aa-settings-motion"
          className="aa-input"
          value={state?.configuredMotionPreference ?? "system"}
          onChange={(event) => void setMotionPreference(event.target.value as "system" | "normal" | "reduced")}
        >
          <option value="system">Seguir o dispositivo</option>
          <option value="reduced">Reduzir movimento</option>
          <option value="normal">Movimento padrão</option>
        </select>
        {state?.error ? <p role="alert">Não foi possível salvar a preferência de movimento.</p> : null}
      </div>
      {storageWarning ? (
        <p role="status">Não foi possível salvar as opções de leitura neste dispositivo.</p>
      ) : null}
    </section>
  );
}
