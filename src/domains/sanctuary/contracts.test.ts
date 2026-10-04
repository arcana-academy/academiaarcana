import { describe, it, expect } from 'vitest';
import type { FeatureAvailability, ProgressSummary, SanctuaryMission, SanctuaryPriority, SanctuarySnapshot, SanctuaryViewModel, ScheduleItem, SectionState } from './contracts';

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

  it('should represent missions as an explicit section state without fabricating data', () => {
    const notConfigured: SectionState<SanctuaryMission[]> = {
      status: 'not-configured',
      data: null,
    };

    const snapshot: Pick<SanctuarySnapshot, 'missions'> = {
      missions: notConfigured,
    };
    const viewModel: Pick<SanctuaryViewModel, 'missions'> = {
      missions: notConfigured,
    };

    expect(snapshot.missions.status).toBe('not-configured');
    expect(snapshot.missions.data).toBeNull();
    expect(viewModel.missions.status).toBe('not-configured');
    expect(viewModel.missions.data).toBeNull();

    // An empty array is a payload shape, never equivalent to not-configured.
    if (snapshot.missions.status === 'ready') {
      expect(snapshot.missions.data).toEqual(expect.any(Array));
    } else {
      expect(snapshot.missions.data).toBeNull();
    }
  });

  it('should represent schedule as an explicit section state without fabricating data', () => {
    const notConfigured: SectionState<ScheduleItem[]> = {
      status: 'not-configured',
      data: null,
    };

    const snapshot: Pick<SanctuarySnapshot, 'schedule'> = {
      schedule: notConfigured,
    };
    const viewModel: Pick<SanctuaryViewModel, 'schedule'> = {
      schedule: notConfigured,
    };

    expect(snapshot.schedule.status).toBe('not-configured');
    expect(snapshot.schedule.data).toBeNull();
    expect(viewModel.schedule.status).toBe('not-configured');
    expect(viewModel.schedule.data).toBeNull();

    // An empty array is a payload shape, never equivalent to not-configured.
    if (snapshot.schedule.status === 'ready') {
      expect(snapshot.schedule.data).toEqual(expect.any(Array));
    } else {
      expect(snapshot.schedule.data).toBeNull();
    }
  });
});
