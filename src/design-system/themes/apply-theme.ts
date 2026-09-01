import { themePresets } from "./presets";
import type { ThemeId, ThemePreset } from "../tokens/types";

function toCssVariableName(path: string): string {
  return `--aa-${path.replace(/\./g, "-")}`;
}

function flattenTokens(value: unknown, prefix = "", result: Record<string, string> = {}) {
  if (!value || typeof value !== "object") return result;

  const excludeKeys = new Set(["id", "name"]);
  const handlers: Record<string, (child: any, path: string, result: Record<string, string>) => void> = {
    string: (child, path, result) => {
      result[toCssVariableName(path)] = child;
    },
    object: (child, path, result) => {
      flattenTokens(child, path, result);
    }
  };

  for (const [key, child] of Object.entries(value)) {
    if (excludeKeys.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const type = typeof child;
    (handlers[type] || (() => {}))(child, path, result);
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
