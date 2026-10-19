import { describe, expect, it } from "vitest";
import type { SanctuaryGrimoire } from "../contracts";
import { resolveContinueLearning } from "../continue-learning-policy";

const page = (id: string, position = 1) => ({ id, chapterId: "c", title: id, position });
const chapter = (id: string, position = 1, pages = [] as ReturnType<typeof page>[]) =>
  ({ id, notebookId: "n", title: id, position, pages });
const notebook = (id: string, position = 1, chapters = [] as ReturnType<typeof chapter>[]) =>
  ({ id, grimoireId: "g", title: id, position, chapters });
const grimoire = (id: string, notebooks = [] as ReturnType<typeof notebook>[]): SanctuaryGrimoire =>
  ({ id, ownerId: "synthetic-owner", title: id, notebooks });

describe("continueLearning deepest available hierarchy", () => {
  it("selects a later notebook when earlier grimoires have no descendants", () => {
    expect(resolveContinueLearning([
      grimoire("g-a"),
      grimoire("g-z", [notebook("n-z")]),
    ])).toEqual({ intent: "explore", grimoireId: "g-z", grimoireTitle: "g-z", notebookId: "n-z", notebookTitle: "n-z" });
  });

  it("selects a chapter over an earlier notebook when no pages exist anywhere", () => {
    expect(resolveContinueLearning([
      grimoire("g-a", [notebook("n-a")]),
      grimoire("g-z", [notebook("n-z", 1, [chapter("c-z")])]),
    ])).toEqual({
      intent: "explore", grimoireId: "g-z", grimoireTitle: "g-z",
      notebookId: "n-z", notebookTitle: "n-z", chapterId: "c-z", chapterTitle: "c-z",
    });
  });

  it("keeps the first chapter candidate when later branches are shallower or equally deep", () => {
    const entries = [
      grimoire("g-z", [notebook("n-z", 0, [chapter("c-z", 0)])]),
      grimoire("g-a", [notebook("n-b", 1), notebook("n-a", 0, [chapter("c-b", 0), chapter("c-a", 0)])]),
    ];
    expect(resolveContinueLearning(entries)).toMatchObject({ grimoireId: "g-a", notebookId: "n-a", chapterId: "c-a" });
  });

  it("uses ancestor order before descendant positions when equally deep branches contain pages", () => {
    const entries = [grimoire("g", [
      notebook("n-a", 2, [chapter("c-a", 0, [page("p-a", 0)])]),
      notebook("n-z", 1, [chapter("c-z", 9, [page("p-z", 9)])]),
    ])];
    const original = structuredClone(entries);
    expect(resolveContinueLearning(entries)).toMatchObject({ notebookId: "n-z", chapterId: "c-z", pageId: "p-z" });
    expect(entries).toEqual(original);
  });

  it("uses a page in another grimoire rather than an empty first grimoire", () => {
    const entries = [
      grimoire("g-a"),
      grimoire("g-z", [notebook("n-z", 1, [chapter("c-z", 1, [page("p-z")])])]),
    ];
    expect(resolveContinueLearning(entries)).toMatchObject({ grimoireId: "g-z", pageId: "p-z", intent: "explore" });
  });

  it("uses a page in another notebook rather than an empty earlier notebook", () => {
    const entries = [grimoire("g-a", [
      notebook("n-a", 1),
      notebook("n-z", 2, [chapter("c-z", 1, [page("p-z")])]),
    ])];
    expect(resolveContinueLearning(entries)).toMatchObject({ notebookId: "n-z", pageId: "p-z" });
  });

  it("uses a page in another chapter rather than an empty earlier chapter", () => {
    const entries = [grimoire("g-a", [notebook("n-a", 1, [
      chapter("c-a", 1), chapter("c-z", 2, [page("p-z")]),
    ])])];
    expect(resolveContinueLearning(entries)).toMatchObject({ chapterId: "c-z", pageId: "p-z" });
  });

  it("retains ID and position tie-breaks, without modifying input", () => {
    const entries = [
      grimoire("g-z", [notebook("n-z", 1, [chapter("c-z", 1, [page("p-z")])])]),
      grimoire("g-a", [notebook("n-a", 1, [chapter("c-a", 1, [page("p-b", 1), page("p-a", 1)])])]),
    ];
    const original = JSON.stringify(entries);
    expect(resolveContinueLearning(entries)).toMatchObject({ grimoireId: "g-a", pageId: "p-a" });
    expect(resolveContinueLearning([...entries].reverse())).toMatchObject({ grimoireId: "g-a", pageId: "p-a" });
    expect(JSON.stringify(entries)).toBe(original);
  });
});
