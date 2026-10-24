import type { PageContent } from "@/domains/learning";

/** Non-destructive, editable starters for empty student pages only. */
export const PAGE_STARTER_TEMPLATES = [
  { id: "blank", label: "Em branco" },
  { id: "notes", label: "Anotações de estudo" },
  { id: "experiment", label: "Diário de experimentos" },
  { id: "illustrated", label: "Página ilustrada" },
] as const;

export type PageStarterTemplate = (typeof PAGE_STARTER_TEMPLATES)[number]["id"];

export function canApplyStarterTemplate(content: PageContent): boolean {
  return content.blocks.every((block) =>
    block.type === "paragraph" &&
    !block.content.trim() &&
    !block.accessibility?.description?.trim() &&
    !block.accessibility?.decorative,
  );
}

const paragraph = (content: string): PageContent["blocks"][number] => ({ type: "paragraph", content });

export function buildStarterTemplate(style: PageStarterTemplate): PageContent {
  const blocks: PageContent["blocks"] = style === "blank"
    ? []
    : style === "notes"
      ? [paragraph("Tema e objetivo:"), paragraph("Conceitos principais:"), paragraph("Anotações:"), paragraph("Próximas perguntas:")]
      : style === "experiment"
        ? [paragraph("Objetivo do experimento:"), paragraph("Hipótese:"), paragraph("Materiais:"), paragraph("Procedimento:"), paragraph("Observações e resultados:"), paragraph("Conclusão:")]
        : [paragraph("Tema da ilustração:"), { type: "image", content: "" }, paragraph("Legenda, observações e fontes:")];
  return { type: "document", blocks };
}
