"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";

/** Frame choices belong to personal grimoire pages, never institutional UI. */
export const PAGE_FRAME_STYLES = [
  { id: "none", label: "Sem moldura" },
  { id: "medieval", label: "Medieval Clássica" },
  { id: "alchemy", label: "Alquímica e Científica" },
  { id: "ornamental", label: "Artística e Ornamental" },
  { id: "minimal", label: "Sóbria e Elegante" },
] as const;

export type PageFrameStyle = (typeof PAGE_FRAME_STYLES)[number]["id"];
const PREFIX = "academia-arcana.page-frame.v1:";
const EVENT = "academia-arcana:frame-changed";
const sessionFallback = new Map<string, PageFrameStyle>();
const blocked = new Set<string>();

export function isPageFrameStyle(value: unknown): value is PageFrameStyle {
  return PAGE_FRAME_STYLES.some((item) => item.id === value);
}

export function pageFrameStorageKey(pageId: string): string {
  return PREFIX + encodeURIComponent(pageId);
}

function readFrame(pageId: string): PageFrameStyle {
  if (typeof window === "undefined") return "none";
  if (blocked.has(pageId)) return sessionFallback.get(pageId) ?? "none";
  try {
    const persisted = window.localStorage.getItem(pageFrameStorageKey(pageId));
    if (isPageFrameStyle(persisted)) return persisted;
  } catch {
    // Private browsing may disable storage. Session changes still work.
    return sessionFallback.get(pageId) ?? "none";
  }
  return "none";
}

function subscribe(listener: () => void): () => void {
  const storageListener = (event: StorageEvent) => {
    if (event.key?.startsWith(PREFIX)) {
      try {
        const pageId = decodeURIComponent(event.key.slice(PREFIX.length));
        sessionFallback.delete(pageId);
        blocked.delete(pageId);
      } catch {
        return;
      }
    }
    listener();
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", storageListener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", storageListener);
  };
}

/** Presentation only; no page write, media upload, or change of page authorship. */
export function PageFrameStyleView({
  pageId,
  children,
}: {
  pageId: string;
  children: ReactNode;
}) {
  const fieldId = useId();
  const [warningPageId, setWarningPageId] = useState<string | null>(null);
  const storageWarning = warningPageId === pageId;
  const current = useSyncExternalStore(
    subscribe,
    () => readFrame(pageId),
    () => "none" as PageFrameStyle,
  );

  const choose = (style: string) => {
    if (!isPageFrameStyle(style)) return;
    sessionFallback.set(pageId, style);
    try {
      window.localStorage.setItem(pageFrameStorageKey(pageId), style);
      blocked.delete(pageId);
      setWarningPageId(null);
    } catch {
      blocked.add(pageId);
      setWarningPageId(pageId);
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <div className="workspace-page-frame" data-aa-frame-style={current}>
      <div className="workspace-frame-controls">
        <label htmlFor={fieldId}>Moldura desta página</label>
        <select
          id={fieldId}
          className="aa-input"
          value={current}
          onChange={(event) => choose(event.target.value)}
        >
          {PAGE_FRAME_STYLES.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <p className="aa-field-description">
          Moldura opcional do seu grimório, apenas neste dispositivo.
          A aparência institucional e o conteúdo salvo permanecem inalterados.
        </p>
        {storageWarning ? (
          <p role="status">
            A escolha funciona nesta sessão, mas não foi salva neste dispositivo.
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
