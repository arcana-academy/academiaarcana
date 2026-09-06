import { beforeEach, describe, expect, it, vi } from "vitest";

import { motionEnvironment } from "./MotionEnvironment";

describe("motionEnvironment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna normal quando o ambiente não possui window", () => {
    const originalWindow = globalThis.window;

    vi.stubGlobal("window", undefined);

    expect(motionEnvironment.getSystemMotionPreference()).toBe("normal");

    vi.stubGlobal("window", originalWindow);
  });

  it("retorna uma função de cancelamento quando o ambiente não possui window", () => {
    const originalWindow = globalThis.window;

    vi.stubGlobal("window", undefined);

    const unsubscribe = motionEnvironment.subscribeToMotionPreference(vi.fn());

    expect(unsubscribe).toBeTypeOf("function");

    vi.stubGlobal("window", originalWindow);
  });

  it("retorna reduced quando o sistema solicita redução de movimento", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({
        matches: true,
        addEventListener,
        removeEventListener,
      })),
    });

    expect(motionEnvironment.getSystemMotionPreference()).toBe("reduced");
  });

  it("retorna normal quando o sistema não solicita redução de movimento", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    expect(motionEnvironment.getSystemMotionPreference()).toBe("normal");
  });

  it("permite assinar e cancelar mudanças da preferência do sistema", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener,
        removeEventListener,
      })),
    });

    const listener = vi.fn();

    const unsubscribe = motionEnvironment.subscribeToMotionPreference(listener);

    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    unsubscribe();

    expect(removeEventListener).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("converte uma mudança do sistema em uma preferência reduced", () => {
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;

    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(
          (_event: string, listener: (event: MediaQueryListEvent) => void) => {
            changeListener = listener;
          },
        ),
        removeEventListener: vi.fn(),
      })),
    });

    const listener = vi.fn();

    motionEnvironment.subscribeToMotionPreference(listener);

    changeListener?.({
      matches: true,
    } as MediaQueryListEvent);

    expect(listener).toHaveBeenCalledWith("reduced");
  });

  it("converte uma mudança do sistema em uma preferência normal", () => {
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;

    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(
          (_event: string, listener: (event: MediaQueryListEvent) => void) => {
            changeListener = listener;
          },
        ),
        removeEventListener: vi.fn(),
      })),
    });

    const listener = vi.fn();

    motionEnvironment.subscribeToMotionPreference(listener);

    changeListener?.({
      matches: false,
    } as MediaQueryListEvent);

    expect(listener).toHaveBeenCalledWith("normal");
  });
});
