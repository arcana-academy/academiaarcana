export enum FeatureAvailability {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  DISABLED = 'disabled',
  COMING_SOON = 'coming_soon',
}

export type SectionState<T> = {
  data: T | null;
  status: 'ready' | 'empty' | 'not-configured' | 'error';
  error?: string;
};

export enum SanctuaryPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export type SanctuaryUser = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  rankTitle: string;
};

export type ContinueLearning = {
  id: string;
  title: string;
  type: 'notebook' | 'chapter' | 'page';
  progress: number;
  lastAccessedAt: string;
};

export type SanctuaryMission = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  priority: SanctuaryPriority;
  isCompleted: boolean;
};

export type ProgressSummary = {
  weeklyActivityCount: number;
  completedMissions: number;
  currentStreak: number;
  nextLevelProgress: number;
};

export type ScheduleItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: 'study' | 'mission' | 'event';
};

export type QuickAction = {
  id: string;
  label: string;
  icon: string;
  actionKey: string;
};

export type SanctuarySnapshot = {
  user: SanctuaryUser;
  recentLearning: ContinueLearning | null;
  activeMissions: SanctuaryMission[];
  progress: ProgressSummary;
  schedule: ScheduleItem[];
  actions: QuickAction[];
  timestamp: string;
};

export type SanctuaryPolicyContext = {
  userId: string;
  isAuthenticated: boolean;
  features: Record<string, FeatureAvailability>;
};

export type SanctuaryViewModel = {
  welcomeMessage: string;
  userProfile: {
    name: string;
    levelDisplay: string;
    avatar?: string;
  };
  learningSection: SectionState<ContinueLearning>;
  missionsSection: SectionState<SanctuaryMission[]>;
  isFeatureEnabled: (featureId: string) => boolean;
};
