import { describe, expect, it } from "vitest";
import { createFeedbackSubmitGate } from "./feedback-submit-gate";

describe("FeedbackSubmitGate", () => {
  it("bloqueia imediatamente submissões duplicadas", () => {
    const gate = createFeedbackSubmitGate();
    expect(gate.enter()).toBe(true);
    expect(gate.enter()).toBe(false);
    expect(gate.isPending()).toBe(true);
  });

  it("libera nova tentativa somente após finalização", () => {
    const gate = createFeedbackSubmitGate();
    expect(gate.enter()).toBe(true);
    gate.leave();
    expect(gate.enter()).toBe(true);
  });
});
