import { describe, it, expect } from 'vitest';
import type { FeatureAvailability, ProgressSummary, SanctuaryPriority, SanctuarySnapshot, SanctuaryViewModel, SectionState } from './contracts';

describe('Sanctuary Domain Contracts', () => {
  it('should support the correct FeatureAvailability values', () => {
    const available: FeatureAvailability = 'available';
    const empty: FeatureAvailability = 'empty';
    const notConfigured: FeatureAvailability = 'not-configured';

    expect(available).toBe('available');
    expect(empty).toBe('empty');
    expect(notConfigured).toBe('not-configured');
  });

  it('should support the correct SanctuaryPriority values', () => {
    const primary: SanctuaryPriority = 'primary';
    const secondary: SanctuaryPriority = 'secondary';
    const supporting: SanctuaryPriority = 'supporting';

    expect(primary).toBe('primary');
    expect(secondary).toBe('secondary');
    expect(supporting).toBe('supporting');
  });

  it('should correctly structure SectionState as a discriminated union', () => {
    const readyState: SectionState<string> = { status: 'ready', data: 'test-data' };
    expect(readyState.status).toBe('ready');
    expect(readyState.data).toBe('test-data');
  });

  it('should represent progress as an explicit section state without fabricating data', () => {
    const notConfigured: SectionState<ProgressSummary> = {
      status: 'not-configured',
      data: null,
    };

    const snapshot: Pick<SanctuarySnapshot, 'progress'> = {
      progress: notConfigured,
    };
    const viewModel: Pick<SanctuaryViewModel, 'progress'> = {
      progress: notConfigured,
    };

    expect(snapshot.progress.status).toBe('not-configured');
    expect(snapshot.progress.data).toBeNull();
    expect(viewModel.progress.status).toBe('not-configured');
    expect(viewModel.progress.data).toBeNull();
  });
});
