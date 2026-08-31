import type { ThemeTokens } from "./types";

export const baseTokens: ThemeTokens = {
  surfaces: {
    canvas: "#17151C",
    panel: "#211D28",
    elevated: "#2A2432",
    inset: "#141219",
  },
  text: {
    primary: "#E6DFEC",
    secondary: "#C2B8C9",
    muted: "#A99DB0",
    inverse: "#211D28",
  },
  border: {
    default: "#51475A",
    strong: "#75687F",
  },
  accent: {
    primary: "#B9A4CF",
    secondary: "#8E79A6",
  },
  status: {
    success: "#86B89A",
    warning: "#D0B477",
    danger: "#C8848B",
    info: "#86A8C4",
  },
  focus: {
    ring: "#D7C6E6",
  },
  radius: {
    sm: "0.375rem",
    md: "0.625rem",
    lg: "0.875rem",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
  },
  typography: {
    body: "system-ui, sans-serif",
    heading: "Georgia, serif",
  },
  shadows: {
    sm: "0 1px 2px rgb(0 0 0 / 0.24)",
    md: "0 8px 24px rgb(0 0 0 / 0.28)",
  },
  motion: {
    duration: "180ms",
    reduced: "0ms",
  },
};
