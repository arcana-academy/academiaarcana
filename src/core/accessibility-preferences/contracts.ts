export type MotionPreference = "system" | "normal" | "reduced";

export type AccessibilityPreference = {
  motion: MotionPreference;
};

export type PersistedAccessibilityPreferences = {
  version: 1;
  preferences: AccessibilityPreference;
};

export type LocalAccessibilityPreferencesRepository = {
  load: () => Promise<PersistedAccessibilityPreferences | null>;
  save: (preferences: PersistedAccessibilityPreferences) => Promise<void>;
};

export type AuthenticatedAccessibilityPreferencesRepository = {
  load: () => Promise<PersistedAccessibilityPreferences | null>;
  save: (preferences: PersistedAccessibilityPreferences) => Promise<void>;
};