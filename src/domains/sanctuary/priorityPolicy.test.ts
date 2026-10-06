import { describe, expect, it } from "vitest";
import {
  decideSanctuaryPriority,
  SECTION_ORDER,
  type PriorityPolicyContext,
} from "./priorityPolicy";
import type { ContinueLearningContext } from "./contracts";

describe("Sanctuary Priority Policy (Task 5)", () => {
  it("should return sections in a fixed deterministic order", () => {
    const decisions = decideSanctuaryPriority();
    const sectionOrder = decisions.map((d) => d.section);

    expect(sectionOrder).toEqual(SECTION_ORDER);
    expect(sectionOrder).toEqual([
      "continueLearning",
      "progress",
      "missions",
      "schedule",
      "quickActions",
    ]);
  });

  it("should assign primary priority to continueLearning when valid learning context exists", () => {
    const mockContext: ContinueLearningContext = {
      intent: "explore",
      grimoireId: "grimoire-1",
      grimoireTitle: "Grimório das Sombras",
      notebookId: "notebook-1",
      notebookTitle: "Caderno 1",
    };

    const decisions = decideSanctuaryPriority({
      continueLearning: mockContext,
    });

    const continueDecision = decisions.find(
      (d) => d.section === "continueLearning"
    );

    expect(continueDecision).toBeDefined();
    expect(continueDecision?.priority).toBe("primary");
    expect(continueDecision?.reason).toBe("valid-learning-context");
  });

  it("should assign supporting priority to continueLearning when context is empty or absent", () => {
    const withoutContext = decideSanctuaryPriority();
    const continueWithoutContext = withoutContext.find(
      (d) => d.section === "continueLearning"
    );

    expect(continueWithoutContext?.priority).toBe("supporting");
    expect(continueWithoutContext?.reason).toBe("no-learning-context");

    const withNullContext = decideSanctuaryPriority({
      continueLearning: null,
    });

    const continueWithNull = withNullContext.find(
      (d) => d.section === "continueLearning"
    );

    expect(continueWithNull?.priority).toBe("supporting");
    expect(continueWithNull?.reason).toBe("no-learning-context");

    const withEmptyContext = decideSanctuaryPriority({});

    const continueWithEmpty = withEmptyContext.find(
      (d) => d.section === "continueLearning"
    );

    expect(continueWithEmpty?.priority).toBe("supporting");
    expect(continueWithEmpty?.reason).toBe("no-learning-context");
  });

  it("should keep missions supporting even when gamification is available", () => {
    const decisions = decideSanctuaryPriority();
    const missionsDecision = decisions.find(
      (d) => d.section === "missions"
    );

    expect(missionsDecision).toBeDefined();
    expect(missionsDecision?.priority).toBe("supporting");
    expect(missionsDecision?.reason).toBe("gamification-supporting");
  });

  it("should keep schedule supporting even when planning is available", () => {
    const decisions = decideSanctuaryPriority();
    const scheduleDecision = decisions.find(
      (d) => d.section === "schedule"
    );

    expect(scheduleDecision).toBeDefined();
    expect(scheduleDecision?.priority).toBe("supporting");
    expect(scheduleDecision?.reason).toBe("planning-supporting");
  });

  it("should assign supporting priority to progress and quickActions", () => {
    const decisions = decideSanctuaryPriority();

    const progressDecision = decisions.find(
      (d) => d.section === "progress"
    );

    expect(progressDecision?.priority).toBe("supporting");
    expect(progressDecision?.reason).toBe("progress-supporting");

    const quickActionsDecision = decisions.find(
      (d) => d.section === "quickActions"
    );

    expect(quickActionsDecision?.priority).toBe("supporting");
    expect(quickActionsDecision?.reason).toBe("quick-actions-supporting");
  });

  it("should be pure and deterministic across repeated calls with identical context", () => {
    const context: PriorityPolicyContext = {
      continueLearning: {
        intent: "explore",
        grimoireId: "grimoire-1",
        grimoireTitle: "Grimório das Sombras",
      },
    };

    const firstCall = decideSanctuaryPriority(context);
    const secondCall = decideSanctuaryPriority(context);

    expect(firstCall).toEqual(secondCall);
    expect(context).toEqual({
      continueLearning: {
        intent: "explore",
        grimoireId: "grimoire-1",
        grimoireTitle: "Grimório das Sombras",
      },
    });
  });
});