import { themePresets } from "./presets";
import type { ThemeId, ThemePreset } from "../tokens/types";

export function toCssVariableName(path: string): string {
  return `--aa-${path.replace(/\./g, "-")}`;
}

export function flattenTokens(value: unknown, prefix = "", result: Record<string, string> = {}) {
  if (!value || typeof value !== "object") return result;

  for (const [key, child] of Object.entries(value)) {
    if (key === "id" || key === "name") continue;
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof child === "string") {
      result[toCssVariableName(path)] = child;
    } else {
      flattenTokens(child, path, result);
    }
  }

  return result;
}

export function themeToCssVariables(tokens: ThemePreset): Record<string, string> {
  return flattenTokens(tokens);
}

export function applyTheme(theme: ThemeId, element?: HTMLElement): ThemePreset {
  const target = element ?? document.documentElement;
  const preset = themePresets[theme];

  for (const [property, value] of Object.entries(themeToCssVariables(preset))) {
    target.style.setProperty(property, value);
  }

  target.dataset.theme = theme;
  return preset;
}
