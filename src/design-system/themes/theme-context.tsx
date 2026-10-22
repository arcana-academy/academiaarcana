"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyTheme } from "./apply-theme";
import { themePresets } from "./presets";
import type { ThemeId, ThemeTokens } from "../tokens/types";

export type ThemePreference = ThemeId | "system";
const THEME_STORAGE_KEY = "academia-arcana:theme-preference";

type ThemeContextValue = {
  theme: ThemeId;
  preference: ThemePreference;
  setTheme: (theme: ThemeId) => void;
  setPreference: (preference: ThemePreference) => void;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || (value !== null && Object.hasOwn(themePresets, value));
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
  const [preference, setPreference] = useState<ThemePreference>(initialPreference ?? initialTheme);
  const [prefersLight, setPrefersLight] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemePreference(stored)) setPreference(stored);
    } catch {
      // Storage can be disabled. In that case keep the in-memory preference.
    }

    const query = window.matchMedia?.("(prefers-color-scheme: light)");
    if (query) {
      setPrefersLight(query.matches);
      const onChange = (event: MediaQueryListEvent) => setPrefersLight(event.matches);
      query.addEventListener?.("change", onChange);
      setLoaded(true);
      return () => query.removeEventListener?.("change", onChange);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Continue to support in-memory preferences without storage access.
    }
  }, [preference, loaded]);

  const theme: ThemeId = preference === "system"
    ? (prefersLight ? "pergaminho-claro" : "biblioteca-noturna")
    : preference;

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
    [theme, preference],
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
