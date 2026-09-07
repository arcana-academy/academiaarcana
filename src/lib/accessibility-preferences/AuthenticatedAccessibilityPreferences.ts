import type {
  AuthenticatedAccessibilityPreferencesRepository,
  PersistedAccessibilityPreferences,
} from "../../core/accessibility-preferences/contracts";

type AuthenticatedPreferencesStorage = {
  load: (
    subjectId: string,
  ) => Promise<PersistedAccessibilityPreferences | null>;

  save: (
    subjectId: string,
    preferences: PersistedAccessibilityPreferences,
  ) => Promise<void>;
};

export function createAuthenticatedAccessibilityPreferencesRepository(
  storage: AuthenticatedPreferencesStorage,
): AuthenticatedAccessibilityPreferencesRepository {
  return {
    async load(subjectId) {
      return storage.load(subjectId);
    },

    async save(subjectId, preferences) {
      await storage.save(subjectId, preferences);
    },
  };
}
