import type { Page } from "@/domains/learning";

export const COMPARISON_CATALOG_LIMIT = 40;
export const COMPARISON_BLOCK_LIMIT = 8;
export const COMPARISON_BLOCK_CHARS = 700;

export type ConceptComparisonChoice = { id: string; title: string };
export type ConceptComparisonExcerpt = ConceptComparisonChoice & {
  blocks: string[];
  truncated: boolean;
};

/** RLS-visible page identifiers only; never include private page contents in the selector. */
export function buildComparisonChoices(
  pages: readonly ConceptComparisonChoice[],
): ConceptComparisonChoice[] {
  const seen = new Set<string>();
  const options: ConceptComparisonChoice[] = [];
  for (const page of pages) {
    if (
      typeof page.id !== "string" ||
      !page.id.trim() ||
      typeof page.title !== "string" ||
      !page.title.trim() ||
      seen.has(page.id)
    ) continue;
    seen.add(page.id);
    options.push({ id: page.id, title: page.title.trim() });
    if (options.length === COMPARISON_CATALOG_LIMIT) break;
  }
  return options;
}

/**
 * Project saved textual blocks only. Both full-page loads must be guarded by
 * membership in an authenticated user's RLS-visible page catalog.
 */
export function projectComparisonExcerpt(
  page: Page,
  expectedId: string,
): ConceptComparisonExcerpt {
  if (page.id !== expectedId ||
      page.content?.type !== "document" ||
      !Array.isArray(page.content.blocks)) {
    throw new Error("Invalid comparison source.");
  }

  const blocks: string[] = [];
  let truncated = false;
  for (const block of page.content.blocks) {
    if (!block || typeof block.content !== "string") {
      throw new Error("Invalid comparison block.");
    }
    const text = block.content.trim();
    if (!text) continue;
    if (blocks.length >= COMPARISON_BLOCK_LIMIT) {
      truncated = true;
      break;
    }
    blocks.push(text.slice(0, COMPARISON_BLOCK_CHARS));
    if (text.length > COMPARISON_BLOCK_CHARS) truncated = true;
  }
  return { id: page.id, title: page.title, blocks, truncated };
}
