import type { MotionPreference } from "./contracts";

type ResolveMotionPreferenceInput = {
  configuredPreference: MotionPreference;
  systemPreference: "normal" | "reduced";
};

export function resolveMotionPreference({
  configuredPreference,
  systemPreference,
}: ResolveMotionPreferenceInput): "normal" | "reduced" {
  if (configuredPreference === "system") {
    return systemPreference;
  }

  return configuredPreference;
}