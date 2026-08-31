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
  | "romantico";

export type SurfaceTokens = {
  canvas: string;
  panel: string;
  elevated: string;
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
};

export type RadiusTokens = {
  sm: string;
  md: string;
  lg: string;
};

export type SpacingTokens = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
};

export type TypographyTokens = {
  body: string;
  heading: string;
};

export type ShadowTokens = {
  sm: string;
  md: string;
};

export type MotionTokens = {
  duration: string;
  reduced: string;
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
  typography: TypographyTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
};

export type ThemePreset = ThemeTokens & {
  id: ThemeId;
  name: string;
};
