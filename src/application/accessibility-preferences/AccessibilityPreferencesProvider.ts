import type {
  AccessibilityPreferencesError,
  AuthenticatedAccessibilityPreferencesRepository,
  LocalAccessibilityPreferencesRepository,
} from "../../core/accessibility-preferences/contracts";
import { mergePreferences } from "../../core/accessibility-preferences/PreferencesMerge";
import { resolveMotionPreference } from "../../core/accessibility-preferences/MotionPreferenceResolver";
import type { MotionEnvironment } from "../../core/accessibility-preferences/MotionEnvironment";

type AccessibilityPreferencesProviderDependencies = {
  local: LocalAccessibilityPreferencesRepository;
  authenticated: AuthenticatedAccessibilityPreferencesRepository;
  motionEnvironment: MotionEnvironment;
};

type MotionPreference = "system" | "normal" | "reduced";

type AccessibilityPreferencesState = {
  configuredMotionPreference: MotionPreference;
  effectiveMotionPreference: "normal" | "reduced";
  error: AccessibilityPreferencesError | null;
};

type StateListener = (state: AccessibilityPreferencesState) => void;

function toPersistenceError(error: unknown): AccessibilityPreferencesError {
  return {
    code: "PERSISTENCE_FAILED",
    message:
      error instanceof Error
        ? error.message
        : "Falha ao persistir as preferências de acessibilidade.",
  };
}

export function createAccessibilityPreferencesProvider({
  local,
  authenticated,
  motionEnvironment,
}: AccessibilityPreferencesProviderDependencies) {
  const listeners = new Set<StateListener>();

  let currentState: AccessibilityPreferencesState | null = null;

  let hasAuthenticatedPreferences = false;

  let unsubscribeFromMotion: (() => void) | null = null;

  const subscribeToMotion = () => {
    if (unsubscribeFromMotion) {
      return;
    }

    unsubscribeFromMotion = motionEnvironment.subscribeToMotionPreference(
      updateEffectiveMotionPreference,
    );
  };

  const unsubscribeFromMotionPreference = () => {
    unsubscribeFromMotion?.();
    unsubscribeFromMotion = null;
  };

  const notify = () => {
    const state = currentState;

    if (!state) {
      return;
    }

    listeners.forEach((listener) => {
      listener(state);
    });
  };

  const updateEffectiveMotionPreference = (
    systemPreference: "normal" | "reduced",
  ) => {
    if (!currentState) {
      return;
    }

    currentState = {
      ...currentState,
      effectiveMotionPreference: resolveMotionPreference({
        configuredPreference: currentState.configuredMotionPreference,
        systemPreference,
      }),
    };

    notify();
  };

  return {
    async load(): Promise<AccessibilityPreferencesState> {
      const [localPreferences, authenticatedPreferences] = await Promise.all([
        local.load(),
        authenticated.load(),
      ]);

      hasAuthenticatedPreferences = authenticatedPreferences !== null;

      const merged = mergePreferences({
        local: {
          motionPreference: localPreferences?.preferences.motion,
        },
        authenticated: {
          motionPreference: authenticatedPreferences?.preferences.motion,
        },
      });

      currentState = {
        configuredMotionPreference: merged.motionPreference,
        effectiveMotionPreference: resolveMotionPreference({
          configuredPreference: merged.motionPreference,
          systemPreference: motionEnvironment.getSystemMotionPreference(),
        }),
        error: null,
      };

      notify();

      return currentState;
    },

    async setMotionPreference(preference: MotionPreference): Promise<void> {
      if (!currentState) {
        return;
      }

      currentState = {
        ...currentState,
        configuredMotionPreference: preference,
        effectiveMotionPreference: resolveMotionPreference({
          configuredPreference: preference,
          systemPreference: motionEnvironment.getSystemMotionPreference(),
        }),
        error: null,
      };

      try {
        await local.save({
          version: 1,
          preferences: {
            motion: preference,
          },
        });

        if (hasAuthenticatedPreferences) {
          await authenticated.save({
            version: 1,
            preferences: {
              motion: preference,
            },
          });
        }
      } catch (error) {
        currentState = {
          ...currentState,
          error: toPersistenceError(error),
        };
      }

      notify();
    },

    async getState(): Promise<AccessibilityPreferencesState | null> {
      return currentState;
    },

    subscribe(listener: StateListener) {
      listeners.add(listener);

      if (listeners.size === 1) {
        subscribeToMotion();
      }

      if (currentState) {
        listener(currentState);
      }

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
          unsubscribeFromMotionPreference();
        }
      };
    },
  };
}
