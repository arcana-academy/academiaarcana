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
    const preferences: MotionPreference[] = ["system", "normal", "reduced"];

    expect(preferences).toHaveLength(3);
  });

  it("define a preferência de acessibilidade", () => {
    const preference: AccessibilityPreference = {
      motion: "system",
    };

    expect(preference.motion).toBe("system");
  });

  it("define uma persistência versionada", () => {
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
