import { describe, expect, it } from "vitest";
import {
  buildComparisonChoices,
  projectComparisonExcerpt,
  COMPARISON_CATALOG_LIMIT,
  COMPARISON_BLOCK_LIMIT,
  COMPARISON_BLOCK_CHARS,
} from "./concept-comparison";
import type { Page } from "@/domains/learning";

const createPage = (blocks: Array<{ type: string; content: string }>): Page => ({
  id: "one", chapterId: "chapter", title: "Física", position: 0,
  createdAt: "2026-01-01", updatedAt: "2026-01-01",
  content: { type: "document", blocks },
});

describe("concept comparison projections", () => {
  it("filters malformed and duplicate selector rows and enforces the catalog limit", () => {
    const rows = [
      { id: "", title: "Blank" },
      { id: "one", title: "  Física  " },
      { id: "one", title: "Duplicate" },
      { id: "two", title: "  " },
      ...Array.from({ length: 100 }, (_, i) => ({ id: "p" + i, title: "Title " + i })),
    ];
    const result = buildComparisonChoices(rows);
    expect(result).toHaveLength(COMPARISON_CATALOG_LIMIT);
    expect(result[0]).toEqual({ id: "one", title: "Física" });
    expect(new Set(result.map((entry) => entry.id)).size).toBe(COMPARISON_CATALOG_LIMIT);
  });

  it("preserves authored text, never parses HTML, and bounds the projection", () => {
    const content = "<script>alert(1)</script>" + "x".repeat(900);
    const page = createPage([
      { type: "paragraph", content: "   " },
      ...Array.from({ length: 12 }, (_, i) => ({ type: "paragraph", content: i === 0 ? content : "Text " + i })),
    ]);
    const view = projectComparisonExcerpt(page, "one");
    expect(view.blocks).toHaveLength(COMPARISON_BLOCK_LIMIT);
    expect(view.blocks[0]).toHaveLength(COMPARISON_BLOCK_CHARS);
    expect(view.blocks[0]).toContain("<script>");
    expect(view.truncated).toBe(true);
    expect(view.title).toBe("Física");
  });

  it("fails closed on mismatched ids or malformed content", () => {
    expect(() => projectComparisonExcerpt(createPage([]), "other")).toThrow();
    expect(() => projectComparisonExcerpt({
      ...createPage([]), content: { type: "document", blocks: [{ type: "paragraph", content: 42 as unknown as string }] },
    }, "one")).toThrow();
    expect(projectComparisonExcerpt(createPage([]), "one").blocks).toEqual([]);
  });
});
