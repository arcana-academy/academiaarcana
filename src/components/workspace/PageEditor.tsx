"use client";

import { useEffect, useRef, useState } from "react";
import type { Page, PageContent, PageProgressStatus } from "@/domains/learning";
import { ReadingToolbar } from "@/components/accessibility/AccessibilityPanel";
import { PAGE_STARTER_TEMPLATES, buildStarterTemplate, canApplyStarterTemplate, type PageStarterTemplate } from "./page-templates";

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
  const launchButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openedOnce = useRef(false);

  useEffect(() => {
    if (isConfirming) {
      openedOnce.current = true;
      if (isDeleting) {
        dialogRef.current?.focus();
      } else {
        cancelButton.current?.focus();
      }
    } else if (openedOnce.current) {
      launchButton.current?.focus();
    }
  }, [isConfirming, isDeleting]);

  // The confirmation is modal for keyboard and assistive-technology users.
  // Escape must work even if focus is moved programmatically outside it.
  useEffect(() => {
    if (!isConfirming) return;

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        event.preventDefault();
        event.stopPropagation();
        setIsConfirming(false);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      const first = cancelButton.current;
      const last = confirmButton.current;
      if (isDeleting) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      if (!dialog || !first || !last) return;
      const outsideDialog = !dialog.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || outsideDialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onDocumentKeyDown, true);
    return () => document.removeEventListener("keydown", onDocumentKeyDown, true);
  }, [isConfirming, isDeleting]);

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
        ref={launchButton}
        onClick={() => setIsConfirming(true)}
      >
        Excluir página
      </button>
    );
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="alertdialog"
      aria-modal="true"
      aria-label="Confirmar exclusão da página"
      aria-describedby="workspace-delete-page-warning"
    >
      <p id="workspace-delete-page-warning">
        Excluir a página &quot;{pageTitle}&quot;? Essa ação não pode ser desfeita.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      <button
        ref={cancelButton}
        type="button"
        disabled={isDeleting}
        onClick={() => setIsConfirming(false)}
      >
        Cancelar
      </button>
      <button
        ref={confirmButton}
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

type PageBlock = PageContent["blocks"][number];
type PageBlocksProps = {
  blocks: PageContent["blocks"];
  blockKeys: string[];
  onChange: (index: number, changes: Partial<PageBlock>) => void;
  onAccessibilityChange: (index: number, changes: NonNullable<PageBlock["accessibility"]>) => void;
};

