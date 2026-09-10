import { describe, expect, it } from "vitest";

import type {
  AuthenticatedAccessibilityPreferencesRepository,
  LocalAccessibilityPreferencesRepository,
  PersistedAccessibilityPreferences,
} from "@/core/accessibility-preferences/contracts";

import type { MotionEnvironment } from "@/core/accessibility-preferences/MotionEnvironment";

import type { ApplicationIdentityState } from "@/application/identity/contracts";

import {
  createAccessibilityPreferencesProvider,
} from "./AccessibilityPreferencesProvider";

describe("AccessibilityPreferencesProvider", () => {
  function createDependencies() {
    let savedLocalPreferences:
      | PersistedAccessibilityPreferences
      | null = null;

    let savedAuthenticatedPreferences:
      | PersistedAccessibilityPreferences
      | null = null;

    let systemMotionPreference:
      | "normal"
      | "reduced" = "normal";

    const local: LocalAccessibilityPreferencesRepository = {
      load: async () => null,

      save: async (
        preferences,
      ) => {
        savedLocalPreferences = preferences;
      },
    };

    const authenticated: AuthenticatedAccessibilityPreferencesRepository =
      {
        load: async () => null,

        save: (
          _subjectId,
          preferences,
        ) => {
          savedAuthenticatedPreferences =
            preferences;
          return Promise.resolve();
        },
      };

    const motionEnvironment: MotionEnvironment = {
      getSystemMotionPreference: () =>
        systemMotionPreference,

      subscribeToMotionPreference: (
        listener,
      ) => {
        void listener;

        return () => {};
      },
    };

    const identity: ApplicationIdentityState =
      {
        status: "authenticated",
        identity: {
          subjectId: "user-123",
          status: "active",
        },
        error: null,
      };

    return {
      local,
      authenticated,
      motionEnvironment,
      identity,

      getSavedLocalPreferences: () =>
        savedLocalPreferences,

      getSavedAuthenticatedPreferences: () =>
        savedAuthenticatedPreferences,

      setSystemMotionPreference: (
        preference: "normal" | "reduced",
      ) => {
        systemMotionPreference =
          preference;
      },
    };
  }

  it("compõe a preferência autenticada sobre a preferência local", async () => {
    const dependencies = createDependencies();

    dependencies.local.load = async () => ({
      version: 1 as const,
      preferences: {
        motion: "reduced" as const,
      },
    });

    dependencies.authenticated.load =
      async () => ({
        version: 1 as const,
        preferences: {
          motion: "normal" as const,
        },
      });

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    const state = await provider.load();

    expect(
      state.configuredMotionPreference,
    ).toBe("normal");

    expect(
      state.effectiveMotionPreference,
    ).toBe("normal");
  });

  it("resolve a preferência system conforme o ambiente", async () => {
    const dependencies = createDependencies();

    dependencies.authenticated.load =
      async () => ({
        version: 1 as const,
        preferences: {
          motion: "system" as const,
        },
      });

    dependencies.setSystemMotionPreference(
      "reduced",
    );

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    const state = await provider.load();

    expect(
      state.configuredMotionPreference,
    ).toBe("system");

    expect(
      state.effectiveMotionPreference,
    ).toBe("reduced");
  });

  it("notifica quando a preferência system do ambiente muda", async () => {
    const listenerState: {
      current:
        | ((
            preference:
              | "normal"
              | "reduced",
          ) => void)
        | null;
    } = {
      current: null,
    };

    const dependencies = createDependencies();

    dependencies.authenticated.load =
      async () => ({
        version: 1 as const,
        preferences: {
          motion: "system" as const,
        },
      });

    dependencies.motionEnvironment.subscribeToMotionPreference =
      (
        nextListener,
      ) => {
        listenerState.current =
          nextListener;

        return () => {
          listenerState.current = null;
        };
      };

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    const states: Array<{
      configuredMotionPreference: string;
      effectiveMotionPreference: string;
    }> = [];

    provider.subscribe((state) => {
      states.push({
        configuredMotionPreference:
          state.configuredMotionPreference,

        effectiveMotionPreference:
          state.effectiveMotionPreference,
      });
    });

    await provider.load();

    listenerState.current?.("reduced");

    expect(
      states.at(-1)
        ?.configuredMotionPreference,
    ).toBe("system");

    expect(
      states.at(-1)
        ?.effectiveMotionPreference,
    ).toBe("reduced");
  });

  it("altera a preferência de movimento imediatamente", async () => {
    const dependencies = createDependencies();

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    await provider.load();

    await provider.setMotionPreference(
      "reduced",
    );

    const state = provider.getState();

    expect(
      state?.configuredMotionPreference,
    ).toBe("reduced");

    expect(
      state?.effectiveMotionPreference,
    ).toBe("reduced");
  });

  it("persiste a preferência local", async () => {
    const dependencies = createDependencies();

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    await provider.load();

    await provider.setMotionPreference(
      "reduced",
    );

    expect(
      dependencies.getSavedLocalPreferences(),
    ).toEqual({
      version: 1,
      preferences: {
        motion: "reduced",
      },
    });
  });

  it("persiste a preferência autenticada quando existe preferência autenticada", async () => {
    const dependencies = createDependencies();

    dependencies.authenticated.load =
      async () => ({
        version: 1 as const,
        preferences: {
          motion: "normal" as const,
        },
      });

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    await provider.load();

    await provider.setMotionPreference(
      "reduced",
    );

    expect(
      dependencies.getSavedAuthenticatedPreferences(),
    ).toEqual({
      version: 1,
      preferences: {
        motion: "reduced",
      },
    });
  });

  it("persiste no repositório autenticado quando existe identidade autenticada mesmo sem preferência anterior", async () => {
    const dependencies = createDependencies();

    let authenticatedSaveCalled = false;

    dependencies.authenticated.save =
      async (
        subjectId,
        preferences,
      ) => {
        authenticatedSaveCalled = true;

        expect(subjectId).toBe(
          "user-123",
        );

        expect(preferences).toEqual({
          version: 1,
          preferences: {
            motion: "reduced",
          },
        });
      };

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    await provider.load();

    await provider.setMotionPreference(
      "reduced",
    );

    expect(
      authenticatedSaveCalled,
    ).toBe(true);
  });

  it("mantém a preferência atual e sinaliza erro estruturado quando a persistência local falha", async () => {
    const dependencies = createDependencies();

    dependencies.local.save = async () => {
      throw new Error(
        "Falha ao salvar preferência local.",
      );
    };

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    await provider.load();

    await provider.setMotionPreference(
      "reduced",
    );

    expect(provider.getState()).toEqual({
      configuredMotionPreference: "reduced",

      effectiveMotionPreference: "reduced",

      error: {
        code: "PERSISTENCE_FAILED",

        message:
          "Falha ao salvar preferência local.",
      },
    });
  });

  it("reinicia a observação do sistema ao se inscrever novamente", async () => {
    let subscribeCount = 0;
    let unsubscribeCount = 0;

    const dependencies = createDependencies();

    dependencies.motionEnvironment.subscribeToMotionPreference =
      () => {
        subscribeCount += 1;

        return () => {
          unsubscribeCount += 1;
        };
      };

    const provider =
      createAccessibilityPreferencesProvider(
        dependencies,
      );

    const unsubscribeFirst =
      provider.subscribe(
        () => {},
      );

    unsubscribeFirst();

    const unsubscribeSecond =
      provider.subscribe(
        () => {},
      );

    expect(subscribeCount).toBe(2);

    expect(unsubscribeCount).toBe(1);

    unsubscribeSecond();

    expect(unsubscribeCount).toBe(2);
  });

  it("usa o subjectId da identidade autenticada na persistência", async () => {
    let loadedSubjectId:
      | string
      | null = null;

    let savedSubjectId:
      | string
      | null = null;

    const local:
      LocalAccessibilityPreferencesRepository =
        {
          load: async () => null,

          save: async () => {},
        };

    const authenticated:
      AuthenticatedAccessibilityPreferencesRepository =
        {
          load: async (subjectId) => {
            loadedSubjectId = subjectId;

            return {
              version: 1 as const,

              preferences: {
                motion: "normal" as const,
              },
            };
          },

          save: async (subjectId) => {
            savedSubjectId = subjectId;
          },
        };

    const motionEnvironment:
      MotionEnvironment = {
        getSystemMotionPreference:
          () => "normal",

        subscribeToMotionPreference:
          () => () => {},
      };

    const provider =
      createAccessibilityPreferencesProvider(
        {
          local,
          authenticated,
          motionEnvironment,

          identity: {
            status: "authenticated",

            identity: {
              subjectId: "user-123",
              status: "active",
            },

            error: null,
          },
        },
      );

    await provider.load();

    expect(loadedSubjectId).toBe(
      "user-123",
    );

    await provider.setMotionPreference(
      "reduced",
    );

    expect(savedSubjectId).toBe(
      "user-123",
    );
  });
});
