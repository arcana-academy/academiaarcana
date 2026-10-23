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

export type AppearanceChoice = "system" | "dark" | "light";
type ActiveAppearance = AppearanceChoice | "custom";
const STORAGE_KEY = "academia-arcana.appearance-v1";
const CHANGE_EVENT = "academia-arcana:appearance-changed";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  appearance: ActiveAppearance;
  setAppearance: (choice: AppearanceChoice) => void;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getAppearance(): AppearanceChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : "system";
  } catch {
    return "system";
  }
}

function subscribeAppearance(notify: () => void): () => void {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

function subscribeDevice(notify: () => void): () => void {
  const query = window.matchMedia?.("(prefers-color-scheme: light)");
  query?.addEventListener?.("change", notify);
  return () => query?.removeEventListener?.("change", notify);
}

function deviceIsLight(): boolean {
  return Boolean(window.matchMedia?.("(prefers-color-scheme: light)")?.matches);
}

function serverAppearance(): AppearanceChoice {
  return "system";
}

function serverDeviceIsLight(): boolean {
  return false;
}

export function ThemeProvider({
  children,
  initialTheme = "mago-classico",
  followSystem = false,
}: {
  children: ReactNode;
  initialTheme?: ThemeId;
  followSystem?: boolean;
}) {
  const savedAppearance = useSyncExternalStore(
    subscribeAppearance, getAppearance, serverAppearance,
  );
  const systemLight = useSyncExternalStore(
    subscribeDevice, deviceIsLight, serverDeviceIsLight,
  );
  const [customTheme, setCustomTheme] = useState<ThemeId>(initialTheme);
  const [customOverride, setCustomOverride] = useState(false);

  const appearance: ActiveAppearance = followSystem && !customOverride
    ? savedAppearance
    : "custom";
  const theme: ThemeId = appearance === "custom"
    ? customTheme
    : appearance === "light" || (appearance === "system" && systemLight)
      ? "pergaminho-claro"
      : "mago-classico";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeId) => {
    setCustomOverride(true);
    setCustomTheme(nextTheme);
  }, []);

  const setAppearance = useCallback((choice: AppearanceChoice) => {
    setCustomOverride(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // A missing storage provider leaves device defaults available.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme, setTheme, appearance, setAppearance, tokens: themePresets[theme],
    }),
    [theme, setTheme, appearance, setAppearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
