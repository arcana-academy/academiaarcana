import { describe, expect, it } from "vitest";

import {
  resolveGamificationAvailability,
  resolvePlanningAvailability,
  resolveProgressAvailability,
} from "./availabilityPolicies";

describe("Sanctuary Availability Policies", () => {
  it("resolves planning as available", () => {
    expect(resolvePlanningAvailability()).toBe("available");
  });

  it("resolves gamification as available", () => {
    expect(resolveGamificationAvailability()).toBe("available");
  });

  it("resolves progress as available", () => {
    expect(resolveProgressAvailability()).toBe("available");
  });
});
