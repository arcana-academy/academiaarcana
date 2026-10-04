export type ThemeId =
  | "mago-classico"
  | "escuro"
  | "estudioso"
  | "natural"
  | "cinematic"
  | "delicado"
  | "gamer"
  | "cozy-cafe"
  | "noturno"
  | "romantico"
  | "ebullient"
  | "nebula"
  | "solarized"
  | "gruvbox"
  | "poimandres"
  | "kanagawa-paper"
  | "adwaita"
  | "claude-warm"
  | "aura"
  | "nordic"
  | "void"
  | "things"
  | "soft-paper"
  | "minimal-studio"
  | "apple-notes"
  | "macos"
  | "vauxhall"
  | "rose-pine"
  | "material-ocean"
  | "nightfox"
  | "vesper"
  | "brutalist"
  | "retro-windows"
  | "pixel"
  | "cyberglow"
  | "nature"
  | "bamboo"
  | "sacred-geometry"
  | "glass"
  | "paper-light";

export type SurfaceTokens = {
  canvas: string;
  panel: string;
  elevated: string;
  floating: string;
  modal: string;
  inset: string;
};

export type TextTokens = {
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
};

export type BorderTokens = {
  default: string;
  strong: string;
};

export type AccentTokens = {
  primary: string;
  secondary: string;
};

export type StatusTokens = {
  success: string;
  warning: string;
  danger: string;
  info: string;
};

export type FocusTokens = {
  ring: string;
  width: string;
  offset: string;
};

export type RadiusTokens = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  pill: string;
};

export type SpacingTokens = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
};

export type SizingTokens = {
  controlSm: string;
  controlMd: string;
  controlLg: string;
  iconSm: string;
  iconMd: string;
  iconLg: string;
  contentMax: string;
  pageMax: string;
};

export type TypographyTokens = {
  body: string;
  heading: string;
  display: string;
  label: string;
  caption: string;
  code: string;
  numeric: string;
};

export type TypeScaleTokens = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  "4xl": string;
  "5xl": string;
};

export type LineHeightTokens = {
  tight: string;
  normal: string;
  relaxed: string;
};

export type ShadowTokens = {
  sm: string;
  md: string;
  lg: string;
  floating: string;
  modal: string;
};

export type MotionTokens = {
  fast: string;
  normal: string;
  slow: string;
  reduced: string;
  easingStandard: string;
  easingEmphasized: string;
};

export type BreakpointTokens = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

export type ZIndexTokens = {
  base: string;
  sticky: string;
  dropdown: string;
  modal: string;
  toast: string;
};

export type OpacityTokens = {
  muted: string;
  disabled: string;
  overlay: string;
};

export type DensityTokens = {
  compact: string;
  comfortable: string;
};

export type EffectsTokens = {
  glow: string;
  texture: string;
};

export type ThemeTokens = {
  surfaces: SurfaceTokens;
  text: TextTokens;
  border: BorderTokens;
  accent: AccentTokens;
  status: StatusTokens;
  focus: FocusTokens;
  radius: RadiusTokens;
  spacing: SpacingTokens;
  sizing: SizingTokens;
  typography: TypographyTokens;
  typeScale: TypeScaleTokens;
  lineHeight: LineHeightTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
  opacity: OpacityTokens;
  density: DensityTokens;
  effects: EffectsTokens;
};

export type ThemePreset = ThemeTokens & {
  id: ThemeId;
  name: string;
};
