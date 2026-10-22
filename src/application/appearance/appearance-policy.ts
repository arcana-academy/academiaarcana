import { themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";

export type AppearanceMode = "system" | "dark" | "light" | "custom";

export const APPEARANCE_STORAGE_KEY = "academia-arcana.appearance.v1";
export const CUSTOM_THEME_STORAGE_KEY = "academia-arcana.theme-preset.v1";

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "system" || value === "dark" || value === "light" || value === "custom";
}

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(themePresets, value);
}

export function resolveAppearanceTheme(
  mode: AppearanceMode,
  prefersLight: boolean,
  customTheme: ThemeId = "mago-classico",
): ThemeId {
  if (mode === "custom") return customTheme;
  return mode === "light" || (mode === "system" && prefersLight)
    ? "arcana-pergaminho"
    : "arcana-noturna";
}
