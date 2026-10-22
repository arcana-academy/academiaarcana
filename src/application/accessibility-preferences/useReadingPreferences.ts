"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "academia-arcana.reading-preferences.v1";
const CHANGE_EVENT = "academia-arcana:reading-preferences-changed";

export type ReadingPreferences = {
  largeText: boolean;
  extraSpacing: boolean;
  highContrast: boolean;
  focusMode: boolean;
};
export type ReadingKey = keyof ReadingPreferences;

export const DEFAULT_READING: ReadingPreferences = {
  largeText: false,
  extraSpacing: false,
  highContrast: false,
  focusMode: false,
};

let fallback: ReadingPreferences = DEFAULT_READING;

export function loadReadingPreferences(): { reading: ReadingPreferences; unavailable: boolean } {
  if (typeof window === "undefined") {
    return { reading: DEFAULT_READING, unavailable: false };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      fallback = DEFAULT_READING;
      return { reading: DEFAULT_READING, unavailable: false };
    }
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { reading: DEFAULT_READING, unavailable: false };
    }
    const values = parsed as Record<string, unknown>;
    return {
      reading: {
        largeText: values.largeText === true,
        extraSpacing: values.extraSpacing === true,
        highContrast: values.highContrast === true,
        focusMode: values.focusMode === true,
      },
      unavailable: false,
    };
  } catch {
    return { reading: fallback, unavailable: true };
  }
}

function applyReadingPreferences(reading: ReadingPreferences) {
  const root = document.documentElement;
  root.dataset.aaTextScale = reading.largeText ? "large" : "normal";
  root.dataset.aaSpacing = reading.extraSpacing ? "wide" : "normal";
  root.dataset.aaContrast = reading.highContrast ? "high" : "normal";
  root.dataset.aaFocusMode = reading.focusMode ? "on" : "off";
}

export function useReadingPreferences() {
  const [initial] = useState(loadReadingPreferences);
  const [reading, setReading] = useState(initial.reading);
  const [storageWarning, setStorageWarning] = useState(initial.unavailable);

  useEffect(() => {
    applyReadingPreferences(reading);
  }, [reading]);

  useEffect(() => {
    const synchronize = () => {
      const current = loadReadingPreferences();
      setReading(current.reading);
      setStorageWarning(current.unavailable);
    };
    window.addEventListener(CHANGE_EVENT, synchronize);
    window.addEventListener("storage", synchronize);
    return () => {
      window.removeEventListener(CHANGE_EVENT, synchronize);
      window.removeEventListener("storage", synchronize);
    };
  }, []);

  function updateReading(key: ReadingKey, checked: boolean) {
    const next = { ...reading, [key]: checked };
    fallback = next;
    setReading(next);
    let unavailable = false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      unavailable = true;
    }
    setStorageWarning(unavailable);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return { reading, storageWarning, updateReading };
}
