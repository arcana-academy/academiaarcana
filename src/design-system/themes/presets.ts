import { baseTokens } from "../tokens/base";
import type { ThemeId, ThemePreset, ThemeTokens } from "../tokens/types";

export const THEME_IDS: readonly ThemeId[] = [
  "mago-classico", "escuro", "estudioso", "natural", "cinematic", "delicado", "gamer", "cozy-cafe", "noturno", "romantico",
  "ebullient", "nebula", "solarized", "gruvbox", "poimandres", "kanagawa-paper", "adwaita", "claude-warm", "aura", "nordic", "void", "things", "soft-paper",
];

function createPreset(id: ThemeId, name: string, overrides: Partial<ThemeTokens>): ThemePreset {
  return {
    ...baseTokens, ...overrides,
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
    density: { ...baseTokens.density, ...overrides.density },
    effects: { ...baseTokens.effects, ...overrides.effects },
    id, name,
  };
}

export const themePresets: Record<ThemeId, ThemePreset> = {
  "mago-classico": createPreset("mago-classico", "Mago Clássico", { accent: { primary: "#B9A4CF", secondary: "#806A9A" } }),
  escuro: createPreset("escuro", "Escuro", { surfaces: { canvas: "#101016", panel: "#181820", elevated: "#22222C", inset: "#0C0C11" }, accent: { primary: "#A89CC0", secondary: "#706685" } }),
  estudioso: createPreset("estudioso", "Estudioso", { surfaces: { canvas: "#191714", panel: "#25201A", elevated: "#302920", inset: "#14110E" }, accent: { primary: "#B69A6A", secondary: "#8D744D" }, typography: { body: "Georgia, serif", heading: "Georgia, serif" } }),
  natural: createPreset("natural", "Natural", { surfaces: { canvas: "#151B17", panel: "#1D271F", elevated: "#263329", inset: "#101510" }, accent: { primary: "#91B59A", secondary: "#64866D" } }),
  cinematic: createPreset("cinematic", "Cinematic", { surfaces: { canvas: "#171619", panel: "#211F24", elevated: "#2C2930", inset: "#121114" }, accent: { primary: "#B5A1A9", secondary: "#806B74" }, typography: { body: "system-ui, sans-serif", heading: "Georgia, serif" } }),
  delicado: createPreset("delicado", "Delicado", { surfaces: { canvas: "#211A21", panel: "#2B222C", elevated: "#382B39", inset: "#191319" }, text: { primary: "#E8DDE7", secondary: "#C8B9C7", muted: "#AD9BAA", inverse: "#2B222C" }, accent: { primary: "#C4A6BE", secondary: "#9B7893" } }),
  gamer: createPreset("gamer", "Gamer", { surfaces: { canvas: "#11171A", panel: "#182125", elevated: "#202C31", inset: "#0C1113" }, accent: { primary: "#8CB9B1", secondary: "#5F9189" }, focus: { ring: "#A8D2C9" } }),
  "cozy-cafe": createPreset("cozy-cafe", "Cozy Café", { surfaces: { canvas: "#211A17", panel: "#2A211D", elevated: "#352923", inset: "#191310" }, accent: { primary: "#C19A75", secondary: "#967050" }, typography: { body: "system-ui, sans-serif", heading: "Georgia, serif" } }),
  noturno: createPreset("noturno", "Noturno", { surfaces: { canvas: "#10141E", panel: "#171D29", elevated: "#202938", inset: "#0B0E15" }, accent: { primary: "#91A9CF", secondary: "#647CA2" }, focus: { ring: "#B2C7E6" } }),
  romantico: createPreset("romantico", "Romântico", { surfaces: { canvas: "#20171D", panel: "#2A1E26", elevated: "#352630", inset: "#181115" }, accent: { primary: "#C29AA9", secondary: "#986E7F" } }),
  ebullient: createPreset("ebullient", "Ebullient", { surfaces: { canvas: "#171514", panel: "#211D1A", elevated: "#2C2621", inset: "#12100F" }, accent: { primary: "#D0A36A", secondary: "#9D7448" }, typography: { body: "system-ui, sans-serif", heading: "Georgia, serif" }, effects: { glow: "0 0 18px rgb(208 163 106 / 0.14)", texture: "subtle-paper" } }),
  nebula: createPreset("nebula", "Nebula", { surfaces: { canvas: "#121421", panel: "#1B1C2D", elevated: "#26253B", inset: "#0D0F18" }, accent: { primary: "#9C92D8", secondary: "#7066A9" }, focus: { ring: "#BDB5EA" }, effects: { glow: "0 0 20px rgb(156 146 216 / 0.16)", texture: "none" } }),
  solarized: createPreset("solarized", "Solarized", { surfaces: { canvas: "#17262A", panel: "#203438", elevated: "#294247", inset: "#102023" }, text: { primary: "#D6D1C4", secondary: "#B8B5A9", muted: "#92968E", inverse: "#203438" }, accent: { primary: "#82AEB0", secondary: "#5E8E91" } }),
  gruvbox: createPreset("gruvbox", "Gruvbox", { surfaces: { canvas: "#1D2021", panel: "#282828", elevated: "#32302F", inset: "#141617" }, text: { primary: "#EBDBB2", secondary: "#C9B98F", muted: "#A89984", inverse: "#282828" }, accent: { primary: "#D79921", secondary: "#B57614" }, status: { success: "#98971A", warning: "#D79921", danger: "#CC241D", info: "#458588" } }),
  poimandres: createPreset("poimandres", "Poimandres", { surfaces: { canvas: "#171A25", panel: "#1E2230", elevated: "#282D3E", inset: "#10121A" }, text: { primary: "#D4D7E2", secondary: "#A9AFC0", muted: "#82899E", inverse: "#1E2230" }, accent: { primary: "#A7ACF2", secondary: "#777CCF" }, focus: { ring: "#C0C4FF" } }),
  "kanagawa-paper": createPreset("kanagawa-paper", "Kanagawa Paper", { surfaces: { canvas: "#25221E", panel: "#302C27", elevated: "#3B352E", inset: "#1B1917" }, text: { primary: "#DCD4C4", secondary: "#BBB19F", muted: "#958C7D", inverse: "#302C27" }, accent: { primary: "#C6A46C", secondary: "#95764A" }, typography: { body: "Georgia, serif", heading: "Georgia, serif" }, effects: { glow: "none", texture: "paper" } }),
  adwaita: createPreset("adwaita", "Adwaita", { surfaces: { canvas: "#1D2024", panel: "#25292E", elevated: "#30353B", inset: "#15181B" }, text: { primary: "#D9DEE5", secondary: "#B3BAC4", muted: "#8C949F", inverse: "#25292E" }, accent: { primary: "#78AEED", secondary: "#528BD0" }, radius: { sm: "0.375rem", md: "0.625rem", lg: "0.75rem" } }),
  "claude-warm": createPreset("claude-warm", "Claude Warm", { surfaces: { canvas: "#211D1A", panel: "#2B2520", elevated: "#382F27", inset: "#171310" }, text: { primary: "#E7D9C8", secondary: "#C9B9A6", muted: "#A49381", inverse: "#2B2520" }, accent: { primary: "#D49A72", secondary: "#A96F4D" }, typography: { body: "system-ui, sans-serif", heading: "Georgia, serif" } }),
  aura: createPreset("aura", "Aura", { surfaces: { canvas: "#15151D", panel: "#1F1E2A", elevated: "#2A2838", inset: "#0E0E14" }, text: { primary: "#DAD7E8", secondary: "#B4B0C8", muted: "#8F8AA8", inverse: "#1F1E2A" }, accent: { primary: "#A277FF", secondary: "#7654C9" }, effects: { glow: "0 0 20px rgb(162 119 255 / 0.16)", texture: "none" } }),
  nordic: createPreset("nordic", "Nordic", { surfaces: { canvas: "#171C21", panel: "#20282F", elevated: "#29333B", inset: "#101419" }, text: { primary: "#D6DEE5", secondary: "#B0BAC3", muted: "#89949E", inverse: "#20282F" }, accent: { primary: "#88AFC5", secondary: "#628A9F" }, focus: { ring: "#A9C7D8" } }),
  void: createPreset("void", "Void", { surfaces: { canvas: "#0A0A0D", panel: "#101014", elevated: "#18181E", inset: "#050507" }, text: { primary: "#D2D0D8", secondary: "#AAA7B2", muted: "#85818F", inverse: "#101014" }, border: { default: "#302F38", strong: "#4B4955" }, accent: { primary: "#B0A4D8", secondary: "#8175A9" }, shadows: { sm: "0 1px 2px rgb(0 0 0 / 0.45)", md: "0 10px 30px rgb(0 0 0 / 0.5)" } }),
  things: createPreset("things", "Things", { surfaces: { canvas: "#181A1D", panel: "#202328", elevated: "#292D33", inset: "#111316" }, text: { primary: "#DCE0E5", secondary: "#B4BAC2", muted: "#8E959E", inverse: "#202328" }, accent: { primary: "#6DA6E8", secondary: "#4F80B8" }, radius: { sm: "0.5rem", md: "0.75rem", lg: "1rem" }, density: { compact: "0.8", comfortable: "0.95" } }),
  "soft-paper": createPreset("soft-paper", "Soft Paper", { surfaces: { canvas: "#292824", panel: "#34322C", elevated: "#403D35", inset: "#201F1B" }, text: { primary: "#E1D9C8", secondary: "#C2BAA9", muted: "#9D9585", inverse: "#34322C" }, accent: { primary: "#B7A27A", secondary: "#8D7957" }, typography: { body: "Georgia, serif", heading: "Georgia, serif" }, effects: { glow: "none", texture: "soft-paper" } }),
};
