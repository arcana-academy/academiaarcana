import { describe, expect, it } from "vitest";

import type {
  AccessibilityPreference,
  AccessibilityPreferencesError,
  AuthenticatedAccessibilityPreferencesRepository,
  LocalAccessibilityPreferencesRepository,
  MotionPreference,
  PersistedAccessibilityPreferences,
} from "./contracts";

describe("accessibility-preferences contracts", () => {
  it("define as preferências de movimento suportadas", () => {
    const system: MotionPreference = "system";
    const normal: MotionPreference = "normal";
    const reduced: MotionPreference = "reduced";

    expect([system, normal, reduced]).toEqual(["system", "normal", "reduced"]);
  });

  it("define uma preferência de acessibilidade", () => {
    const preference: AccessibilityPreference = {
      motion: "reduced",
    };

    expect(preference.motion).toBe("reduced");
  });

  it("define uma persistência versionada de preferências", () => {
    const persisted: PersistedAccessibilityPreferences = {
      version: 1,
      preferences: {
        motion: "reduced",
      },
    };

    expect(persisted.version).toBe(1);
    expect(persisted.preferences.motion).toBe("reduced");
  });

  it("define um erro estruturado de persistência", () => {
    const error: AccessibilityPreferencesError = {
      code: "PERSISTENCE_FAILED",
      message: "falha de persistência local",
    };

    expect(error.code).toBe("PERSISTENCE_FAILED");
    expect(error.message).toBe("falha de persistência local");
  });

  it("define o contrato de persistência local", () => {
    const repository: LocalAccessibilityPreferencesRepository = {
      load: async () => null,
      save: async () => {},
    };

    expect(repository).toBeDefined();
  });

  it("define o contrato de persistência autenticada", () => {
    const repository: AuthenticatedAccessibilityPreferencesRepository = {
      load: async () => null,
      save: async () => {},
    };

    expect(repository).toBeDefined();
  });
});
