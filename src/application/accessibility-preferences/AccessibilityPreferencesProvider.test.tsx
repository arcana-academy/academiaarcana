import { describe, expect, it } from "vitest";

import { createAccessibilityPreferencesProvider } from "./AccessibilityPreferencesProvider";

describe("AccessibilityPreferencesProvider", () => {
  it("compõe a preferência autenticada sobre a preferência local", async () => {
    const local = {
      load: async () => ({
        version: 1 as const,
        preferences: {
          motion: "normal" as const,
        },
      }),
      save: async () => {},
    };

    const authenticated = {
      load: async () => ({
        version: 1 as const,
        preferences: {
          motion: "reduced" as const,
        },
      }),
      save: async () => {},
    };

    const provider =
      createAccessibilityPreferencesProvider({
        local,
        authenticated,
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        },
      });

    const state = await provider.load();

    expect(state.configuredMotionPreference).toBe(
      "reduced",
    );
    expect(state.effectiveMotionPreference).toBe(
      "reduced",
    );
  });

  it("usa a preferência do sistema quando a configuração é system", async () => {
    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async () => {},
        },
        authenticated: {
          load: async () => ({
            version: 1 as const,
            preferences: {
              motion: "system" as const,
            },
          }),
          save: async () => {},
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "reduced",
          subscribeToMotionPreference: () => () => {},
        },
      });

    const state = await provider.load();

    expect(state.configuredMotionPreference).toBe(
      "system",
    );
    expect(state.effectiveMotionPreference).toBe(
      "reduced",
    );
  });

  it("notifica quando a preferência do sistema muda", async () => {
    let systemListener:
      | ((preference: "normal" | "reduced") => void)
      | undefined;

    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async () => {},
        },
        authenticated: {
          load: async () => ({
            version: 1 as const,
            preferences: {
              motion: "system" as const,
            },
          }),
          save: async () => {},
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: (listener) => {
            systemListener = listener;
            return () => {};
          },
        },
      });

    const states: Array<{
      configuredMotionPreference:
        | "system"
        | "normal"
        | "reduced";
      effectiveMotionPreference:
        | "normal"
        | "reduced";
    }> = [];

    const unsubscribe = provider.subscribe((state) => {
      states.push(state);
    });

    await provider.load();

    expect(states).toHaveLength(1);
    expect(
      states[0]?.effectiveMotionPreference,
    ).toBe("normal");

    systemListener?.("reduced");

    expect(states).toHaveLength(2);
    expect(
      states[1]?.effectiveMotionPreference,
    ).toBe("reduced");

    unsubscribe();
  });

  it("altera a preferência de movimento imediatamente", async () => {
    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async () => {},
        },
        authenticated: {
          load: async () => null,
          save: async () => {},
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        },
      });

    await provider.load();

    const states: Array<{
      configuredMotionPreference:
        | "system"
        | "normal"
        | "reduced";
      effectiveMotionPreference:
        | "normal"
        | "reduced";
    }> = [];

    provider.subscribe((state) => {
      states.push(state);
    });

    await provider.setMotionPreference("reduced");

    expect(
      states.at(-1)?.configuredMotionPreference,
    ).toBe("reduced");
    expect(
      states.at(-1)?.effectiveMotionPreference,
    ).toBe("reduced");
  });

  it("persiste a preferência local quando a preferência de movimento muda", async () => {
    let savedPreferences:
      | {
          version: 1;
          preferences: {
            motion:
              | "system"
              | "normal"
              | "reduced";
          };
        }
      | null = null;

    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async (preferences) => {
            savedPreferences = preferences;
          },
        },
        authenticated: {
          load: async () => null,
          save: async () => {},
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        },
      });

    await provider.load();
    await provider.setMotionPreference("reduced");

    expect(savedPreferences).toEqual({
      version: 1,
      preferences: {
        motion: "reduced",
      },
    });
  });

  it("persiste a preferência autenticada quando a preferência de movimento muda", async () => {
    let savedPreferences:
      | {
          version: 1;
          preferences: {
            motion:
              | "system"
              | "normal"
              | "reduced";
          };
        }
      | null = null;

    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async () => {},
        },
        authenticated: {
          load: async () => ({
            version: 1 as const,
            preferences: {
              motion: "normal" as const,
            },
          }),
          save: async (preferences) => {
            savedPreferences = preferences;
          },
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        },
      });

    await provider.load();
    await provider.setMotionPreference("reduced");

    expect(savedPreferences).toEqual({
      version: 1,
      preferences: {
        motion: "reduced",
      },
    });
  });

  it("não persiste no repositório autenticado quando não há preferência autenticada", async () => {
    let authenticatedSaveCalled = false;

    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async () => {},
        },
        authenticated: {
          load: async () => null,
          save: async () => {
            authenticatedSaveCalled = true;
          },
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        },
      });

    await provider.load();
    await provider.setMotionPreference("reduced");

    expect(authenticatedSaveCalled).toBe(false);
  });

  it("mantém a nova preferência e expõe erro estruturado quando a persistência local falha", async () => {
    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async () => {
            throw new Error(
              "falha de persistência local",
            );
          },
        },
        authenticated: {
          load: async () => null,
          save: async () => {},
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        },
      });

    await provider.load();

    await provider.setMotionPreference("reduced");

    const state = await provider.getState();

    expect(state).not.toBeNull();

    if (!state) {
      throw new Error(
        "O estado deveria existir após setMotionPreference.",
      );
    }

    expect(state.configuredMotionPreference).toBe(
      "reduced",
    );
    expect(state.effectiveMotionPreference).toBe(
      "reduced",
    );

    expect(state.error).toEqual({
      code: "PERSISTENCE_FAILED",
      message: "falha de persistência local",
    });
  });

  it("volta a observar a preferência do sistema após uma nova inscrição", async () => {
    let subscribeCalls = 0;
    let systemListener:
      | ((preference: "normal" | "reduced") => void)
      | undefined;

    const provider =
      createAccessibilityPreferencesProvider({
        local: {
          load: async () => null,
          save: async () => {},
        },
        authenticated: {
          load: async () => null,
          save: async () => {},
        },
        motionEnvironment: {
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: (listener) => {
            subscribeCalls += 1;
            systemListener = listener;

            return () => {};
          },
        },
      });

    await provider.load();

    const firstUnsubscribe = provider.subscribe(
      () => {},
    );

    expect(subscribeCalls).toBe(1);

    firstUnsubscribe();

    const secondStates: Array<{
      configuredMotionPreference:
        | "system"
        | "normal"
        | "reduced";
      effectiveMotionPreference:
        | "normal"
        | "reduced";
    }> = [];

    const secondUnsubscribe = provider.subscribe(
      (state) => {
        secondStates.push(state);
      },
    );

    expect(subscribeCalls).toBe(2);

    systemListener?.("reduced");

    expect(
      secondStates.at(-1)?.effectiveMotionPreference,
    ).toBe("reduced");

    secondUnsubscribe();
  });
});