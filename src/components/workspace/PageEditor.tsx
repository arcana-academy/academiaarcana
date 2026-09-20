"use client";

import { useState } from "react";
import type { Page, PageContent } from "@/domains/learning";

type PageEditorProps = {
  page: Page;
  onDelete: (id: string) => Promise<void>;
  onSave: (input: {
    id: string;
    title: string;
    content: PageContent;
  }) => Promise<Page>;
};

/** Edit and persist the currently selected learning page. */
export function PageEditor({ page, onDelete, onSave }: PageEditorProps) {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [blockKeys, setBlockKeys] = useState(() =>
    page.content.blocks.map((_, index) => `${page.id}:block:${index}`),
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /** Save the current editor state through the authenticated server action. */
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

  /** Confirm and delete the current page through the authenticated action. */
  const remove = async () => {
    if (!globalThis.confirm(`Excluir a página "${page.title}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDelete(page.id);
    } catch {
      setDeleteError("Não foi possível excluir a página.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article aria-label="Editor da página">
      <label htmlFor="workspace-page-title">Título</label>
      <input
        id="workspace-page-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isDeleting}
      />

      <div aria-label="Blocos da página">
        {content.blocks.length === 0 ? (
          <p>Esta página ainda não possui conteúdo.</p>
        ) : (
          content.blocks
            .map((block, index) => ({ block, key: blockKeys[index] }))
            .map(({ block, key }, index) => (
            <div key={key}>
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
                disabled={isDeleting}
              />
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setContent({
            ...content,
            blocks: [...content.blocks, { type: "paragraph", content: "" }],
          });
          setBlockKeys((current) => [
            ...current,
            `${page.id}:block:${current.length}`,
          ]);
        }}
        disabled={isDeleting}
      >
        Adicionar bloco
      </button>

      <button
        type="button"
        disabled={status === "saving" || isDeleting}
        onClick={save}
      >
        {status === "saving" ? "Salvando…" : "Salvar página"}
      </button>

      <button
        type="button"
        disabled={status === "saving" || isDeleting}
        onClick={remove}
      >
        {isDeleting ? "Excluindo…" : "Excluir página"}
      </button>

      {deleteError ? <p role="alert">{deleteError}</p> : null}

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
