import type { FeatureAvailability } from "./contracts";

/**
 * Task 4 — Availability Policies
 *
 * Resolves the availability of Planning, Gamification and Progress.
 * In the current state of the repository, these domains have no real source
 * (Planning and Gamification have empty contracts; Progress has no
 * repository, adapter, use case, table, view, RPC or calculation),
 * so they return "not-configured" deterministically without arguments.
 */
export function resolvePlanningAvailability(): FeatureAvailability {
  return "not-configured";
}

export function resolveGamificationAvailability(): FeatureAvailability {
  return "not-configured";
}

export function resolveProgressAvailability(): FeatureAvailability {
    return "not-configured";
}

