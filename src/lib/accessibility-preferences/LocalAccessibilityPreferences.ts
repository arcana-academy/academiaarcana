import type {
  LocalAccessibilityPreferencesRepository,
  PersistedAccessibilityPreferences,
} from "../../core/accessibility-preferences/contracts";

const STORAGE_KEY =
  "academia-arcana.accessibility-preferences";

function isPersistedAccessibilityPreferences(
  value: unknown,
): value is PersistedAccessibilityPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    version?: unknown;
    preferences?: {
      motion?: unknown;
    };
  };

  return (
    candidate.version === 1 &&
    candidate.preferences !== undefined &&
    typeof candidate.preferences === "object" &&
    (candidate.preferences.motion === "system" ||
      candidate.preferences.motion === "normal" ||
      candidate.preferences.motion === "reduced")
  );
}

export function createLocalAccessibilityPreferencesRepository(
  storage?: Storage,
): LocalAccessibilityPreferencesRepository {
  const resolvedStorage =
    storage ??
    (typeof window !== "undefined"
      ? window.localStorage
      : undefined);

  return {
    async load() {
      if (!resolvedStorage) {
        return null;
      }

      try {
        const stored =
          resolvedStorage.getItem(STORAGE_KEY);

        if (!stored) {
          return null;
        }

        const parsed: unknown = JSON.parse(stored);

        if (!isPersistedAccessibilityPreferences(parsed)) {
          return null;
        }

        return parsed;
      } catch {
        return null;
      }
    },

    async save(preferences) {
      if (!resolvedStorage) {
        return;
      }

      try {
        resolvedStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(preferences),
        );
      } catch {
        return;
      }
    },
  };
}