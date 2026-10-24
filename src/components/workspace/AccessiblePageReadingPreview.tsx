import type { PageContent } from "@/domains/learning";

type Block = PageContent["blocks"][number];

/**
 * Plain-text reading preview: no HTML injection, external media requests or writes.
 * Media references are not presented as playable/uploaded assets.
 */
const accessibleBlockLabels: Record<string, string> = {
  paragraph: "Texto",
  image: "Imagem — referência textual",
  video: "Vídeo — referência textual",
  formula: "Fórmula — texto",
  diagram: "Diagrama — referência textual",
};

function AccessibleReadingBlock({ block, index }: { block: Block; index: number }) {
  // A genuinely decorative image has no text equivalent in the reading flow.
  if (block.type === "image" && block.accessibility?.decorative === true) {
    return null;
  }

  const title = accessibleBlockLabels[block.type] ?? "Conteúdo textual";
  const description = block.accessibility?.description?.trim();

  return (
    <section className="workspace-reading-preview-block" aria-label={`Bloco ${index + 1}: ${title}`}>
      {block.type !== "paragraph" ? (
        <h4>Bloco {index + 1} — {title}</h4>
      ) : null}
      {block.content ? (
        <p className="workspace-reading-preview-plain">{block.content}</p>
      ) : block.type !== "paragraph" ? (
        <p>Referência ainda não informada.</p>
      ) : null}
      {description ? (
        <p className="workspace-reading-preview-alternative">
          <strong>{block.type === "image"
            ? "Descrição da imagem:"
            : block.type === "video"
              ? "Transcrição ou descrição do vídeo:"
              : block.type === "formula"
                ? "Leitura da fórmula:"
                : block.type === "diagram"
                  ? "Descrição do diagrama:"
                  : "Observação acessível:"}</strong>{" "}
          {description}
        </p>
      ) : block.type !== "paragraph" ? (
        <p className="workspace-reading-preview-missing">
          Alternativa acessível ainda não informada.
        </p>
      ) : null}
    </section>
  );
}

export function AccessiblePageReadingPreview({ content }: { content: PageContent }) {
  return (
    <section className="workspace-reading-preview" aria-label="Leitura estruturada da página">
      <h3>Prévia de leitura — rascunho local</h3>
      <p>Esta prévia apresenta somente texto e alternativas fornecidas pelo autor.
        Não reproduz mídias e não salva alterações.</p>
      {content.blocks.length === 0 ? (
        <p>Esta página ainda não contém blocos de estudo.</p>
      ) : (
        content.blocks.map((block, index) => (
          <AccessibleReadingBlock key={index} block={block} index={index} />
        ))
      )}
    </section>
  );
}
