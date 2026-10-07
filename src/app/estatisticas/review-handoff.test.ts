import { describe, expect, it } from "vitest";

import { getReviewPracticeHref } from "./review-handoff";

describe("getReviewPracticeHref", () => {
  it("builds a canonical self-assessment review handoff", () => {
    expect(
      getReviewPracticeHref(
        { practiceItemId: "item-1" },
        {
          evidence: [{ practiceItemId: "item-1", pageId: "page-1" }],
          objectiveEvidence: [],
        },
      ),
    ).toBe("/pratica?pagina=page-1&item=item-1");
  });

  it("builds a canonical objective review handoff", () => {
    expect(
      getReviewPracticeHref(
        { practiceItemId: "objective-1" },
        {
          evidence: [],
          objectiveEvidence: [
            { practiceItemId: "objective-1", pageId: "page-2" },
          ],
        },
      ),
    ).toBe("/pratica?pagina=page-2&avaliacao=objective-1");
  });

  it("encodes the authenticated page and activity ids", () => {
    expect(
      getReviewPracticeHref(
        { practiceItemId: "item / 1" },
        {
          evidence: [{ practiceItemId: "item / 1", pageId: "page / 1" }],
          objectiveEvidence: [],
        },
      ),
    ).toBe("/pratica?pagina=page%20%2F%201&item=item%20%2F%201");
  });

  it("does not fabricate a handoff when the review cannot be resolved", () => {
    expect(
      getReviewPracticeHref(
        { practiceItemId: "missing-item" },
        {
          evidence: [{ practiceItemId: "item-1", pageId: "page-1" }],
          objectiveEvidence: [],
        },
      ),
    ).toBeNull();
  });

  it("rejects ambiguous evidence-mode context instead of choosing arbitrarily", () => {
    expect(
      getReviewPracticeHref(
        { practiceItemId: "item-1" },
        {
          evidence: [{ practiceItemId: "item-1", pageId: "page-1" }],
          objectiveEvidence: [{ practiceItemId: "item-1", pageId: "page-1" }],
        },
      ),
    ).toBeNull();
  });
});
