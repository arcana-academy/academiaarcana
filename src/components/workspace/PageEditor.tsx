"use client";

import { useState } from "react";
import type { Page, PageContent, PageProgressStatus } from "@/domains/learning";

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

type PageBlocksProps = {
  blocks: PageContent["blocks"];
  blockKeys: string[];
  onChange: (index: number, content: string) => void;
};

/** Render page blocks while keeping block editing separate from PageEditor orchestration. */
function PageBlocks({ blocks, blockKeys, onChange }: PageBlocksProps) {
  return (
    <div aria-label="Blocos da página">
      {blocks.length === 0 ? (
        <p>Esta página ainda não possui conteúdo.</p>
      ) : (
        blocks.map((block, index) => (
          <div key={blockKeys[index]}>
            <label htmlFor={`workspace-page-block-${index}`}>
              Bloco {index + 1}
            </label>
            <textarea
              id={`workspace-page-block-${index}`}
              value={block.content}
              onChange={(event) => onChange(index, event.target.value)}
            />
          </div>
        ))
      )}
    </div>
  );
}

type PageMoveControlsProps = {
  isMoving: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: MovePageDirection) => void;
};

/** Return the accessible label for a page movement action. */
function getMoveLabel(
  isMoving: boolean,
  direction: MovePageDirection,
): string {
  const labels: Record<MovePageDirection, string> = {
    up: "Mover página para cima",
    down: "Mover página para baixo",
  };

  return isMoving ? "Movendo…" : labels[direction];
}

/** Render page ordering controls with boundary and loading states. */
function PageMoveControls({
  isMoving,
  canMoveUp,
  canMoveDown,
  onMove,
}: PageMoveControlsProps) {
  const moveUpDisabled = isMoving || !canMoveUp;
  const moveDownDisabled = isMoving || !canMoveDown;

  return (
    <div aria-label="Ordenação da página">
      <button
        type="button"
        disabled={moveUpDisabled}
        onClick={() => onMove("up")}
      >
        {getMoveLabel(isMoving, "up")}
      </button>
      <button
        type="button"
        disabled={moveDownDisabled}
        onClick={() => onMove("down")}
      >
        {getMoveLabel(isMoving, "down")}
      </button>
    </div>
  );
}

type PageSaveState = "idle" | "saving" | "saved" | "error";

type PageSaveStatusProps = {
  status: PageSaveState;
};

/** Render the current page-save result as a live status message. */
function PageSaveStatus({ status }: PageSaveStatusProps) {
  const messages: Record<PageSaveState, string> = {
    idle: "",
    saving: "",
    saved: "Página salva.",
    error: "Não foi possível salvar a página.",
  };

  return (
    <p role="status" aria-live="polite">
      {messages[status]}
    </p>
  );
}

/** Return the save button label for the current save state. */
function getSaveLabel(status: PageSaveState): string {
  return status === "saving" ? "Salvando…" : "Salvar página";
}

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
  progressStatus?: PageProgressStatus;
  onSetProgress?: (status: PageProgressStatus) => Promise<void>;
};

/** Edit and persist the currently selected learning page. */
export function PageEditor({
  page,
  canMoveUp,
  canMoveDown,
  onMove,
  onDelete,
  onSave,
  progressStatus = "not-started",
  onSetProgress = async () => undefined,
}: PageEditorProps) {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [status, setStatus] = useState<PageSaveState>("idle");
  const [blockKeys, setBlockKeys] = useState(() =>
    page.content.blocks.map((_, index) => `${page.id}:block:${index}`),
  );
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

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

  /** Update one page block while keeping the editor state local. */
  const updateBlock = (index: number, blockContent: string) => {
    const nextBlocks = [...content.blocks];
    nextBlocks[index] = {
      ...nextBlocks[index],
      content: blockContent,
    };
    setContent({ ...content, blocks: nextBlocks });
  };

  /** Persist the learning progress state for the selected page. */
  const updateProgress = async () => {
    setIsUpdatingProgress(true);
    setProgressError(null);

    try {
      await onSetProgress(
        progressStatus === "completed" ? "in-progress" : "completed",
      );
    } catch {
      setProgressError("Não foi possível atualizar o progresso.");
    } finally {
      setIsUpdatingProgress(false);
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

  /** Add a new paragraph block and generate its stable local key. */
  const addBlock = () => {
    setContent({
      ...content,
      blocks: [...content.blocks, { type: "paragraph", content: "" }],
    });
    setBlockKeys((current) => [
      ...current,
      `${page.id}:block:${current.length}`,
    ]);
  };

  return (
    <article aria-label="Editor da página">
      <label htmlFor="workspace-page-title">Título</label>
      <input
        id="workspace-page-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <PageBlocks
        blocks={content.blocks}
        blockKeys={blockKeys}
        onChange={updateBlock}
      />

      <button type="button" onClick={addBlock}>
        Adicionar bloco
      </button>

      <button type="button" disabled={status === "saving"} onClick={save}>
        {getSaveLabel(status)}
      </button>

      <button
        type="button"
        disabled={isUpdatingProgress}
        onClick={updateProgress}
      >
        {isUpdatingProgress
          ? "Atualizando…"
          : progressStatus === "completed"
            ? "Marcar como em andamento"
            : "Concluir página"}
      </button>
      <p role="status" aria-live="polite">
        {progressStatus === "completed"
          ? "Página concluída."
          : progressStatus === "in-progress"
            ? "Página em andamento."
            : "Página ainda não iniciada."}
      </p>
      {progressError ? <p role="alert">{progressError}</p> : null}

      <PageMoveControls
        isMoving={isMoving}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMove={move}
      />
      {moveError ? <p role="alert">{moveError}</p> : null}

      <PageDeleteControl
        pageId={page.id}
        pageTitle={page.title}
        onDelete={onDelete}
      />

      <PageSaveStatus status={status} />
    </article>
  );
}
