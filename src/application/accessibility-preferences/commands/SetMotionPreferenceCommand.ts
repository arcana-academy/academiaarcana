import type { MotionPreference } from "@/core/accessibility-preferences/contracts";

export interface SetMotionPreferenceCommandInput {
  preference: MotionPreference;
}

export interface SetMotionPreferenceCommandResult {
  configuredMotionPreference: MotionPreference;
}

export const SetMotionPreferenceCommand = {
  execute(
    input: SetMotionPreferenceCommandInput,
  ): SetMotionPreferenceCommandResult {
    return {
      configuredMotionPreference: input.preference,
    };
  },
};
