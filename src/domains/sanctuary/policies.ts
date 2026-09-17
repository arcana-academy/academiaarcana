import { SanctuaryPolicyContext, FeatureAvailability } from './types';

export const SanctuaryPolicies = {
  /**
   * Basic access control for the Sanctuary.
   * Hierarchical rank/level policies are NOT defined here at the domain level
   * as per specification, to allow flexibility in the application layer.
   */
  canAccessSanctuary: (context: SanctuaryPolicyContext): boolean => {
    return context.isAuthenticated;
  },

  isFeatureAvailable: (
    context: SanctuaryPolicyContext,
    featureId: string
  ): boolean => {
    const availability = context.features[featureId];
    return availability === FeatureAvailability.AVAILABLE;
  },
};
