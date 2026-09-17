import { describe, it, expect } from 'vitest';
import { SanctuaryPolicies } from './policies';
import { FeatureAvailability } from './types';

describe('SanctuaryPolicies', () => {
  const mockContext = {
    userId: 'user-123',
    isAuthenticated: true,
    features: {
      'mission-board': FeatureAvailability.AVAILABLE,
      'locked-feature': FeatureAvailability.LOCKED,
    },
  };

  it('should allow access to authenticated users', () => {
    expect(SanctuaryPolicies.canAccessSanctuary(mockContext)).toBe(true);
    expect(SanctuaryPolicies.canAccessSanctuary({ ...mockContext, isAuthenticated: false })).toBe(false);
  });

  it('should check feature availability correctly', () => {
    expect(SanctuaryPolicies.isFeatureAvailable(mockContext, 'mission-board')).toBe(true);
    expect(SanctuaryPolicies.isFeatureAvailable(mockContext, 'locked-feature')).toBe(false);
    expect(SanctuaryPolicies.isFeatureAvailable(mockContext, 'non-existent')).toBe(false);
  });
});
