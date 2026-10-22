"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyTheme } from "./apply-theme";
import { themePresets } from "./presets";
import type { ThemeId, ThemeTokens } from "../tokens/types";

export type AppearanceChoice = "system" | "dark" | "light";
type ActiveAppearance = AppearanceChoice | "custom";
const STORAGE_KEY = "academia-arcana.appearance-v1";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  appearance: ActiveAppearance;
  setAppearance: (choice: AppearanceChoice) => void;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme = "mago-classico",
  followSystem = false,
}: {
  children: ReactNode;
  initialTheme?: ThemeId;
  followSystem?: boolean;
}) {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);
  const [appearance, setAppearanceState] = useState<ActiveAppearance>(
    followSystem ? "system" : "custom",
  );

  // Restore only an explicit, validated local choice; no server or student data.
  useEffect(() => {
    if (!followSystem) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light" || stored === "system") {
        setAppearanceState(stored);
      }
    } catch {
      // Storage may be blocked; prefer the device without failing rendering.
    }
  }, [followSystem]);

  useEffect(() => {
    if (!followSystem || appearance === "custom") return;
    const preference = window.matchMedia?.("(prefers-color-scheme: light)");
    const synchronize = () => {
      const light = appearance === "light" ||
        (appearance === "system" && Boolean(preference?.matches));
      setThemeState(light ? "pergaminho-claro" : "mago-classico");
    };
    synchronize();
    if (appearance === "system") {
      preference?.addEventListener?.("change", synchronize);
      return () => preference?.removeEventListener?.("change", synchronize);
    }
  }, [appearance, followSystem]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeId) => {
    setAppearanceState("custom");
    setThemeState(nextTheme);
  }, []);

  const setAppearance = useCallback((choice: AppearanceChoice) => {
    setAppearanceState(choice);
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Theme changes remain available in memory when storage is unavailable.
    }
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
