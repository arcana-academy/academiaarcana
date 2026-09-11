import type { AccessibilityPreference } from "@/core/accessibility-preferences/contracts";

export interface GetAccessibilityPreferencesQueryResult {
  preferences: AccessibilityPreference;
}

export const GetAccessibilityPreferencesQuery = {
  execute(): GetAccessibilityPreferencesQueryResult {
    return {
      preferences: {
        motion: "normal",
      },
    };
  },
};
