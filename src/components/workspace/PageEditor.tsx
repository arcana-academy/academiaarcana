"use client";

import { useEffect, useRef, useState } from "react";
import { GuidedPageReading } from "@/components/education/GuidedPageReading";
import { SavedBlockStudyChecklist } from "@/components/education/SavedBlockStudyChecklist";
import { StudyStrategies } from "@/components/education/StudyStrategies";
import { TemporaryStudyGlossary } from "@/components/education/TemporaryStudyGlossary";
import type { Page, PageContent, PageProgressStatus } from "@/domains/learning";
import { ReadingToolbar } from "@/components/accessibility/AccessibilityPanel";
import { AccessiblePageReadingPreview } from "./AccessiblePageReadingPreview";
import { AccessiblePageTextExport } from "./AccessiblePageTextExport";
import { AccessiblePageStructuredExport } from "./AccessiblePageStructuredExport";
import { KNOWN_BLOCK_TYPES, isKnownBlockType, accessibilityFieldLabel, retagBlockPreservingAuthoredDescription } from "./accessible-block-contract";
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
    <div role="group" aria-label="Blocos da página">
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
                {!isKnownBlockType(block.type) ? (
                  <option value={block.type}>Tipo existente: {block.type}</option>
                ) : null}
                {KNOWN_BLOCK_TYPES.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
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
                    {accessibilityFieldLabel(block.type)}
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

type PageSaveState = "idle" | "saving" | "saved" | "error" | "unconfirmed";

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
    unconfirmed: "Salvamento sem confirmação. Seu rascunho continua nesta aba.",
  };

  return (
    <p role="status" aria-live="polite">
      {messages[status]}
    </p>
  );
}

/** Return the save button label for the current save state. */
function getSaveLabel(status: PageSaveState): string {
  return status === "saving" ? "Salvando…" : status === "unconfirmed" ? "Aguardando confirmação…" : "Salvar página";
}

export type WorkspaceDraftState = {
  pageId: string;
  title: string;
  content: PageContent;
  revision: number;
  dirty: boolean;
  saving: boolean;
  /** A learner's manual export acknowledgement, bound to this exact edit revision. */
  recoveryCopyRevision: number | null;
  /** A matched server response is the only evidence of confirmed persistence. */
  saveStatus: PageSaveState;
};

/** Compare the displayed document content, not the server's version or commit order. */
export function matchesConfirmedDraftContent(page: Page, draft: WorkspaceDraftState): boolean {
  return page.id === draft.pageId && page.title === draft.title &&
    JSON.stringify(page.content) === JSON.stringify(draft.content);
}

