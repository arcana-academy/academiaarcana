import { describe, expect, it } from "vitest";
import { getAdaptiveRecommendation } from "./contracts";

describe("adaptive recommendations", () => {
  it("prioritizes a small step when progress is still low", () => {
    expect(getAdaptiveRecommendation({ progressPercentage: 10, openMissionCount: 3, scheduledTaskCount: 2 }).title)
      .toBe("Comece pequeno");
  });

  it("uses persisted missions before schedule when progress is established", () => {
    expect(getAdaptiveRecommendation({ progressPercentage: 60, openMissionCount: 1, scheduledTaskCount: 2 }).href)
      .toBe("/missoes");
  });

  it("does not invent urgency when there are no signals", () => {
    expect(getAdaptiveRecommendation({ progressPercentage: null, openMissionCount: 0, scheduledTaskCount: 0 }).title)
      .toBe("Explore no seu ritmo");
  });
});
