import { themePresets } from "./presets";
import type { ThemeId, ThemePreset } from "../tokens/types";

function toCssSegment(value: string): string {
  const normalized = value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  return normalized === "breakpoints" ? "breakpoint" : normalized;
}

function toCssVariableName(path: string): string {
  return `--aa-${path.split(".").map(toCssSegment).join("-")}`;
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

export function themeToCssVariables(tokens: ThemePreset): Record<string, string> {
  return flattenTokens(tokens);
}

export function applyTheme(theme: ThemeId, element?: HTMLElement): ThemePreset {
  const target = element ?? document.documentElement;
  const preset = themePresets[theme];

  for (const [property, value] of Object.entries(themeToCssVariables(preset))) {
    target.style.setProperty(property, value);
  }

  // Preserve an explicitly requested contrast enhancement across theme changes.
  if (target.dataset.aaContrast === "high") {
    const light = theme === "pergaminho-claro";
    target.style.setProperty("--aa-text-primary", light ? "#17101D" : "#FFFFFF");
    target.style.setProperty("--aa-text-secondary", light ? "#281D30" : "#F6ECF7");
    target.style.setProperty("--aa-text-muted", light ? "#392A42" : "#DFD3E3");
    target.style.setProperty("--aa-border-default", light ? "#604474" : "#D9C7DF");
    target.style.setProperty("--aa-focus-ring", light ? "#604474" : "#F4D5A5");
  }

  target.dataset.theme = theme;
  target.style.colorScheme = theme === "pergaminho-claro" ? "light" : "dark";
  return preset;
}
