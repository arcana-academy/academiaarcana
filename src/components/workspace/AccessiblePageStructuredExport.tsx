"use client";

import { useState } from "react";
import type { PageContent } from "@/domains/learning";
import { accessibleTextFilename } from "./AccessiblePageTextExport";

/**
 * Portable representation of the current student-authored draft.
 * Retains all original blocks, including decorative media metadata and
 * custom/unknown block types. No file bytes, server state, or owner identity.
 */
export function serializeStructuredPage(title: string, content: PageContent): string {
  return JSON.stringify({
    format: "academia-arcana-page-draft",
    version: 1,
    title,
    content,
  }, null, 2) + "\n";
}

export function structuredPageFilename(title: string): string {
  return accessibleTextFilename(title).replace(/\.txt$/, ".json");
}

/** User-initiated local download. No automatic upload or server save. */
export function AccessiblePageStructuredExport({ title, content }: {
  title: string;
  content: PageContent;
}) {
  const [error, setError] = useState(false);

  const download = () => {
    setError(false);
    let url: string | undefined;
    try {
      const json = serializeStructuredPage(title, content);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = structuredPageFilename(title);
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } catch {
      setError(true);
    } finally {
      if (url) {
        const localURL = url;
        window.setTimeout(() => URL.revokeObjectURL(localURL), 0);
      }
    }
  };

  return (
    <div className="workspace-reading-export-actions">
      <button type="button" onClick={download}>
        Baixar dados estruturados desta página (.json)
      </button>
      <p className="aa-field-description">
        Cópia local do rascunho, preservando texto, tipos de bloco e metadados
        de acessibilidade, inclusive referências e imagens decorativas.
        Não inclui arquivos de mídia nem permite importar automaticamente.
        O arquivo pode conter dados pessoais ou referências privadas: guarde-o
        com cuidado. Não salva ou compartilha sua página no servidor.
      </p>
      {error ? (
        <p role="alert">Não foi possível preparar a cópia estruturada neste navegador.</p>
      ) : null}
    </div>
  );
}
