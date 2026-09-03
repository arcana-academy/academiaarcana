import type {
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
};

type StateListener = (state: AccessibilityPreferencesState) => void;

export function createAccessibilityPreferencesProvider({
  local,
  authenticated,
  motionEnvironment,
}: AccessibilityPreferencesProviderDependencies) {
  const listeners = new Set<StateListener>();

  let currentState: AccessibilityPreferencesState | null = null;
  let hasAuthenticatedPreferences = false;

  const notify = () => {
    if (!currentState) {
      return;
    }

    listeners.forEach((listener) => {
      listener(currentState as AccessibilityPreferencesState);
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

  const unsubscribeFromMotion = motionEnvironment.subscribeToMotionPreference(
    updateEffectiveMotionPreference,
  );

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
      };

      const preferences = {
        version: 1 as const,
        preferences: {
          motion: preference,
        },
      };

      await local.save(preferences);

      if (hasAuthenticatedPreferences) {
        await authenticated.save(preferences);
      }

      notify();
    },

    subscribe(listener: StateListener) {
      listeners.add(listener);

      if (currentState) {
        listener(currentState);
      }

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
          unsubscribeFromMotion();
        }
      };
    },
  };
}
