import { SanctuarySnapshot, SanctuaryViewModel } from './types';

export interface SanctuaryRepository {
  getSnapshot(userId: string): Promise<SanctuarySnapshot>;
}

export interface SanctuaryService {
  getViewModel(userId: string): Promise<SanctuaryViewModel>;
}
