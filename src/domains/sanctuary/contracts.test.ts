import { describe, it, expect } from 'vitest';
import { SanctuaryPriority, FeatureAvailability } from './types';

describe('Sanctuary Domain Contracts', () => {
  it('should define SanctuaryPriority correctly', () => {
    expect(SanctuaryPriority.URGENT).toBe('urgent');
  });

  it('should define FeatureAvailability correctly', () => {
    expect(FeatureAvailability.AVAILABLE).toBe('available');
    expect(FeatureAvailability.LOCKED).toBe('locked');
  });
});
