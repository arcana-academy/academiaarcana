import { baseTokens } from "../tokens/base";
import type { ThemeId, ThemePreset, ThemeTokens } from "../tokens/types";

export const THEME_IDS: readonly ThemeId[] = [
  "mago-classico",
  "escuro",
  "estudioso",
  "natural",
  "cinematic",
  "delicado",
  "gamer",
  "cozy-cafe",
  "noturno",
  "romantico",
];

function createPreset(
  id: ThemeId,
  name: string,
  overrides: Partial<ThemeTokens>,
): ThemePreset {
  return {
    ...baseTokens,
    ...overrides,
    surfaces: { ...baseTokens.surfaces, ...overrides.surfaces },
    text: { ...baseTokens.text, ...overrides.text },
    border: { ...baseTokens.border, ...overrides.border },
    accent: { ...baseTokens.accent, ...overrides.accent },
    status: { ...baseTokens.status, ...overrides.status },
    focus: { ...baseTokens.focus, ...overrides.focus },
    radius: { ...baseTokens.radius, ...overrides.radius },
    spacing: { ...baseTokens.spacing, ...overrides.spacing },
    typography: { ...baseTokens.typography, ...overrides.typography },
    shadows: { ...baseTokens.shadows, ...overrides.shadows },
    motion: { ...baseTokens.motion, ...overrides.motion },
    id,
    name,
  };
}

export const themePresets: Record<ThemeId, ThemePreset> = {
  "mago-classico": createPreset("mago-classico", "Mago Clássico", {
    accent: { primary: "#B9A4CF", secondary: "#806A9A" },
  }),
  escuro: createPreset("escuro", "Escuro", {
    surfaces: { canvas: "#101016", panel: "#181820", elevated: "#22222C", inset: "#0C0C11" },
    accent: { primary: "#A89CC0", secondary: "#706685" },
  }),
  estudioso: createPreset("estudioso", "Estudioso", {
    surfaces: { canvas: "#191714", panel: "#25201A", elevated: "#302920", inset: "#14110E" },
    accent: { primary: "#B69A6A", secondary: "#8D744D" },
    typography: { body: "Georgia, serif", heading: "Georgia, serif" },
  }),
  natural: createPreset("natural", "Natural", {
    surfaces: { canvas: "#151B17", panel: "#1D271F", elevated: "#263329", inset: "#101510" },
    accent: { primary: "#91B59A", secondary: "#64866D" },
  }),
  cinematic: createPreset("cinematic", "Cinematic", {
    surfaces: { canvas: "#171619", panel: "#211F24", elevated: "#2C2930", inset: "#121114" },
    accent: { primary: "#B5A1A9", secondary: "#806B74" },
    typography: { body: "system-ui, sans-serif", heading: "Georgia, serif" },
  }),
  delicado: createPreset("delicado", "Delicado", {
    surfaces: { canvas: "#211A21", panel: "#2B222C", elevated: "#382B39", inset: "#191319" },
    text: { primary: "#E8DDE7", secondary: "#C8B9C7", muted: "#AD9BAA", inverse: "#2B222C" },
    accent: { primary: "#C4A6BE", secondary: "#9B7893" },
  }),
  gamer: createPreset("gamer", "Gamer", {
    surfaces: { canvas: "#11171A", panel: "#182125", elevated: "#202C31", inset: "#0C1113" },
    accent: { primary: "#8CB9B1", secondary: "#5F9189" },
    focus: { ring: "#A8D2C9" },
  }),
  "cozy-cafe": createPreset("cozy-cafe", "Cozy Café", {
    surfaces: { canvas: "#211A17", panel: "#2A211D", elevated: "#352923", inset: "#191310" },
    accent: { primary: "#C19A75", secondary: "#967050" },
    typography: { body: "system-ui, sans-serif", heading: "Georgia, serif" },
  }),
  noturno: createPreset("noturno", "Noturno", {
    surfaces: { canvas: "#10141E", panel: "#171D29", elevated: "#202938", inset: "#0B0E15" },
    accent: { primary: "#91A9CF", secondary: "#647CA2" },
    focus: { ring: "#B2C7E6" },
  }),
  romantico: createPreset("romantico", "Romântico", {
    surfaces: { canvas: "#20171D", panel: "#2A1E26", elevated: "#352630", inset: "#181115" },
    accent: { primary: "#C29AA9", secondary: "#986E7F" },
  }),
};
