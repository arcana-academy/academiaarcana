"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "@/design-system/themes";
import type { ThemeId } from "@/design-system/tokens/types";
import {
  APPEARANCE_STORAGE_KEY,
  CUSTOM_THEME_STORAGE_KEY,
  isAppearanceMode,
  isThemeId,
  resolveAppearanceTheme,
  type AppearanceMode,
} from "./appearance-policy";

type AppearanceContextValue = {
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
  selectThemePreset: (theme: ThemeId) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function getSavedCustomTheme(): ThemeId {
  if (typeof window === "undefined") return "mago-classico";
  try {
    const saved = window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    return isThemeId(saved) ? saved : "mago-classico";
  } catch {
    return "mago-classico";
  }
}

function getSavedAppearance(): AppearanceMode {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!isAppearanceMode(saved)) return "system";
    if (saved === "custom") {
      const custom = window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
      if (!isThemeId(custom)) return "system";
    }
    return saved;
  } catch {
    return "system";
  }
}

export function SiteAppearanceProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [appearance, setAppearanceState] = useState<AppearanceMode>(getSavedAppearance);
  const [customTheme, setCustomTheme] = useState<ThemeId>(getSavedCustomTheme);
  const [prefersLight, setPrefersLight] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: light)").matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event: MediaQueryListEvent) => setPrefersLight(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setTheme(resolveAppearanceTheme(appearance, prefersLight, customTheme));
  }, [appearance, prefersLight, customTheme, setTheme]);

  function setAppearance(mode: AppearanceMode) {
    setAppearanceState(mode);
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
    } catch {
      // A preference is optional; the app works without local storage.
    }
  }

  function selectThemePreset(theme: ThemeId) {
    if (theme === "arcana-noturna") {
      setAppearance("dark");
      return;
    }
    if (theme === "arcana-pergaminho") {
      setAppearance("light");
      return;
    }

    setCustomTheme(theme);
    setAppearanceState("custom");
    try {
      window.localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, theme);
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, "custom");
    } catch {
      // Advanced themes remain usable for this session.
    }
  }

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance, selectThemePreset }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useSiteAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useSiteAppearance requer SiteAppearanceProvider");
  return context;
}
