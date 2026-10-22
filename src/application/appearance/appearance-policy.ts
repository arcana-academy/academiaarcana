export type AppearanceMode = "system" | "dark" | "light";

export const APPEARANCE_STORAGE_KEY = "academia-arcana.appearance.v1";

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "system" || value === "dark" || value === "light";
}

export function resolveAppearanceTheme(
  mode: AppearanceMode,
  prefersLight: boolean,
): "arcana-noturna" | "arcana-pergaminho" {
  return mode === "light" || (mode === "system" && prefersLight)
    ? "arcana-pergaminho"
    : "arcana-noturna";
}
