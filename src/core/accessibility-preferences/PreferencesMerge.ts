import type { AccessibilityPreference } from "./contracts";

export function mergeAccessibilityPreferences(
  profilePreference: AccessibilityPreference | null,
  localPreference: AccessibilityPreference | null,
): AccessibilityPreference {
  if (profilePreference) {
    return profilePreference;
  }

  if (localPreference) {
    return localPreference;
  }

  return {
    motion: "system",
  };
}
