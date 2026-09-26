import type { FeatureAvailability } from "./contracts";

/**
 * Planning, Gamification and Progress now have real contracts and
 * persistence adapters in product-domain-v1. Runtime availability is still
 * subject to the authenticated repository wiring performed by the application
 * layer.
 */
export function resolvePlanningAvailability(): FeatureAvailability {
  return "available";
}

export function resolveGamificationAvailability(): FeatureAvailability {
  return "available";
}

export function resolveProgressAvailability(): FeatureAvailability {
  return "available";
}
