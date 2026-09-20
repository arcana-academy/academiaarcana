"use client";

import { useState } from "react";
import type { Page, PageContent } from "@/domains/learning";

type PageDeleteControlProps = {
  pageId: string;
  pageTitle: string;
  onDelete: (id: string) => Promise<void>;
};

/** Confirm and execute deletion of the selected Workspace page. */
function PageDeleteControl({
  pageId,
  pageTitle,
  onDelete,
}: PageDeleteControlProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Execute the confirmed deletion and report recoverable failures. */
  const remove = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(pageId);
    } catch {
      setError("Não foi possível excluir a página.");
      setIsDeleting(false);
    }
  };

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
      >
        Excluir página
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label="Confirmar exclusão da página">
      <p>
        Excluir a página &quot;{pageTitle}&quot;? Essa ação não pode ser desfeita.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => setIsConfirming(false)}
      >
        Cancelar
      </button>
      <button
        type="button"
        disabled={isDeleting}
        onClick={remove}
      >
        {isDeleting ? "Excluindo…" : "Confirmar exclusão"}
      </button>
    </div>
  );
}

type MovePageDirection = "up" | "down";

type PageEditorProps = {
  page: Page;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: MovePageDirection) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSave: (input: {
    id: string;
    title: string;
    content: PageContent;
  }) => Promise<Page>;
};

/** Edit and persist the currently selected learning page. */
export function PageEditor({
  page,
  canMoveUp,
  canMoveDown,
  onMove,
  onDelete,
  onSave,
}: PageEditorProps) {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [blockKeys, setBlockKeys] = useState(() =>
    page.content.blocks.map((_, index) => `${page.id}:block:${index}`),
  );
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  /** Move the selected page and surface recoverable failures. */
  const move = async (direction: MovePageDirection) => {
    setIsMoving(true);
    setMoveError(null);

    try {
      await onMove(direction);
    } catch {
      setMoveError(
        direction === "up"
          ? "Não foi possível mover a página para cima."
          : "Não foi possível mover a página para baixo.",
      );
    } finally {
      setIsMoving(false);
    }
  };

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
      >
        Adicionar bloco
      </button>

      <button type="button" disabled={status === "saving"} onClick={save}>
        {status === "saving" ? "Salvando…" : "Salvar página"}
      </button>
      <div aria-label="Ordenação da página">
        <button
          type="button"
          disabled={isMoving || !canMoveUp}
          onClick={() => void move("up")}
        >
          {isMoving ? "Movendo…" : "Mover página para cima"}
        </button>
        <button
          type="button"
          disabled={isMoving || !canMoveDown}
          onClick={() => void move("down")}
        >
          {isMoving ? "Movendo…" : "Mover página para baixo"}
        </button>
      </div>
      {moveError ? <p role="alert">{moveError}</p> : null}


      <PageDeleteControl
        pageId={page.id}
        pageTitle={page.title}
        onDelete={onDelete}
      />

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
