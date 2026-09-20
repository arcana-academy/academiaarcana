"use client";

import { useState } from "react";
import type { Page, PageContent } from "@/domains/learning";

type PageEditorProps = {
  page: Page;
  onSave: (input: {
    id: string;
    title: string;
    content: PageContent;
  }) => Promise<Page>;
};

export function PageEditor({ page, onSave }: PageEditorProps) {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const save = async () => {
    setStatus("saving");

    try {
      const saved = await onSave({
        id: page.id,
        title,
        content,
      });

      setTitle(saved.title);
      setContent(saved.content);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <article aria-label="Editor da página">
      <label htmlFor="workspace-page-title">Título</label>
      <input
        id="workspace-page-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <div aria-label="Blocos da página">
        {content.blocks.length === 0 ? (
          <p>Esta página ainda não possui conteúdo.</p>
        ) : (
          content.blocks.map((block, index) => (
            <div key={index}>
              <label htmlFor={`workspace-page-block-${index}`}>
                Bloco {index + 1}
              </label>
              <textarea
                id={`workspace-page-block-${index}`}
                value={block.content}
                onChange={(event) => {
                  const nextBlocks = [...content.blocks];
                  nextBlocks[index] = {
                    ...block,
                    content: event.target.value,
                  };
                  setContent({ ...content, blocks: nextBlocks });
                }}
              />
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          setContent({
            ...content,
            blocks: [...content.blocks, { type: "paragraph", content: "" }],
          })
        }
      >
        Adicionar bloco
      </button>

      <button type="button" disabled={status === "saving"} onClick={save}>
        {status === "saving" ? "Salvando…" : "Salvar página"}
      </button>

      <p role="status" aria-live="polite">
        {status === "saved"
          ? "Página salva."
          : status === "error"
            ? "Não foi possível salvar a página."
            : null}
      </p>
    </article>
  );
}
