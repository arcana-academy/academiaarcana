"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "@/design-system/themes";
import {
  APPEARANCE_STORAGE_KEY,
  isAppearanceMode,
  resolveAppearanceTheme,
  type AppearanceMode,
} from "./appearance-policy";

type AppearanceContextValue = {
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function SiteAppearanceProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [appearance, setAppearanceState] = useState<AppearanceMode>("system");
  const [prefersLight, setPrefersLight] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (isAppearanceMode(saved)) setAppearanceState(saved);
    } catch {
      // A preference is optional; the site remains usable without storage.
    }

    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    setPrefersLight(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersLight(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setTheme(resolveAppearanceTheme(appearance, prefersLight));
  }, [appearance, prefersLight, setTheme]);

  function setAppearance(mode: AppearanceMode) {
    setAppearanceState(mode);
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
    } catch {
      // Do not require storage access to choose an accessible theme.
    }
  }

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useSiteAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useSiteAppearance requer SiteAppearanceProvider");
  return context;
}
