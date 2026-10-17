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
