"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

export const PAGE_PAPER_STYLES = [
  { id: "inherit", label: "Manter aparência atual" },
  { id: "pergaminho-antigo", label: "Pergaminho Antigo" },
  { id: "arcano-escuro", label: "Papel Arcano" },
  { id: "lilas", label: "Lavanda Encantada" },
  { id: "alquimista-antigo", label: "Caderno do Alquimista" },
] as const;

export type PagePaperStyle = (typeof PAGE_PAPER_STYLES)[number]["id"];

const STORE_PREFIX = "academia-arcana.page-paper.v1:";
const CHANGE_EVENT = "academia-arcana:page-paper-changed";
const fallback = new Map<string, PagePaperStyle>();
const blocked = new Set<string>();

export function isPagePaperStyle(value: unknown): value is PagePaperStyle {
  return PAGE_PAPER_STYLES.some((style) => style.id === value);
}

export function pagePaperStorageKey(pageId: string): string {
  return STORE_PREFIX + encodeURIComponent(pageId);
}

function readPagePaper(pageId: string): PagePaperStyle {
  if (typeof window === "undefined") return "inherit";
  const cached = fallback.get(pageId);
  try {
    const saved = window.localStorage.getItem(pagePaperStorageKey(pageId));
    if (isPagePaperStyle(saved)) return saved;
    return blocked.has(pageId) ? cached ?? "inherit" : "inherit";
  } catch {
    return cached ?? "inherit";
  }
}

function subscribe(listener: () => void): () => void {
  const storageListener = (event: StorageEvent) => {
    // External changes to this key supersede any in-session fallback.
    if (event.key?.startsWith(STORE_PREFIX)) {
      // Storage events may contain malformed or unexpected keys from another tab.
      // Ignore those keys rather than interrupting the active student's editor.
      let pageId: string;
      try {
        pageId = decodeURIComponent(event.key.slice(STORE_PREFIX.length));
      } catch {
        return;
      }
      fallback.delete(pageId);
      blocked.delete(pageId);
    }
    listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", storageListener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", storageListener);
  };
}

export function PagePaperStyleView({
  pageId,
  children,
}: {
  pageId: string;
  children: ReactNode;
}) {
  const [storageWarning, setStorageWarning] = useState(false);
  const selected = useSyncExternalStore(
    subscribe,
    () => readPagePaper(pageId),
    () => "inherit" as PagePaperStyle,
  );

  function chooseStyle(value: string) {
    if (!isPagePaperStyle(value)) return;
    fallback.set(pageId, value);
    try {
      window.localStorage.setItem(pagePaperStorageKey(pageId), value);
      blocked.delete(pageId);
      setStorageWarning(false);
    } catch {
      blocked.add(pageId);
      setStorageWarning(true);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div className="workspace-page-editor" data-aa-paper-style={selected}>
      <div className="workspace-paper-controls">
        <label htmlFor="workspace-paper-style">Estilo do papel desta página</label>
        <select
          id="workspace-paper-style"
          className="aa-input"
          value={selected}
          onChange={(event) => chooseStyle(event.target.value)}
        >
          {PAGE_PAPER_STYLES.map((style) => (
            <option value={style.id} key={style.id}>{style.label}</option>
          ))}
        </select>
        <p className="aa-field-description">
          Preferência visual deste dispositivo. O conteúdo e o progresso da página não são modificados.
        </p>
        {storageWarning ? (
          <p role="status">Não foi possível salvar o estilo neste dispositivo; a escolha permanece nesta sessão.</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
