import { describe, expect, it } from "vitest";

import {
  mergeAccessibilityPreferences,
  resolveMotionPreference,
  type AccessibilityPreference,
  type AccessibilityPreferencesError,
  type AccessibilityPreferencesErrorCode,
  type AuthenticatedAccessibilityPreferencesRepository,
  type LocalAccessibilityPreferencesRepository,
  type MotionEnvironment,
  type MotionPreference,
  type PersistedAccessibilityPreferences,
  type SystemMotionPreference,
} from "./index";

describe("accessibility-preferences index", () => {
  it("exporta os contratos públicos do módulo", () => {
    const motionPreference: MotionPreference = "system";

    const accessibilityPreference: AccessibilityPreference = {
      motion: motionPreference,
    };

    const persisted: PersistedAccessibilityPreferences = {
      version: 1,
      preferences: accessibilityPreference,
    };

    const error: AccessibilityPreferencesError = {
      code: "PERSISTENCE_FAILED",
      message: "Falha ao salvar.",
    };

    const errorCode: AccessibilityPreferencesErrorCode = error.code;

    const local: LocalAccessibilityPreferencesRepository = {
      load: async () => null,
      save: async () => {},
    };

    const authenticated: AuthenticatedAccessibilityPreferencesRepository = {
      load: async () => null,
      save: async () => {},
    };

    const systemPreference: SystemMotionPreference = "normal";

    const environment: MotionEnvironment = {
      getSystemMotionPreference: () => systemPreference,
      subscribeToMotionPreference: () => () => {},
    };

    expect(persisted.version).toBe(1);
    expect(errorCode).toBe("PERSISTENCE_FAILED");
    expect(local).toBeDefined();
    expect(authenticated).toBeDefined();
    expect(environment.getSystemMotionPreference()).toBe("normal");
  });

  it("exporta o resolver de preferência de movimento", () => {
    expect(
      resolveMotionPreference({
        configuredPreference: "system",
        systemPreference: "reduced",
      }),
    ).toBe("reduced");
  });

  it("exporta o merge de preferências", () => {
    expect(
      mergeAccessibilityPreferences(
        {
          motion: "reduced",
        },
        {
          motion: "normal",
        },
      ),
    ).toEqual({
      motion: "reduced",
    });
  });
});
