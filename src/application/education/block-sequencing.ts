import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";

export const MAX_SEQUENCE_BLOCKS = 6;
export const MAX_SEQUENCE_BLOCK_CHARS = 700;

export type SequenceStep = { id: number; text: string };
export type BlockSequenceExercise = {
  pageId: string;
  title: string;
  steps: SequenceStep[];
  truncated: boolean;
};

/**
 * Build an ephemeral ordering exercise exclusively from selected, saved page
 * blocks. The server must verify RLS-visible catalog membership before reading
 * the page; this projector never performs a database write or awards progress.
 */
export function buildBlockSequence(
  page: ConceptComparisonExcerpt,
): BlockSequenceExercise | null {
  const seen = new Set<string>();
  const steps: SequenceStep[] = [];

  for (const raw of page.blocks) {
    if (typeof raw !== "string") return null;
    const text = raw.trim();
    if (text.length < 12) continue;
    const uniqueKey = text.normalize("NFC").toLocaleLowerCase("pt-BR");
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);
    steps.push({ id: steps.length, text: text.slice(0, MAX_SEQUENCE_BLOCK_CHARS) });
    if (steps.length === MAX_SEQUENCE_BLOCKS) break;
  }

  if (steps.length < 2) return null;
  return {
    pageId: page.id,
    title: page.title,
    steps,
    truncated: page.truncated || page.blocks.length > MAX_SEQUENCE_BLOCKS,
  };
}

/** Pure, bounded movement: out-of-range controls do not mutate ordering. */
export function moveSequenceStep(
  order: readonly number[],
  index: number,
  direction: -1 | 1,
): number[] {
  const next = index + direction;
  if (!Number.isInteger(index) || index < 0 || next < 0 || next >= order.length) {
    return [...order];
  }
  const updated = [...order];
  [updated[index], updated[next]] = [updated[next], updated[index]];
  return updated;
}

/** The score is only a temporary self-check, never a mastery signal. */
export function scoreSequence(order: readonly number[], expectedLength: number): number {
  if (!Number.isInteger(expectedLength) || expectedLength < 2 ||
      order.length !== expectedLength ||
      new Set(order).size !== expectedLength ||
      order.some((value) => !Number.isInteger(value) || value < 0 || value >= expectedLength)) {
    return 0;
  }
  return order.filter((value, position) => value === position).length;
}
