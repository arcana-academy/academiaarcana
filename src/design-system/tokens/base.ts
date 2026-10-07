import { primitiveTokens as p } from "./primitives";
import type { ThemeTokens } from "./types";

export const baseTokens: ThemeTokens = {
  surfaces: {
    canvas: p.color.blackenedViolet[900],
    panel: p.color.blackenedViolet[800],
    elevated: p.color.blackenedViolet[700],
    floating: p.color.blackenedViolet[650],
    modal: p.color.blackenedViolet[600],
    inset: p.color.blackenedViolet[950],
  },
  text: {
    primary: p.color.parchment[100],
    secondary: p.color.parchment[300],
    muted: p.color.parchment[400],
    inverse: p.color.blackenedViolet[800],
  },
  border: {
    default: p.color.lavenderGray[400],
    strong: p.color.lavenderGray[300],
  },
  accent: {
    primary: p.color.arcaneViolet[300],
    secondary: p.color.arcaneViolet[500],
  },
  status: {
    success: p.color.sage[400],
    warning: p.color.amber[400],
    danger: p.color.rose[400],
    info: p.color.aether[400],
  },
  focus: {
    ring: p.color.arcaneViolet[100],
    width: "3px",
    offset: "3px",
  },
  radius: { ...p.radius },
  spacing: { ...p.spacing },
  sizing: { ...p.sizing },
  typography: {
    body: p.typography.ui,
    heading: p.typography.display,
    display: p.typography.display,
    label: p.typography.ui,
    caption: p.typography.ui,
    code: p.typography.code,
    numeric: p.typography.ui,
  },
  typeScale: { ...p.typeScale },
  lineHeight: { ...p.lineHeight },
  shadows: { ...p.shadow },
  motion: { ...p.motion },
  breakpoints: { ...p.breakpoint },
  zIndex: { ...p.zIndex },
  opacity: { ...p.opacity },
  density: { ...p.density },
  effects: { ...p.effect },
};
