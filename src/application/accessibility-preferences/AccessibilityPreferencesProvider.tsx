import {
  mergeAccessibilityPreferences,
  resolveMotionPreference,
  type MotionPreference,
} from "@/core/accessibility-preferences";

import type {
  AuthenticatedAccessibilityPreferencesRepository,
  LocalAccessibilityPreferencesRepository,
  PersistedAccessibilityPreferences,
} from "@/core/accessibility-preferences/contracts";

import type { MotionEnvironment } from "@/core/accessibility-preferences/MotionEnvironment";

import type {
  ApplicationIdentityState,
} from "@/application/identity/contracts";

type AccessibilityPreferencesProviderDependencies = {
  local: LocalAccessibilityPreferencesRepository;
  authenticated?: AuthenticatedAccessibilityPreferencesRepository;
  motionEnvironment: MotionEnvironment;
  identity: ApplicationIdentityState;
};

export type AccessibilityPreferencesState = {
  configuredMotionPreference: MotionPreference;
  effectiveMotionPreference: "normal" | "reduced";
  error: {
    code: "PERSISTENCE_FAILED";
    message: string;
  } | null;
};

type AccessibilityPreferencesListener = (
  state: AccessibilityPreferencesState,
) => void;

export type AccessibilityPreferencesProvider = {
  load: () => Promise<AccessibilityPreferencesState>;
  getState: () => AccessibilityPreferencesState | null;
  subscribe: (
    listener: AccessibilityPreferencesListener,
  ) => () => void;
  setMotionPreference: (
    preference: MotionPreference,
  ) => Promise<void>;
};

function createPersistedPreferences(
  motion: MotionPreference,
): PersistedAccessibilityPreferences {
  return {
    version: 1,
    preferences: {
      motion,
    },
  };
}

export function createAccessibilityPreferencesProvider({
  local,
  authenticated,
  motionEnvironment,
  identity,
}: AccessibilityPreferencesProviderDependencies): AccessibilityPreferencesProvider {
  let state: AccessibilityPreferencesState | null = null;

  const listeners = new Set<AccessibilityPreferencesListener>();

  let unsubscribeMotion: (() => void) | null = null;

  function notify() {
    if (!state) {
      return;
    }

    for (const listener of listeners) {
      listener(state);
    }
  }

  function getAuthenticatedSubjectId(): string | null {
    if (
      identity.status !== "authenticated" ||
      !identity.identity
    ) {
      return null;
    }

    return identity.identity.subjectId;
  }

  function updateSystemMotionPreference(
    systemPreference: "normal" | "reduced",
  ) {
    if (!state) {
      return;
    }

    state = {
      ...state,
      effectiveMotionPreference: resolveMotionPreference({
        configuredPreference:
          state.configuredMotionPreference,
        systemPreference,
      }),
    };

    notify();
  }

  function startMotionObservation() {
    if (unsubscribeMotion) {
      return;
    }

    unsubscribeMotion =
      motionEnvironment.subscribeToMotionPreference(
        updateSystemMotionPreference,
      );
  }

  function stopMotionObservation() {
    unsubscribeMotion?.();
    unsubscribeMotion = null;
  }

  return {
    async load() {
      const subjectId = getAuthenticatedSubjectId();

      const localPreference =
        await local.load();

      const authenticatedPreference =
        subjectId && authenticated
          ? await authenticated.load(subjectId)
          : null;

      const mergedPreference =
        mergeAccessibilityPreferences(
          authenticatedPreference?.preferences ?? null,
          localPreference?.preferences ?? null,
        );

      const systemPreference =
        motionEnvironment.getSystemMotionPreference();

      state = {
        configuredMotionPreference:
          mergedPreference.motion,
        effectiveMotionPreference:
          resolveMotionPreference({
            configuredPreference:
              mergedPreference.motion,
            systemPreference,
          }),
        error: null,
      };

      notify();

      return state;
    },

    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);

      if (listeners.size === 1) {
        startMotionObservation();
      }

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
          stopMotionObservation();
        }
      };
    },

    async setMotionPreference(preference) {
      if (!state) {
        await this.load();
      }

      if (!state) {
        return;
      }

      const systemPreference =
        motionEnvironment.getSystemMotionPreference();

      state = {
        ...state,
        configuredMotionPreference: preference,
        effectiveMotionPreference:
          resolveMotionPreference({
            configuredPreference: preference,
            systemPreference,
          }),
        error: null,
      };

      notify();

      const persistedPreferences =
        createPersistedPreferences(preference);

      try {
        await local.save(persistedPreferences);

        const subjectId =
          getAuthenticatedSubjectId();

        if (subjectId && authenticated) {
          await authenticated.save(
            subjectId,
            persistedPreferences,
          );
        }
      } catch (error) {
        state = {
          ...state,
          error: {
            code: "PERSISTENCE_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Falha de persistência.",
          },
        };

        notify();
      }
    },
  };
}