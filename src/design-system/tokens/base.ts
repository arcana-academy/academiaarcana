import type { ThemeTokens } from "./types";

export const baseTokens: ThemeTokens = {
  surfaces: {
    canvas: "#17151C",
    panel: "#211D28",
    elevated: "#2A2432",
    floating: "#30283A",
    modal: "#352C41",
    inset: "#141219",
  },
  text: {
    primary: "#E6DFEC",
    secondary: "#C2B8C9",
    muted: "#A99DB0",
    inverse: "#211D28",
  },
  border: {
    default: "#9689A0",
    strong: "#A099A8",
  },
  accent: {
    primary: "#B9A4CF",
    secondary: "#8E79A6",
  },
  status: {
    success: "#86B89A",
    warning: "#D0B477",
    danger: "#CA888E",
    info: "#86A8C4",
  },
  focus: {
    ring: "#D7C6E6",
    width: "3px",
    offset: "3px",
  },
  radius: {
    sm: "0.375rem",
    md: "0.625rem",
    lg: "0.875rem",
    xl: "1.25rem",
    pill: "999px",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
  },
  sizing: {
    controlSm: "2.25rem",
    controlMd: "2.75rem",
    controlLg: "3.25rem",
    iconSm: "1rem",
    iconMd: "1.25rem",
    iconLg: "1.5rem",
    contentMax: "72rem",
    pageMax: "96rem",
  },
  typography: {
    body: '"Acumin Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: '"Sanvito Pro", Georgia, serif',
    display: '"Sanvito Pro", Georgia, serif',
    label: '"Acumin Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    caption: '"Acumin Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    code: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    numeric: '"Acumin Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
};
