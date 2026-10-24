import { describe, expect, it } from "vitest";
import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";
import {
  MAX_SEQUENCE_BLOCKS, MAX_SEQUENCE_BLOCK_CHARS,
  buildBlockSequence, moveSequenceStep, scoreSequence,
} from "./block-sequencing";

const page: ConceptComparisonExcerpt = {
  id: "owned-page",
  title: "Ciclo da água",
  truncated: false,
  blocks: ["A água evapora e passa ao estado gasoso.", "O vapor condensa e forma nuvens.", "A chuva retorna para rios e oceanos."],
};

describe("block sequencing from persisted owned excerpts", () => {
  it("preserves the original order and never fabricates passages", () => {
    const result = buildBlockSequence(page);
    expect(result).toEqual({
      pageId: "owned-page", title: "Ciclo da água", truncated: false,
      steps: page.blocks.map((text, id) => ({ id, text })),
    });
  });

  it("requires at least two meaningful distinct passages", () => {
    expect(buildBlockSequence({ ...page, blocks: [] })).toBeNull();
    expect(buildBlockSequence({ ...page, blocks: ["Texto curto"] })).toBeNull();
    expect(buildBlockSequence({ ...page, blocks: [page.blocks[0], page.blocks[0].toUpperCase()] })).toBeNull();
    expect(buildBlockSequence({ ...page, blocks: [page.blocks[0], "pequeno", page.blocks[1]] })?.steps).toHaveLength(2);
  });

  it("caps text/quantity and announces truncation without accessing other pages", () => {
    const result = buildBlockSequence({
      ...page,
      blocks: Array.from({ length: 9 }, (_, i) => "Passagem " + i + ": " + "a".repeat(900)),
    });
    expect(result?.steps).toHaveLength(MAX_SEQUENCE_BLOCKS);
    expect(result?.steps.every((step) => step.text.length <= MAX_SEQUENCE_BLOCK_CHARS)).toBe(true);
    expect(result?.truncated).toBe(true);
  });

  it("moves one passage without mutating the original and rejects boundary moves", () => {
    const start = [2, 1, 0];
    expect(moveSequenceStep(start, 1, -1)).toEqual([1, 2, 0]);
    expect(moveSequenceStep(start, 0, -1)).toEqual(start);
    expect(moveSequenceStep(start, 2, 1)).toEqual(start);
    expect(moveSequenceStep(start, -1, 1)).toEqual(start);
    expect(start).toEqual([2, 1, 0]);
  });

  it("counts correct positions only for a complete valid permutation", () => {
    expect(scoreSequence([0, 1, 2], 3)).toBe(3);
    expect(scoreSequence([2, 1, 0], 3)).toBe(1);
    expect(scoreSequence([0, 0, 2], 3)).toBe(0);
    expect(scoreSequence([0, 1], 3)).toBe(0);
    expect(scoreSequence([0, 1, 3], 3)).toBe(0);
  });

  it("rejects malformed source blocks fail-closed", () => {
    expect(buildBlockSequence({ ...page, blocks: [page.blocks[0], null as unknown as string] })).toBeNull();
  });
});
