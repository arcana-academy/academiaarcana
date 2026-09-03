import { describe, expect, it, vi } from "vitest";

import { createMotionEnvironment } from "./MotionEnvironment";

describe("MotionEnvironment", () => {
  it("retorna normal quando o navegador não está disponível", () => {
    const environment = createMotionEnvironment();

    expect(environment.getSystemMotionPreference()).toBe("normal");
  });

  it("retorna reduced quando o sistema prefere reduzir movimento", () => {
    const matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal("window", {
      matchMedia,
    });

    const environment = createMotionEnvironment();

    expect(environment.getSystemMotionPreference()).toBe("reduced");

    vi.unstubAllGlobals();
  });

  it("retorna normal quando o sistema não prefere reduzir movimento", () => {
    const matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal("window", {
      matchMedia,
    });

    const environment = createMotionEnvironment();

    expect(environment.getSystemMotionPreference()).toBe("normal");

    vi.unstubAllGlobals();
  });

  it("notifica quando a preferência do sistema muda", () => {
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;

    const addEventListener = vi.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        changeListener = listener;
      },
    );

    const removeEventListener = vi.fn();

    const matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener,
      removeEventListener,
    }));

    vi.stubGlobal("window", {
      matchMedia,
    });

    const environment = createMotionEnvironment();
    const listener = vi.fn();

    environment.subscribeToMotionPreference(listener);

    changeListener?.({
      matches: true,
    } as MediaQueryListEvent);

    expect(listener).toHaveBeenCalledWith("reduced");

    changeListener?.({
      matches: false,
    } as MediaQueryListEvent);

    expect(listener).toHaveBeenCalledWith("normal");

    vi.unstubAllGlobals();
  });

  it("remove o listener ao cancelar a inscrição", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    const matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener,
      removeEventListener,
    }));

    vi.stubGlobal("window", {
      matchMedia,
    });

    const environment = createMotionEnvironment();
    const listener = vi.fn();

    const unsubscribe = environment.subscribeToMotionPreference(listener);

    unsubscribe();

    expect(removeEventListener).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    vi.unstubAllGlobals();
  });
});
