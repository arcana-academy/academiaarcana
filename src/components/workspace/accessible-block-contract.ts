import type { PageContent } from "@/domains/learning";

type Block = PageContent["blocks"][number];

/** Vocabulary only: references are plain text, never media embeds or uploads. */
export const KNOWN_BLOCK_TYPES = [
  { id: "paragraph", label: "Texto" },
  { id: "image", label: "Imagem — referência textual" },
  { id: "audio", label: "Áudio — referência textual" },
  { id: "video", label: "Vídeo — referência textual" },
  { id: "formula", label: "Fórmula — texto" },
  { id: "diagram", label: "Diagrama — referência textual" },
] as const;

export const accessibleBlockLabels: Record<string, string> = Object.fromEntries(
  KNOWN_BLOCK_TYPES.map(({ id, label }) => [id, label]),
);

export function isKnownBlockType(type: string): boolean {
  return KNOWN_BLOCK_TYPES.some((entry) => entry.id === type);
}

export function accessibleBlockTypeLabel(type: string): string {
  return Object.prototype.hasOwnProperty.call(accessibleBlockLabels, type)
    ? accessibleBlockLabels[type]
    : "Tipo livre: " + type;
}

export function readingAlternativeLabel(type: string): string {
  switch (type) {
    case "image": return "Descrição da imagem:";
    case "audio": return "Transcrição ou descrição do áudio:";
    case "video": return "Transcrição ou descrição do vídeo:";
    case "formula": return "Leitura da fórmula:";
    case "diagram": return "Descrição do diagrama:";
    case "paragraph": return "Observação acessível:";
    default: return "Descrição acessível do tipo livre:";
  }
}

export function accessibilityFieldLabel(type: string): string {
  switch (type) {
    case "image": return "Descrição alternativa";
    case "audio": return "Transcrição ou descrição do áudio";
    case "video": return "Transcrição ou descrição";
    case "formula": return "Leitura da fórmula";
    case "diagram": return "Descrição do diagrama";
    case "paragraph": return "Observação acessível (opcional)";
    default: return "Descrição acessível do tipo livre";
  }
}

/**
 * Retyping retains user-authored descriptions. An image-only decorative flag
 * cannot leak to audio, formulas, other media, or free types.
 * Users must review the description in its new semantic context.
 */
export function retagBlockPreservingAuthoredDescription(block: Block, type: string): Block {
  if (type === block.type) return block;
  const description = block.accessibility?.description;
  return {
    ...block,
    type,
    accessibility: description?.trim()
      ? { description, decorative: false }
      : undefined,
  };
}
