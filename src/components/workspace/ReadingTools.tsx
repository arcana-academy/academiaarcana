"use client";

import { useState } from "react";
import { useReadingPreferences } from "@/application/accessibility-preferences/useReadingPreferences";

/** Accessibility shortcuts near the grimoire editor; never edits page content. */
export function ReadingTools() {
  const [expanded, setExpanded] = useState(false);
  const { reading, storageWarning, updateReading } = useReadingPreferences();

  return (
    <div className="workspace-reading-tools" aria-label="Preferências de leitura do grimório">
      <button
        className="aa-button aa-button-secondary"
        type="button"
        aria-expanded={expanded}
        aria-controls="workspace-reading-tools-controls"
        onClick={() => setExpanded((previous) => !previous)}
      >
        Ajustes de leitura
      </button>
      {expanded ? (
        <div id="workspace-reading-tools-controls" className="workspace-reading-tools-controls">
          <p>Essas opções ajustam sua visualização, sem alterar ou salvar o conteúdo da página.</p>
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
          {storageWarning ? (
            <p role="status">Não foi possível salvar as preferências neste dispositivo.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
