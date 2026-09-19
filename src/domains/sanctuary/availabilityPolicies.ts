import type { FeatureAvailability } from "./contracts";

/**
 * Task 4 — Availability Policies
 *
 * Resolves the availability of Planning and Gamification domains.
 * In the current state of the repository, both domains have empty contracts,
 * so they return "not-configured" deterministically without arguments.
 */
export function resolvePlanningAvailability(): FeatureAvailability {
  return "not-configured";
}

export function resolveGamificationAvailability(): FeatureAvailability {
  return "not-configured";
}

