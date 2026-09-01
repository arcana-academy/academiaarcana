import { themePresets } from "./presets";
import type { ThemeId, ThemePreset } from "../tokens/types";

function toCssVariableName(path: string): string {
  return `--aa-${path.replace(/\./g, "-")}`;
}

function flattenTokenChild(
  child: unknown,
  path: string,
  result: Record<string, string>,
): void {
  if (typeof child === "string") {
    result[toCssVariableName(path)] = child;
    return;
  }

  if (child && typeof child === "object") {
    flattenTokens(child, path, result);
  }
}

function flattenTokens(
  value: unknown,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> {
  if (!value || typeof value !== "object") return result;

  for (const [key, child] of Object.entries(value)) {
    if (key === "id" || key === "name") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    flattenTokenChild(child, path, result);
  }

  return result;
}

export function themeToCssVariables(
  tokens: ThemePreset,
): Record<string, string> {
  return flattenTokens(tokens);
}

export function applyTheme(
  theme: ThemeId,
  element?: HTMLElement,
): ThemePreset {
  const target = element ?? document.documentElement;
  const preset = themePresets[theme];

  for (const [property, value] of Object.entries(
    themeToCssVariables(preset),
  )) {
    target.style.setProperty(property, value);
  }

  target.dataset.theme = theme;
  return preset;
}