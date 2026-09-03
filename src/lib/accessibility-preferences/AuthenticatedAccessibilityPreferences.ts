import type {
  AuthenticatedAccessibilityPreferencesRepository,
  PersistedAccessibilityPreferences,
} from "../../core/accessibility-preferences/contracts";

type AuthenticatedPreferencesStorage = {
  load: () => Promise<PersistedAccessibilityPreferences | null>;
  save: (preferences: PersistedAccessibilityPreferences) => Promise<void>;
};

export function createAuthenticatedAccessibilityPreferencesRepository(
  storage: AuthenticatedPreferencesStorage,
): AuthenticatedAccessibilityPreferencesRepository {
  return {
    async load() {
      return storage.load();
    },

    async save(preferences) {
      await storage.save(preferences);
    },
  };
}
