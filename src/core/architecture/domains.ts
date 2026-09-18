export const CORE_DOMAINS = [
  "identity",
  "context",
  "authorization",
  "learning",
  "planning",
  "gamification",
  "education",
  "social",
  "adaptive",
  "intelligence",
  "flonts",
  "trust",
  "data",
  "sanctuary",
] as const;

export type CoreDomain = (typeof CORE_DOMAINS)[number];
