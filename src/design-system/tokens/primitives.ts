/**
 * Internal authoring primitives for the default Academia Arcana theme.
 *
 * These constants are intentionally not a public runtime API. Components and
 * CSS consumers must continue to use ThemeTokens / --aa-* semantic variables.
 */
export const primitiveTokens = {
  color: {
    blackenedViolet: {
      950: "#141219",
      900: "#17151C",
      800: "#211D28",
      700: "#2A2432",
      650: "#30283A",
      600: "#322A3C",
    },
    parchment: {
      100: "#E6DFEC",
      300: "#C2B8C9",
      400: "#A99DB0",
    },
    lavenderGray: {
      400: "#9689A0",
      300: "#A099A8",
    },
    arcaneViolet: {
      100: "#D7C6E6",
      300: "#B9A4CF",
      500: "#8E79A6",
    },
    sage: { 400: "#86B89A" },
    amber: { 400: "#D0B477" },
    rose: { 400: "#CA888E" },
    aether: { 400: "#86A8C4" },
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
    ui: '"Acumin Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: '"Sanvito Pro", Georgia, serif',
    code: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  typeScale: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3.5rem",
  },
  lineHeight: {
    tight: "1.1",
    normal: "1.5",
    relaxed: "1.65",
  },
  shadow: {
    sm: "0 1px 2px rgb(0 0 0 / 0.24)",
    md: "0 8px 24px rgb(0 0 0 / 0.28)",
    lg: "0 14px 36px rgb(0 0 0 / 0.32)",
    floating: "0 18px 48px rgb(0 0 0 / 0.34)",
    modal: "0 24px 72px rgb(0 0 0 / 0.42)",
  },
  motion: {
    fast: "120ms",
    normal: "180ms",
    slow: "280ms",
    reduced: "0ms",
    easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
    easingEmphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  breakpoint: {
    sm: "40rem",
    md: "48rem",
    lg: "64rem",
    xl: "80rem",
  },
  zIndex: {
    base: "0",
    sticky: "20",
    dropdown: "30",
    modal: "40",
    toast: "50",
  },
  opacity: {
    muted: "0.72",
    disabled: "0.56",
    overlay: "0.72",
  },
  density: {
    compact: "0.875",
    comfortable: "1",
  },
  effect: {
    glow: "0 0 0 transparent",
    texture: "none",
  },
} as const;
