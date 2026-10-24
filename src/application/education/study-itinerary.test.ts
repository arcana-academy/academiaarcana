import { describe, expect, it } from "vitest";
import {
  buildStudyItineraryPages,
  STUDY_ITINERARY_PAGE_LIMIT,
} from "./study-itinerary";

describe("buildStudyItineraryPages", () => {
  it("uses saved RLS-visible pages and only active owner practice, never sensitive answers", () => {
    const pages = [{ id: "page&1", title: "  Biologia  " }, { id: "page2", title: "Química" }];
    const items = [
      { ownerId: "owner", pageId: "page&1", active: true, prompt: "Private", referenceAnswer: "Secret" },
      { ownerId: "another", pageId: "page&1", active: true },
      { ownerId: "owner", pageId: "page2", active: false },
      { ownerId: "owner", pageId: "not-visible", active: true },
    ];
    const result = buildStudyItineraryPages("owner", pages, items);
    expect(result).toEqual([
      { id: "page&1", title: "Biologia", practiceCount: 1, workspaceHref: "/workspace?page=page%261", practiceHref: "/pratica?pagina=page%261" },
      { id: "page2", title: "Química", practiceCount: 0, workspaceHref: "/workspace?page=page2", practiceHref: "/pratica?pagina=page2" },
    ]);
    expect(JSON.stringify(result)).not.toContain("Secret");
    expect(JSON.stringify(result)).not.toContain("Private");
  });

  it("ignores empty and duplicate page identifiers and limits the catalog", () => {
    const pages = [
      { id: "", title: "Empty" },
      { id: "a", title: " " },
      { id: "one", title: "First" },
      { id: "one", title: "Duplicate" },
      ...Array.from({ length: 100 }, (_, i) => ({ id: `id-${i}`, title: `Page ${i}` })),
    ];
    const result = buildStudyItineraryPages("owner", pages, []);
    expect(result).toHaveLength(STUDY_ITINERARY_PAGE_LIMIT);
    expect(result[0]?.title).toBe("First");
    expect(new Set(result.map((page) => page.id)).size).toBe(STUDY_ITINERARY_PAGE_LIMIT);
  });
});