type PageEditorProps = {
  initialDraft?: WorkspaceDraftState | null;
  onDraftStateChange?: (snapshot: WorkspaceDraftState) => void;
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
  initialDraft,
  onDraftStateChange,
  canMoveUp,
  canMoveDown,
  onMove,
  onDelete,
  onSave,
  progressStatus = "not-started",
  onSetProgress = async () => undefined,
}: PageEditorProps) {
  const samePageDraft = initialDraft?.pageId === page.id ? initialDraft : null;
  const [dismissedConflictRevision, setDismissedConflictRevision] = useState<number | null>(null);
  const savedSnapshotDiverges = Boolean(
    samePageDraft && samePageDraft.saveStatus === "saved" &&
    !samePageDraft.dirty && !samePageDraft.saving &&
    dismissedConflictRevision !== samePageDraft.revision &&
    !matchesConfirmedDraftContent(page, samePageDraft),
  );
  // Never install an older confirmed snapshot over a different server document.
  const restored = savedSnapshotDiverges ? null : samePageDraft;
  const [title, setTitle] = useState(restored?.title ?? page.title);
  const [content, setContent] = useState(restored?.content ?? page.content);
  const [status, setStatus] = useState<PageSaveState>(
    restored?.saving ? "unconfirmed" : restored?.saveStatus ?? "idle",
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(restored?.dirty ?? false);
  const [recoveryCopyRevision, setRecoveryCopyRevision] = useState<number | null>(
    restored?.recoveryCopyRevision ?? null,
  );
  const [starter, setStarter] = useState<PageStarterTemplate>("blank");
  // Preserve monotonic revisions even when a confirmed snapshot is held for review.
  const editRevision = useRef(samePageDraft?.revision ?? 0);
  const titleValue = useRef(title);
  const contentValue = useRef(content);
  const dirtyValue = useRef(restored?.dirty ?? false);
  const savingValue = useRef(restored?.saving ?? false);
  const saveStatusValue = useRef<PageSaveState>(status);
  const recoveryCopyRevisionValue = useRef<number | null>(recoveryCopyRevision);
  const changeSaveStatus = (next: PageSaveState) => {
    saveStatusValue.current = next;
    setStatus(next);
  };
  const saveIsPending = status === "saving" || status === "unconfirmed";
  const markEdited = () => {
    editRevision.current += 1;
    recoveryCopyRevisionValue.current = null;
    setRecoveryCopyRevision(null);
  };
  const [blockKeys, setBlockKeys] = useState(() =>
    (restored?.content ?? page.content).blocks.map((_, index) => page.id + ":block:" + index),
  );
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [areStrategiesOpen, setAreStrategiesOpen] = useState(false);

  /** Publish draft revisions before navigation can unmount the editor. */
  const publishDraft = () => {
    onDraftStateChange?.({
      pageId: page.id,
      title: titleValue.current,
      content: contentValue.current,
      revision: editRevision.current,
      dirty: dirtyValue.current,
      saving: savingValue.current,
      recoveryCopyRevision: recoveryCopyRevisionValue.current,
      saveStatus: saveStatusValue.current,
    });
  };

  /** Record the learner's explicit declaration for the exact current revision. */
  const confirmRecoveryCopy = () => {
    if (!saveIsPending) return;
    recoveryCopyRevisionValue.current = editRevision.current;
    setRecoveryCopyRevision(editRevision.current);
    publishDraft();
  };

  /** Never infer persistence from a missing snapshot or a remount. */
  useEffect(() => {
    if (!initialDraft || initialDraft.pageId !== page.id || savedSnapshotDiverges) return;
    if (initialDraft.saveStatus === "saved" &&
        dismissedConflictRevision === initialDraft.revision) return;
    if (initialDraft.revision < editRevision.current) return;

    const newerRevision = initialDraft.revision > editRevision.current;
    const confirmedRevision = !initialDraft.saving && !initialDraft.dirty &&
      initialDraft.saveStatus === "saved";
    if (newerRevision || confirmedRevision) {
      editRevision.current = initialDraft.revision;
      titleValue.current = initialDraft.title;
      contentValue.current = initialDraft.content;
      dirtyValue.current = initialDraft.dirty;
      recoveryCopyRevisionValue.current = initialDraft.recoveryCopyRevision;
      setRecoveryCopyRevision(initialDraft.recoveryCopyRevision);
      setTitle(initialDraft.title);
      setContent(initialDraft.content);
      setBlockKeys(initialDraft.content.blocks.map((_, index) => page.id + ":restored:" + index));
      setHasUnsavedChanges(initialDraft.dirty);
    }

    // When remounted, a pending request has no confirmed result in this editor.
    const nextStatus: PageSaveState = initialDraft.saving
      ? saveStatusValue.current === "saving" ? "saving" : "unconfirmed"
      : initialDraft.saveStatus;
    if (savingValue.current !== initialDraft.saving ||
        saveStatusValue.current !== nextStatus) {
      savingValue.current = initialDraft.saving;
      saveStatusValue.current = nextStatus;
      setStatus(nextStatus);
    }

    // The editor, not its parent, acknowledges consumption of a confirmed
    // snapshot. Never consume it when the loaded content differs.
    if (confirmedRevision && matchesConfirmedDraftContent(page, initialDraft)) {
      onDraftStateChange?.({ ...initialDraft, saveStatus: "idle" });
    }
  }, [initialDraft, page, savedSnapshotDiverges, dismissedConflictRevision, onDraftStateChange]);

  /** Explicitly discard the old local copy only after a learner decision. */
  const acceptLoadedVersion = () => {
    if (!samePageDraft || !savedSnapshotDiverges) return;
    if (!window.confirm(
      "A cópia local anterior é diferente da página carregada. Exporte-a antes, se necessário. Descartar essa cópia e continuar com a página carregada?",
    )) return;

    editRevision.current = Math.max(editRevision.current, samePageDraft.revision) + 1;
    recoveryCopyRevisionValue.current = null;
    setRecoveryCopyRevision(null);
    titleValue.current = page.title;
    contentValue.current = page.content;
    dirtyValue.current = false;
    savingValue.current = false;
    setTitle(page.title);
    setContent(page.content);
    setBlockKeys(page.content.blocks.map((_, index) => page.id + ":loaded:" + index));
    setHasUnsavedChanges(false);
    changeSaveStatus("idle");
    publishDraft();
    setDismissedConflictRevision(samePageDraft.revision);
  };

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
    markEdited();
    const nextContent = {
      ...contentValue.current,
      blocks: contentValue.current.blocks.map((block, position) =>
        position === index
          ? changes.type && changes.type !== block.type
            ? { ...retagBlockPreservingAuthoredDescription(block, changes.type), ...changes }
            : { ...block, ...changes }
          : block,
      ),
    };
    contentValue.current = nextContent;
    dirtyValue.current = true;
    setContent(nextContent);
    setHasUnsavedChanges(true);
    if (!savingValue.current) changeSaveStatus("idle");
    publishDraft();
  };

  const updateAccessibility = (
    index: number,
    changes: NonNullable<PageBlock["accessibility"]>,
  ) => {
    markEdited();
    const nextContent = {
      ...contentValue.current,
      blocks: contentValue.current.blocks.map((block, position) =>
        position === index
          ? { ...block, accessibility: { ...block.accessibility, ...changes } }
          : block,
      ),
    };
    contentValue.current = nextContent;
    dirtyValue.current = true;
    setContent(nextContent);
    setHasUnsavedChanges(true);
    if (!savingValue.current) changeSaveStatus("idle");
    publishDraft();
  };

  /** Only persist progress for saved page content, never for an uncommitted draft. */
  const updateProgress = async () => {
    if (hasUnsavedChanges || saveIsPending || isUpdatingProgress) return;
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
    if (savingValue.current) return;
    savingValue.current = true;
    changeSaveStatus("saving");
    publishDraft();
    const revisionAtSave = editRevision.current;

    try {
      const saved = await onSave({
        id: page.id,
        title: titleValue.current,
        content: contentValue.current,
      });
      savingValue.current = false;
      if (editRevision.current === revisionAtSave) {
        titleValue.current = saved.title;
        contentValue.current = saved.content;
        dirtyValue.current = false;
        setTitle(saved.title);
        setContent(saved.content);
        setHasUnsavedChanges(false);
        changeSaveStatus("saved");
      } else {
        dirtyValue.current = true;
        changeSaveStatus("idle");
      }
      publishDraft();
    } catch {
      savingValue.current = false;
      dirtyValue.current = true;
      setHasUnsavedChanges(true);
      changeSaveStatus("error");
      publishDraft();
    }
  };

  /** Add a new paragraph block and generate its stable local key. */
  const addBlock = () => {
    markEdited();
    const nextContent = {
      ...contentValue.current,
      blocks: [...contentValue.current.blocks, { type: "paragraph", content: "" }],
    };
    contentValue.current = nextContent;
    dirtyValue.current = true;
    setContent(nextContent);
    setBlockKeys((current) => [...current, page.id + ":block:" + current.length]);
    setHasUnsavedChanges(true);
    if (!savingValue.current) changeSaveStatus("idle");
    publishDraft();
  };

  /** Templates never overwrite authored blocks or save without confirmation. */
  const applyStarter = () => {
    if (saveIsPending || !canApplyStarterTemplate(content)) return;
    markEdited();
    const nextContent = buildStarterTemplate(starter);
    contentValue.current = nextContent;
    dirtyValue.current = true;
    setContent(nextContent);
    setHasUnsavedChanges(true);
    setBlockKeys(nextContent.blocks.map((_, index) => page.id + ":template:" + index));
    if (!savingValue.current) changeSaveStatus("idle");
    publishDraft();
  };

  if (areStrategiesOpen) {
    return <StudyStrategies onClose={() => setAreStrategiesOpen(false)} />;
  }

  if (isGlossaryOpen) {
    return (
      <TemporaryStudyGlossary
        title={title}
        onClose={() => setIsGlossaryOpen(false)}
      />
    );
  }

  if (isChecklistOpen) {
    return (
      <SavedBlockStudyChecklist
        title={title}
        blocks={content.blocks}
        onClose={() => setIsChecklistOpen(false)}
      />
    );
  }

  if (isReading) {
    return (
      <GuidedPageReading
        title={title}
        blocks={content.blocks}
        onClose={() => setIsReading(false)}
      />
    );
  }

  if (savedSnapshotDiverges && samePageDraft) {
    return (
      <article aria-label="Editor da página">
        <h2>Revisar versões da página</h2>
        <p role="alert">
          A cópia local de um salvamento anterior difere da página carregada.
          Nenhuma versão foi substituída. Compare e exporte as duas cópias antes
          de escolher qual conservar. O estado da gravação remota não pode ser
          deduzido apenas desta comparação.
        </p>
        <section aria-label="Versão carregada">
          <h3>Versão carregada: {page.title}</h3>
          <AccessiblePageTextExport title={page.title} content={page.content} />
          <AccessiblePageStructuredExport title={page.title} content={page.content} />
        </section>
        <section aria-label="Cópia local anterior">
          <h3>Cópia local anterior: {samePageDraft.title}</h3>
          <AccessiblePageTextExport title={samePageDraft.title} content={samePageDraft.content} />
          <AccessiblePageStructuredExport title={samePageDraft.title} content={samePageDraft.content} />
        </section>
        <button type="button" onClick={acceptLoadedVersion}>
          Descartar cópia local anterior e usar versão carregada
        </button>
      </article>
    );
  }

  return (
    <article aria-label="Editor da página">
      <label htmlFor="workspace-page-title">Título</label>
      <input
        id="workspace-page-title"
        value={title}
        onChange={(event) => {
          markEdited();
          titleValue.current = event.target.value;
          dirtyValue.current = true;
          setHasUnsavedChanges(true);
          setTitle(event.target.value);
          if (!savingValue.current) changeSaveStatus("idle");
          publishDraft();
        }}
      />

      <ReadingToolbar />

      <section aria-label="Modelos iniciais de página" className="workspace-page-template-controls">
        <label htmlFor="workspace-page-starter">Modelo inicial</label>
        <select
          id="workspace-page-starter"
          className="aa-input"
          value={starter}
          disabled={!canApplyStarterTemplate(content) || saveIsPending}
          onChange={(event) => setStarter(event.target.value as PageStarterTemplate)}
        >
          {PAGE_STARTER_TEMPLATES.map((choice) => (
            <option key={choice.id} value={choice.id}>{choice.label}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!canApplyStarterTemplate(content) || saveIsPending}
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

      <details className="workspace-reading-preview-disclosure">
        <summary>Ver prévia de leitura acessível (rascunho local)</summary>
        <AccessiblePageReadingPreview content={content} />
      </details>
      <AccessiblePageTextExport title={title} content={content} />
      <AccessiblePageStructuredExport title={title} content={content} />
      {saveIsPending ? (
        <section aria-label="Recuperação manual do rascunho">
          <p role="status" className="aa-state-copy">
            O resultado do salvamento ainda não foi confirmado. Baixe uma cópia
            .txt ou .json acima antes de autorizar uma troca de página dentro do
            Workspace. Não feche esta aba: a operação original continua pendente
            e nenhum novo salvamento será iniciado.
          </p>
          {recoveryCopyRevision === editRevision.current ? (
            <p role="status">
              Você confirmou a cópia manual da revisão {recoveryCopyRevision}.
              Uma segunda confirmação será solicitada antes de trocar de página.
            </p>
          ) : (
            <button type="button" onClick={confirmRecoveryCopy}>
              Confirmo que já baixei uma cópia TXT ou JSON desta revisão
            </button>
          )}
        </section>
      ) : null}

      <button type="button" onClick={addBlock}>
        Adicionar bloco
      </button>

      <button type="button" disabled={saveIsPending} onClick={save}>
        {getSaveLabel(status)}
      </button>
      <button
        type="button"
        className="aa-button aa-button-secondary"
        disabled={hasUnsavedChanges || saveIsPending || !content.blocks.some((block) => block.content.trim())}
        onClick={() => setIsReading(true)}
      >
        Iniciar leitura guiada
      </button>
      <button
        type="button"
        className="aa-button aa-button-secondary"
        disabled={hasUnsavedChanges || saveIsPending || !content.blocks.some((block) => block.content.trim())}
        onClick={() => setIsChecklistOpen(true)}
      >
        Organizar estudo por trechos
      </button>
      <button
        type="button"
        className="aa-button aa-button-secondary"
        disabled={hasUnsavedChanges || saveIsPending || !content.blocks.some((block) => block.content.trim())}
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
        disabled={isUpdatingProgress || hasUnsavedChanges || saveIsPending}
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
      {hasUnsavedChanges || saveIsPending ? (
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
      {hasUnsavedChanges || saveIsPending ? (
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
