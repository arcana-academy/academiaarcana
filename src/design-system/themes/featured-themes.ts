import type { ThemeId } from "../tokens/types";

/**
 * Curated UI names for existing presets, not new token sources.
 * These options are previews until product approval and user testing.
 */
export const FEATURED_THEME_CHOICES = [
  {
    id: "padrao-arcano",
    label: "Padrão Arcano",
    presetId: "mago-classico",
    description: "Equilíbrio entre leitura, magia acadêmica e organização.",
  },
  {
    id: "floresta-arcana",
    label: "Floresta Arcana",
    presetId: "natural",
    description: "Tons naturais para uma experiência de estudo tranquila.",
  },
  {
    id: "aurora-arcana",
    label: "Aurora Arcana",
    presetId: "nebula",
    description: "Azuis e violetas inspirados em observatórios mágicos.",
  },
  {
    id: "luz-arcana",
    label: "Luz Arcana",
    presetId: "paper-light",
    description: "Superfícies claras preservando a hierarquia visual.",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  presetId: ThemeId;
  description: string;
}>;

export type FeaturedThemeChoice = (typeof FEATURED_THEME_CHOICES)[number];
