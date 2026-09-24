import { describe, it, expect } from "vitest";
import { SanctuaryPolicies } from "./policies";

describe("SanctuaryPolicies - Task 1", () => {
  it("should be defined as a container for domain rules", () => {
    expect(SanctuaryPolicies).toBeDefined();
    expect(SanctuaryPolicies).not.toBeNull();
    expect(typeof SanctuaryPolicies).toBe("object");
  });
});