/** Render page blocks while keeping block editing separate from PageEditor orchestration. */
function PageBlocks({ blocks, blockKeys, onChange, onAccessibilityChange }: PageBlocksProps) {
  return (
    <div aria-label="Blocos da página">
      {blocks.length === 0 ? (
        <p>Esta página ainda não possui conteúdo.</p>
      ) : (
        blocks.map((block, index) => (
          <div key={blockKeys[index]} className="workspace-page-block">
            <label htmlFor={`workspace-page-block-${index}`}>
              Bloco {index + 1}
            </label>
            <textarea
              id={`workspace-page-block-${index}`}
              value={block.content}
              onChange={(event) => onChange(index, { content: event.target.value })}
            />
            <details className="workspace-block-accessibility">
              <summary>Acessibilidade do bloco {index + 1}</summary>
              <label htmlFor={"workspace-block-kind-" + index}>
                Tipo do bloco {index + 1}
              </label>
              <select
                className="aa-input"
                id={"workspace-block-kind-" + index}
                value={block.type}
                onChange={(event) => onChange(index, { type: event.target.value })}
              >
                {!["paragraph", "image", "video", "formula", "diagram"].includes(block.type) ? (
                  <option value={block.type}>Tipo existente: {block.type}</option>
                ) : null}
                <option value="paragraph">Texto</option>
                <option value="image">Imagem — referência textual</option>
                <option value="video">Vídeo — referência textual</option>
                <option value="formula">Fórmula</option>
                <option value="diagram">Diagrama — referência textual</option>
              </select>
              {block.type === "image" ? (
                <label htmlFor={"workspace-block-decorative-" + index}>
                  <input
                    id={"workspace-block-decorative-" + index}
                    type="checkbox"
                    checked={block.accessibility?.decorative === true}
                    onChange={(event) =>
                      onAccessibilityChange(index, {
                        decorative: event.target.checked,
                        ...(event.target.checked ? { description: "" } : {}),
                      })
                    }
                  />
                  Imagem decorativa (sem informação essencial)
                </label>
              ) : null}
              {block.type === "image" && block.accessibility?.decorative ? (
                <p>Imagens decorativas não devem comunicar informações essenciais.</p>
              ) : (
                <>
                  <label htmlFor={"workspace-block-description-" + index}>
                    {block.type === "image"
                      ? "Descrição alternativa"
                      : block.type === "video"
                        ? "Transcrição ou descrição"
                        : block.type === "formula"
                          ? "Leitura da fórmula"
                          : block.type === "diagram"
                            ? "Descrição do diagrama"
                            : "Observação acessível (opcional)"}
                  </label>
                  <textarea
                    id={"workspace-block-description-" + index}
                    value={block.accessibility?.description ?? ""}
                    onChange={(event) =>
                      onAccessibilityChange(index, {
                        description: event.target.value,
                        decorative: false,
                      })
                    }
                  />
                </>
              )}
              {block.type !== "paragraph" ? (
                <p>Os blocos de mídia armazenam referências textuais e alternativas.
                  Este editor ainda não envia nem reproduz arquivos.</p>
              ) : null}
            </details>
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
    saving: "Salvando página…",
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
  const [starter, setStarter] = useState<PageStarterTemplate>("blank");
  const editRevision = useRef(0);
  const [blockKeys, setBlockKeys] = useState(() =>
    page.content.blocks.map((_, index) => `${page.id}:block:${index}`),
  );
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [areStrategiesOpen, setAreStrategiesOpen] = useState(false);

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

  /** Keep block edits local until the authenticated save confirms persistence. */
  const updateBlock = (index: number, changes: Partial<PageBlock>) => {
    editRevision.current += 1;
    setContent((current) => ({
      ...current,
      blocks: current.blocks.map((block, position) =>
        position === index
          ? changes.type && changes.type !== block.type
            ? { ...block, ...changes, accessibility: undefined }
            : { ...block, ...changes }
          : block,
      ),
    }));
    setStatus((current) => current === "saving" ? current : "idle");
  };

  const updateAccessibility = (
    index: number,
    changes: NonNullable<PageBlock["accessibility"]>,
  ) => {
    editRevision.current += 1;
    setContent((current) => ({
      ...current,
      blocks: current.blocks.map((block, position) =>
        position === index
          ? { ...block, accessibility: { ...block.accessibility, ...changes } }
          : block,
      ),
    }));
    setStatus((current) => current === "saving" ? current : "idle");
  };

  /** Only persist progress for saved page content, never for an uncommitted draft. */
  const updateProgress = async () => {
    if (hasUnsavedChanges || status === "saving" || isUpdatingProgress) return;
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
    const revisionAtSave = editRevision.current;

    try {
      const saved = await onSave({
        id: page.id,
        title,
        content,
      });

      if (editRevision.current === revisionAtSave) {
        setTitle(saved.title);
        setContent(saved.content);
        setStatus("saved");
      } else {
        // The user continued editing: never replace newer local text with an
        // older server response or falsely mark the new draft as saved.
        setStatus("idle");
      }
    } catch {
      setStatus("error");
    }
  };

  /** Add a new paragraph block and generate its stable local key. */
  const addBlock = () => {
    editRevision.current += 1;
    setStatus((current) => current === "saving" ? current : "idle");
    setContent({
      ...content,
      blocks: [...content.blocks, { type: "paragraph", content: "" }],
    });
    setBlockKeys((current) => [
      ...current,
      `${page.id}:block:${current.length}`,
    ]);
    setHasUnsavedChanges(true);
    setStatus("idle");
  };

  /** Templates never overwrite authored blocks or save without confirmation. */
  const applyStarter = () => {
    if (status === "saving" || !canApplyStarterTemplate(content)) return;
    editRevision.current += 1;
    const nextContent = buildStarterTemplate(starter);
    setContent(nextContent);
    setBlockKeys(nextContent.blocks.map((_, index) => page.id + ":template:" + index));
    setStatus((current) => current === "saving" ? current : "idle");
  };

  return (
    <article aria-label="Editor da página">
      <label htmlFor="workspace-page-title">Título</label>
      <input
        id="workspace-page-title"
        value={title}
        onChange={(event) => {
          editRevision.current += 1;
          setTitle(event.target.value);
          setStatus((current) => current === "saving" ? current : "idle");
        }}
      />

      <ReadingToolbar />

      <section aria-label="Modelos iniciais de página" className="workspace-page-template-controls">
        <label htmlFor="workspace-page-starter">Modelo inicial</label>
        <select
          id="workspace-page-starter"
          className="aa-input"
          value={starter}
          disabled={!canApplyStarterTemplate(content) || status === "saving"}
          onChange={(event) => setStarter(event.target.value as PageStarterTemplate)}
        >
          {PAGE_STARTER_TEMPLATES.map((choice) => (
            <option key={choice.id} value={choice.id}>{choice.label}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!canApplyStarterTemplate(content) || status === "saving"}
          onClick={applyStarter}
        >Aplicar modelo</button>
        <p className="aa-field-description">
          Disponível somente em páginas vazias. A aplicação prepara um rascunho local;
          use Salvar página para registrar as alterações. O modelo ilustrado cria uma
          referência textual, não envia imagens.
        </p>
      </section>

      <PageBlocks
        blocks={content.blocks}
        blockKeys={blockKeys}
        onChange={updateBlock}
        onAccessibilityChange={updateAccessibility}
      />

      <button type="button" onClick={addBlock} disabled={status === "saving"}>
        Adicionar bloco
      </button>

      <button type="button" disabled={status === "saving"} onClick={save}>
        {getSaveLabel(status)}
      </button>
      <button
        type="button"
        className="aa-button aa-button-secondary"
        disabled={hasUnsavedChanges || status === "saving" || !content.blocks.some((block) => block.content.trim())}
        onClick={() => setIsReading(true)}
      >
        Iniciar leitura guiada
      </button>
      <button
        type="button"
        className="aa-button aa-button-secondary"
        disabled={hasUnsavedChanges || status === "saving" || !content.blocks.some((block) => block.content.trim())}
        onClick={() => setIsChecklistOpen(true)}
      >
        Organizar estudo por trechos
      </button>
      <button
        type="button"
        className="aa-button aa-button-secondary"
        disabled={hasUnsavedChanges || status === "saving" || !content.blocks.some((block) => block.content.trim())}
        onClick={() => setIsGlossaryOpen(true)}
      >
        Criar glossário temporário
      </button>
      <button type="button" className="aa-button aa-button-secondary" onClick={() => setAreStrategiesOpen(true)}>
        Explorar estratégias de estudo
      </button>
      {!content.blocks.some((block) => block.content.trim()) ? (
        <p className="aa-state-copy">Adicione conteúdo a esta página e salve antes de iniciar a leitura.</p>
      ) : null}

      <button
        type="button"
        disabled={isUpdatingProgress || hasUnsavedChanges || status === "saving"}
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
      {hasUnsavedChanges || status === "saving" ? (
        <p role="status">
          Salve as alterações desta página antes de abrir a Prática ou planejar uma missão.
        </p>
      ) : (
        <nav aria-label="Continuar jornada de estudo">
          <ul className="aa-list">
            <li>
              <a href={`/pratica?pagina=${encodeURIComponent(page.id)}`}>
                Praticar este conteúdo
              </a>
            </li>
            <li>
              <a href="/cronograma">Planejar uma tarefa de estudo</a>
            </li>
            <li>
              <a href="/missoes">Ver minhas missões</a>
            </li>
          </ul>
          <p className="aa-state-copy">
            As missões e o XP dependem de eventos de estudo realmente registrados,
            não de abrir a página.
          </p>
        </nav>
      )}
      {hasUnsavedChanges || status === "saving" ? (
        <p className="aa-state-copy">Salve a página antes de atualizar o progresso de estudo.</p>
      ) : null}
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
