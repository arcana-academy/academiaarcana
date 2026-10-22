"use client";

import { useReadingPreferences } from "@/application/accessibility-preferences/reading-preferences";

/** Device-local controls: these never modify the saved educational page. */
export function ReadingControls() {
  const { preferences, update } = useReadingPreferences();

  return (
    <fieldset className="aa-reading-controls">
      <legend>Ajustes de leitura</legend>
      <div className="aa-reading-controls-grid">
        <label htmlFor="aa-reading-size">
          Tamanho do texto
          <select
            id="aa-reading-size"
            value={preferences.size}
            onChange={(event) => update({ size: event.target.value as "normal" | "large" })}
          >
            <option value="normal">Padrão</option>
            <option value="large">Ampliado</option>
          </select>
        </label>
        <label htmlFor="aa-reading-font">
          Fonte de leitura
          <select
            id="aa-reading-font"
            value={preferences.font}
            onChange={(event) => update({ font: event.target.value as "default" | "literata" })}
          >
            <option value="default">Padrão do site</option>
            <option value="literata">Literata</option>
          </select>
        </label>
        <label className="aa-reading-checkbox">
          <input
            type="checkbox"
            checked={preferences.spacing}
            onChange={(event) => update({ spacing: event.target.checked })}
          />
          Espaçamento confortável
        </label>
        <label className="aa-reading-checkbox">
          <input
            type="checkbox"
            checked={preferences.contrast}
            onChange={(event) => update({ contrast: event.target.checked })}
          />
          Contraste reforçado
        </label>
        <label className="aa-reading-checkbox">
          <input
            type="checkbox"
            checked={preferences.focus}
            onChange={(event) => update({ focus: event.target.checked })}
          />
          Modo Foco
        </label>
      </div>
      <p className="aa-field-description">
        Estas preferências ficam neste dispositivo e não alteram as anotações salvas.
        Zoom, teclado e leitores de tela continuam disponíveis independentemente desses ajustes.
      </p>
    </fieldset>
  );
}
