"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { applyTheme } from "./apply-theme";
import { themePresets } from "./presets";
import type { ThemeId, ThemeTokens } from "../tokens/types";

export type ThemePreference = ThemeId | "system";
const THEME_STORAGE_KEY = "academia-arcana:theme-preference";
const PREFERENCE_EVENT = "academia-arcana:theme-change";
const SCHEME_QUERY = "(prefers-color-scheme: light)";

type ThemeContextValue = {
  theme: ThemeId;
  preference: ThemePreference;
  setTheme: (theme: ThemeId) => void;
  setPreference: (preference: ThemePreference) => void;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "system" || (stored !== null && Object.hasOwn(themePresets, stored))) {
      return stored as ThemePreference;
    }
  } catch {
    // Private browsing may deny access to storage.
  }
  return null;
}

function subscribePreference(notify: () => void): () => void {
  window.addEventListener("storage", notify);
  window.addEventListener(PREFERENCE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(PREFERENCE_EVENT, notify);
  };
}

function readSystemLight(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(SCHEME_QUERY).matches);
}

function subscribeSystemLight(notify: () => void): () => void {
  const query = window.matchMedia?.(SCHEME_QUERY);
  if (!query) return () => undefined;
  query.addEventListener?.("change", notify);
  return () => query.removeEventListener?.("change", notify);
}

export function ThemeProvider({
  children,
  initialTheme = "biblioteca-noturna",
  initialPreference,
}: {
  children: ReactNode;
  initialTheme?: ThemeId;
  initialPreference?: ThemePreference;
}) {
  const [manualFallback, setManualFallback] = useState<ThemePreference | null>(null);
  const storedPreference = useSyncExternalStore(subscribePreference, readStoredPreference, () => null);
  const prefersLight = useSyncExternalStore(subscribeSystemLight, readSystemLight, () => false);

  // Server rendering uses the initial preference; external browser state is
  // read after hydration, without synchronous setState calls in effects.
  const preference = manualFallback ?? storedPreference ?? initialPreference ?? initialTheme;
  const theme: ThemeId = preference === "system"
    ? (prefersLight ? "pergaminho-claro" : "biblioteca-noturna")
    : preference;

  const setPreference = useCallback((next: ThemePreference) => {
    setManualFallback(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      window.dispatchEvent(new Event(PREFERENCE_EVENT));
    } catch {
      // In-memory preference still works when persistent storage is blocked.
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    document.documentElement.style.colorScheme = theme === "pergaminho-claro" ? "light" : "dark";
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      setTheme: setPreference,
      setPreference,
      tokens: themePresets[theme],
    }),
    [theme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
