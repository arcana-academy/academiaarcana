"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

export type ReadingPreferences = {
  size: "normal" | "large";
  contrast: boolean;
  spacing: boolean;
  focus: boolean;
  font: "default" | "literata";
};

export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  size: "normal",
  contrast: false,
  spacing: false,
  focus: false,
  font: "default",
};

const KEY = "academia-arcana:reading-preferences";
const CHANGE_EVENT = "academia-arcana:reading-preferences-change";

function parsePreferences(raw: string | null): ReadingPreferences {
  if (!raw) return DEFAULT_READING_PREFERENCES;

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return DEFAULT_READING_PREFERENCES;
    const p = value as Record<string, unknown>;
    if (
      (p.size !== "normal" && p.size !== "large") ||
      (p.font !== "default" && p.font !== "literata") ||
      typeof p.contrast !== "boolean" ||
      typeof p.spacing !== "boolean" ||
      typeof p.focus !== "boolean"
    ) return DEFAULT_READING_PREFERENCES;

    return {
      size: p.size,
      font: p.font,
      contrast: p.contrast,
      spacing: p.spacing,
      focus: p.focus,
    };
  } catch {
    return DEFAULT_READING_PREFERENCES;
  }
}

function readSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Lightweight device-local reading settings shared by existing Workspace and
 * Configurações surfaces. Does not touch page content or authenticated storage.
 */
export function useReadingPreferences() {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => null);
  const [memoryFallback, setMemoryFallback] = useState<ReadingPreferences | null>(null);

  const preferences = useMemo(
    () => memoryFallback ?? parsePreferences(raw),
    [memoryFallback, raw],
  );

  const update = useCallback((changes: Partial<ReadingPreferences>) => {
    const next = { ...parsePreferences(readSnapshot()), ...changes };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      setMemoryFallback(null);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Keep accessible controls functional in browsers with blocked storage.
      setMemoryFallback(next);
    }
  }, []);

  return { preferences, update };
}
