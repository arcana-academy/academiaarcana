import { describe, expect, it } from "vitest";

import type { MotionEnvironment } from "./MotionEnvironment";

describe("MotionEnvironment contract", () => {
  it("define a leitura da preferência do sistema", () => {
    const environment: MotionEnvironment = {
      getSystemMotionPreference: () => "normal",
      subscribeToMotionPreference: () => () => {},
    };

    expect(environment.getSystemMotionPreference()).toBe("normal");
  });

  it("define a assinatura de inscrição e cancelamento", () => {
    let listenerCalled = false;

    const environment: MotionEnvironment = {
      getSystemMotionPreference: () => "reduced",
      subscribeToMotionPreference: (listener) => {
        listener("reduced");
        listenerCalled = true;

        return () => {};
      },
    };

    const unsubscribe = environment.subscribeToMotionPreference(() => {});

    expect(listenerCalled).toBe(true);
    expect(unsubscribe).toEqual(expect.any(Function));
  });
});
