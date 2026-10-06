import { describe, expect, it } from "vitest";
import { getAdaptiveRecommendation } from "./contracts";

describe("adaptive recommendations", () => {
  it("prioritizes a small step when progress is still low", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: 10,
        openMissionCount: 3,
        scheduledTaskCount: 2,
      }).title,
    ).toBe("Comece pequeno");
  });

  it("uses persisted missions before schedule when progress is established", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: 60,
        openMissionCount: 1,
        scheduledTaskCount: 2,
      }).href,
    ).toBe("/missoes");
  });

  it("treats observed zero as valid evidence without inventing urgency", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: null,
        openMissionCount: 0,
        scheduledTaskCount: 0,
      }),
    ).toMatchObject({
      title: "Explore no seu ritmo",
      href: "/grimorios",
    });
  });

  it("treats unavailable operational signals as unknown instead of zero", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: null,
        openMissionCount: null,
        scheduledTaskCount: null,
      }),
    ).toMatchObject({
      title: "Explore no seu ritmo",
      href: "/grimorios",
    });
  });

  it("uses available schedule evidence even when mission evidence is unknown", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: 60,
        openMissionCount: null,
        scheduledTaskCount: 1,
      }),
    ).toMatchObject({
      title: "Siga o próximo horário",
      href: "/cronograma",
    });
  });

  it("uses available mission evidence even when schedule evidence is unknown", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: 60,
        openMissionCount: 1,
        scheduledTaskCount: null,
      }),
    ).toMatchObject({
      title: "Retome uma missão",
      href: "/missoes",
    });
  });

  it("does not let unknown operational signals suppress valid progress evidence", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: 10,
        openMissionCount: null,
        scheduledTaskCount: null,
      }),
    ).toMatchObject({
      title: "Comece pequeno",
      href: "/workspace",
    });
  });

  it("prioritizes an educational review signal when one is due", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: 100,
        openMissionCount: 0,
        scheduledTaskCount: 0,
        educationalReviewDueCount: 1,
      }),
    ).toMatchObject({
      title: "Revise o que já foi praticado",
      href: "/estatisticas#review-title",
    });
  });

  it("prioritizes a learning-gap signal when no review is due", () => {
    expect(
      getAdaptiveRecommendation({
        progressPercentage: 100,
        openMissionCount: 0,
        scheduledTaskCount: 0,
        educationalReviewDueCount: 0,
        educationalLearningGapCount: 1,
      }),
    ).toMatchObject({
      title: "Investigue um ponto difícil",
      href: "/estatisticas#gaps-title",
    });
  });
});
