/**
 * Compatibility container retained for the initial Sanctuary policy contract.
 *
 * The executable Sanctuary rules are intentionally split by responsibility:
 * - continue-learning-policy.ts
 * - availabilityPolicies.ts
 * - priorityPolicy.ts
 *
 * This export remains empty because those rules are exposed directly from the
 * domain barrel and do not need a second mutable policy registry.
 */
export type SanctuaryPolicyContext = Record<string, unknown>;

export const SanctuaryPolicies = {};
