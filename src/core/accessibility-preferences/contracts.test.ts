import { describe, expect, it } from "vitest";

import type {
  AccessibilityPreference,
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