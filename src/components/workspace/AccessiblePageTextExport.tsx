"use client";

import { useState } from "react";
import type { PageContent } from "@/domains/learning";
import {
  readableBlockType,
  isDecorativeReadingBlock,
  readingAlternativeLabel,
} from "./AccessiblePageReadingPreview";

/** Text-only copy of an editable draft; never a file attachment or server write. */
export function serializeAccessiblePageText(title: string, content: PageContent): string {
  const lines: string[] = [
    title.trim() || "Página sem título",
    "",
    "Exportação em texto — rascunho local da Academia Arcana.",
    "Este arquivo não contém mídias; referências e alternativas são somente texto.",
  ];

  if (content.blocks.length === 0) {
    lines.push("", "Esta página ainda não contém blocos de estudo.");
  }

  content.blocks.forEach((block, index) => {
    if (isDecorativeReadingBlock(block)) return;
    lines.push("");
    if (block.type !== "paragraph") {
      lines.push("Bloco " + (index + 1) + " — " + readableBlockType(block.type));
    }
    if (block.content) {
      lines.push(block.content);
    } else if (block.type !== "paragraph") {
      lines.push("Referência ainda não informada.");
    }

    const description = block.accessibility?.description?.trim();
    if (description) {
      lines.push(readingAlternativeLabel(block.type) + " " + description);
    } else if (block.type !== "paragraph") {
      lines.push("Alternativa acessível ainda não informada.");
    }
  });

  return lines.join("\n") + "\n";
}

/** Safe and deterministic device filename; no path separators or control chars. */
export function accessibleTextFilename(title: string): string {
  const stem = title.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return (stem || "pagina-grimorio") + ".txt";
}

export function AccessiblePageTextExport({ title, content }: {
  title: string;
  content: PageContent;
}) {
  const [error, setError] = useState(false);

  const download = () => {
    setError(false);
    let url: string | undefined;
    try {
      const blob = new Blob(
        ["\uFEFF", serializeAccessiblePageText(title, content)],
        { type: "text/plain;charset=utf-8" },
      );
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = accessibleTextFilename(title);
      link.href = url;
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
        Baixar texto acessível desta página (.txt)
      </button>
      <p className="aa-field-description">
        Cópia local do rascunho, com alternativas fornecidas pelo autor.
        Não inclui arquivos multimídia, não compartilha a página e não salva
        alterações no servidor.
      </p>
      {error ? (
        <p role="alert">Não foi possível preparar o arquivo neste navegador.</p>
      ) : null}
    </div>
  );
}
