import { themePresets } from "./presets";
import type { ThemeId, ThemePreset } from "../tokens/types";

/**
 * Converts a dot-separated path string into a CSS variable name by replacing dots with hyphens and prefixing with "--aa-".
 *
 * @param path - The dot-separated path string to convert.
 * @returns The corresponding CSS variable name.
 */
export function toCssVariableName(path: string): string {
  return `--aa-${path.replace(/\./g, "-")}`;
}

/**
 * Recursively flattens a token child into CSS variable entries by updating the result record.
 *
 * @param child - The token child to flatten; may be a string or nested object of tokens.
 * @param path - The current token path used to generate CSS variable names.
 * @param result - The record object where flattened CSS variables are stored with their string values.
 * @returns void
 */
export function flattenTokenChild(
  child: unknown,
  path: string,
  result: Record<string, string>,
): void {
  const handlers: Record<string, () => void> = {
    string: () => {
      result[toCssVariableName(path)] = child as string;
    },
    object: () => {
      if (child) {
        flattenTokens(child, path, result);
      }
    },
  };

  const handler = handlers[typeof child];
  if (handler) handler();
}

/**
 * Flattens a nested token object into a flat map of token paths to string values.
 *
 * @param value - The token object to flatten, which may be nested.
 * @param prefix - A prefix for the current path, used for recursive calls.
 * @param result - The accumulator object for storing flattened tokens.
 * @returns A record mapping token paths to their string values.
 */
export function flattenTokens(
  value: unknown,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> {
  if (!value || typeof value !== "object") return result;

  Object.entries(value)
    .filter(([key]) => key !== "id" && key !== "name")
    .forEach(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      flattenTokenChild(child, path, result);
    });

  return result;
}

export function themeToCssVariables(tokens: ThemePreset): Record<string, string> {
  return flattenTokens(tokens);
}
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
