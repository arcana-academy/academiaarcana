import { describe, expect, it } from "vitest";

import type {
  MotionEnvironment,
  SystemMotionPreference,
} from "./MotionEnvironment";

describe("MotionEnvironment", () => {
  it("define as preferências de movimento do sistema", () => {
    const preference: SystemMotionPreference = "reduced";

    expect(preference).toBe("reduced");
  });

  it("define o contrato do ambiente de movimento", () => {
    const listeners = new Set<(preference: SystemMotionPreference) => void>();

    const environment: MotionEnvironment = {
      getSystemMotionPreference: () => "normal",
      subscribeToMotionPreference: (listener) => {
        listeners.add(listener);

        return () => {
          listeners.delete(listener);
        };
      },
    };

    expect(environment.getSystemMotionPreference()).toBe("normal");
    expect(listeners.size).toBe(0);

    const unsubscribe = environment.subscribeToMotionPreference(() => {});

    expect(listeners.size).toBe(1);

    unsubscribe();

    expect(listeners.size).toBe(0);
  });
});
