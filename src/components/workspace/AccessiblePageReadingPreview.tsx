import type { PageContent } from "@/domains/learning";
import { accessibleBlockTypeLabel, readingAlternativeLabel } from "./accessible-block-contract";
export { accessibleBlockLabels, readingAlternativeLabel } from "./accessible-block-contract";

type Block = PageContent["blocks"][number];

/**
 * Plain-text reading preview: no HTML injection, external media requests or writes.
 * Media references are not presented as playable/uploaded assets.
 */
export function isDecorativeReadingBlock(block: Block): boolean {
  return block.type === "image" && block.accessibility?.decorative === true;
}

function AccessibleReadingBlock({ block, index }: { block: Block; index: number }) {
  // A genuinely decorative image has no text equivalent in the reading flow.
  if (isDecorativeReadingBlock(block)) {
    return null;
  }

  const title = accessibleBlockTypeLabel(block.type);
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
          <strong>{readingAlternativeLabel(block.type)}</strong>{" "}
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
