/**
 * Visual overlays only. They do not grant permissions, publish an event,
 * alter learning-state or select a theme automatically.
 */
export const EVENT_THEME_IDS = [
  "halloween-arcano",
  "natal-arcano",
  "ano-novo-arcano",
  "volta-as-aulas",
] as const;

export type EventThemeId = (typeof EVENT_THEME_IDS)[number];

export type EventTheme = Readonly<{
  id: EventThemeId;
  name: string;
  tagline: string;
  description: string;
  motifs: readonly string[];
}>;

export const eventThemes: Readonly<Record<EventThemeId, EventTheme>> = {
  "halloween-arcano": {
    id: "halloween-arcano",
    name: "Halloween Arcano",
    tagline: "Mistério e descoberta",
    description: "Detalhes outonais para experiências especiais de outubro.",
    motifs: ["abóboras", "luas", "folhas"],
  },
  "natal-arcano": {
    id: "natal-arcano",
    name: "Natal Arcano",
    tagline: "Conhecimento que aproxima",
    description: "Luzes e constelações em uma celebração acolhedora.",
    motifs: ["estrelas", "pinheiros", "luzes"],
  },
  "ano-novo-arcano": {
    id: "ano-novo-arcano",
    name: "Ano-Novo Arcano",
    tagline: "Novos ciclos, novas possibilidades",
    description: "Uma ambientação de renovação sem recompensas artificiais.",
    motifs: ["constelações", "ampulhetas", "fogos estilizados"],
  },
  "volta-as-aulas": {
    id: "volta-as-aulas",
    name: "Volta às Aulas",
    tagline: "Recomeçar no seu ritmo",
    description: "Livros e ferramentas de estudo para acolher novas jornadas.",
    motifs: ["grimórios", "mapas", "penas"],
  },
} as const;

export function resolveEventTheme(value: string | null | undefined): EventTheme | null {
  if (!value || !Object.prototype.hasOwnProperty.call(eventThemes, value)) return null;
  return eventThemes[value as EventThemeId];
}
