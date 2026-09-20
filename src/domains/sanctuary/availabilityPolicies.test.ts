import { describe, expect, it } from "vitest";

import {
    resolveGamificationAvailability,
    resolvePlanningAvailability,
    resolveProgressAvailability,
} from "./availabilityPolicies";

describe("Sanctuary Availability Policies", () => {
    it("resolves planning as not-configured", () => {
        expect(resolvePlanningAvailability()).toBe("not-configured");
    });

    it("resolves gamification as not-configured", () => {
        expect(resolveGamificationAvailability()).toBe("not-configured");
    });

    it("resolves progress as not-configured", () => {
        expect(resolveProgressAvailability()).toBe("not-configured");
    });
});
