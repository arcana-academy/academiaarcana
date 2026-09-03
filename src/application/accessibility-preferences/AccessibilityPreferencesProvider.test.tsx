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

    const provider = createAccessibilityPreferencesProvider({
      local,
      authenticated,
      motionEnvironment: {
        getSystemMotionPreference: () => "normal",
        subscribeToMotionPreference: () => () => {},
      },
    });

    const state = await provider.load();

    expect(state.configuredMotionPreference).toBe("reduced");
    expect(state.effectiveMotionPreference).toBe("reduced");
  });

  it("usa a preferência do sistema quando a configuração é system", async () => {
    const provider = createAccessibilityPreferencesProvider({
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

    expect(state.configuredMotionPreference).toBe("system");
    expect(state.effectiveMotionPreference).toBe("reduced");
  });

  it("notifica quando a preferência do sistema muda", async () => {
    let systemListener:
      | ((preference: "normal" | "reduced") => void)
      | undefined;

    const provider = createAccessibilityPreferencesProvider({
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
      configuredMotionPreference: "system" | "normal" | "reduced";
      effectiveMotionPreference: "normal" | "reduced";
    }> = [];

    const unsubscribe = provider.subscribe((state) => {
      states.push(state);
    });

    await provider.load();

    expect(states).toHaveLength(1);
    expect(states[0]?.effectiveMotionPreference).toBe("normal");

    systemListener?.("reduced");

    expect(states).toHaveLength(2);
    expect(states[1]?.effectiveMotionPreference).toBe("reduced");

    unsubscribe();
  });

  it("altera a preferência de movimento imediatamente", async () => {
    const provider = createAccessibilityPreferencesProvider({
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
      configuredMotionPreference: "system" | "normal" | "reduced";
      effectiveMotionPreference: "normal" | "reduced";
    }> = [];

    provider.subscribe((state) => {
      states.push(state);
    });

    await provider.setMotionPreference("reduced");

    expect(states.at(-1)?.configuredMotionPreference).toBe("reduced");
    expect(states.at(-1)?.effectiveMotionPreference).toBe("reduced");
  });

  it("persiste a preferência local quando a preferência de movimento muda", async () => {
    let savedPreferences:
      | {
          version: 1;
          preferences: {
            motion: "system" | "normal" | "reduced";
          };
        }
      | null = null;

    const provider = createAccessibilityPreferencesProvider({
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
            motion: "system" | "normal" | "reduced";
          };
        }
      | null = null;

    const provider = createAccessibilityPreferencesProvider({
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
});