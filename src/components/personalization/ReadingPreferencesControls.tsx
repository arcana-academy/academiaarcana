"use client";

import { useId } from "react";
import { useReadingPreferences } from "@/application/accessibility-preferences/reading-preferences";

/** Controls the device-local reading presentation without changing study data. */
export function ReadingPreferencesControls({ expanded = false }: { expanded?: boolean }) {
  const { preferences, update } = useReadingPreferences();
  const id = useId();

  return (
    <details className="aa-reading-preferences" open={expanded ? true : undefined}>
      <summary>Ajustes de leitura</summary>
      <div className="aa-reading-preferences-grid">
        <label htmlFor={id + "-size"}>
          Tamanho do texto
          <select
            id={id + "-size"}
            value={preferences.size}
            onChange={(event) => update({ size: event.target.value as "normal" | "large" })}
          >
            <option value="normal">Padrão</option>
            <option value="large">Ampliado</option>
          </select>
        </label>
        <label htmlFor={id + "-font"}>
          Fonte de leitura
          <select
            id={id + "-font"}
            value={preferences.font}
            onChange={(event) => update({ font: event.target.value as "default" | "literata" })}
          >
            <option value="default">Padrão da interface</option>
            <option value="literata">Literata</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.contrast}
            onChange={(event) => update({ contrast: event.target.checked })}
          />
          Contraste reforçado
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.spacing}
            onChange={(event) => update({ spacing: event.target.checked })}
          />
          Maior espaçamento
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.focus}
            onChange={(event) => update({ focus: event.target.checked })}
          />
          Modo Foco
        </label>
      </div>
      <p className="aa-state-copy">
        Essas opções mudam apenas a leitura e a edição no dispositivo atual.
        Não alteram nem compartilham o conteúdo do grimório.
      </p>
    </details>
  );
}
