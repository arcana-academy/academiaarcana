export type {
  AccessibilityPreference,
  MotionPreference,
  PersistedAccessibilityPreferences,
  AccessibilityPreferencesError,
  AccessibilityPreferencesErrorCode,
  LocalAccessibilityPreferencesRepository,
  AuthenticatedAccessibilityPreferencesRepository,
} from "./contracts";

export type {
  MotionEnvironment,
  SystemMotionPreference,
} from "./MotionEnvironment";

export { resolveMotionPreference } from "./MotionPreferenceResolver";

export { mergeAccessibilityPreferences } from "./PreferencesMerge";
