import type { MotionPreference } from "./contracts";

type PreferencesSource = {
  motionPreference?: unknown;
};

type MergePreferencesInput = {
  local: PreferencesSource;
  authenticated: PreferencesSource;
};

type MergedPreferences = {
  motionPreference: MotionPreference;
};

function isValidMotionPreference(value: unknown): value is MotionPreference {
  return value === "system" || value === "normal" || value === "reduced";
}

export function mergePreferences({
  local,
  authenticated,
}: MergePreferencesInput): MergedPreferences {
  if (isValidMotionPreference(authenticated.motionPreference)) {
    return {
      motionPreference: authenticated.motionPreference,
    };
  }

  if (isValidMotionPreference(local.motionPreference)) {
    return {
      motionPreference: local.motionPreference,
    };
  }

  return {
    motionPreference: "system",
  };
}
