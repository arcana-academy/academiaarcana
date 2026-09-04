import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AccessibilityPreferencesProvider,
} from "../../application/accessibility-preferences/AccessibilityPreferencesContext";

import {
  FlontsProvider,
  useFlonts,
} from "./FlontsProvider";

function createWrapper(
  systemMotionPreference: "normal" | "reduced" = "normal",
  onSystemMotionPreferenceChange?: (
    listener: (
      preference: "normal" | "reduced",
    ) => void,
  ) => () => void,
) {
  return function Wrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <AccessibilityPreferencesProvider
        local={{
          load: async () => null,
          save: async () => {},
        }}
        authenticated={{
          load: async () => null,
          save: async () => {},
        }}
        motionEnvironment={{
          getSystemMotionPreference: () =>
            systemMotionPreference,
          subscribeToMotionPreference:
            onSystemMotionPreferenceChange ??
            (() => () => {}),
        }}
      >
        <FlontsProvider>
          {children}
        </FlontsProvider>
      </AccessibilityPreferencesProvider>
    );
  };
}

describe("FlontsProvider", () => {
  it("expõe o Provider de Flonts", () => {
    expect(FlontsProvider).toBeDefined();
  });

  it("expõe o hook público de Flonts", () => {
    expect(useFlonts).toBeDefined();
  });

  it("expõe o estado inicial de Flonts", async () => {
    const { result } = renderHook(
      () => useFlonts(),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.state).toEqual({
      mode: "idle",
      visibility: "visible",
      motionPreference: "normal",
      message: null,
    });
  });

  it("mostra Flonts através da ação show", async () => {
    const { result } = renderHook(
      () => useFlonts(),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.actions.hide();
    });

    expect(result.current.state.visibility).toBe("hidden");

    await act(async () => {
      result.current.actions.show();
    });

    expect(result.current.state.visibility).toBe("visible");
  });

  it("oculta Flonts através da ação hide", async () => {
    const { result } = renderHook(
      () => useFlonts(),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.actions.hide();
    });

    expect(result.current.state.visibility).toBe("hidden");
  });

  it("altera o modo de Flonts através da ação setMode", async () => {
    const { result } = renderHook(
      () => useFlonts(),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.actions.setMode("idle");
    });

    expect(result.current.state.mode).toBe("idle");
  });

  it("altera a mensagem de Flonts através da ação setMessage", async () => {
    const { result } = renderHook(
      () => useFlonts(),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.actions.setMessage(
        "Olá, sou o Flonts!",
      );
    });

    expect(result.current.state.message).toBe(
      "Olá, sou o Flonts!",
    );
  });

  it("remove a mensagem de Flonts através de setMessage", async () => {
    const { result } = renderHook(
      () => useFlonts(),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.actions.setMessage(
        "Mensagem temporária",
      );
    });

    expect(result.current.state.message).toBe(
      "Mensagem temporária",
    );

    await act(async () => {
      result.current.actions.setMessage(null);
    });

    expect(result.current.state.message).toBeNull();
  });

  it("usa a preferência efetiva de movimento fornecida pela acessibilidade", async () => {
    const { result } = renderHook(
      () => useFlonts(),
      {
        wrapper: createWrapper("reduced"),
      },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      result.current.state.motionPreference,
    ).toBe("reduced");
  });

  it("acompanha mudanças da preferência de movimento do sistema", async () => {
    let systemListener:
      | ((preference: "normal" | "reduced") => void)
      | undefined;

    const wrapper = createWrapper(
      "normal",
      (listener) => {
        systemListener = listener;

        return () => {
          systemListener = undefined;
        };
      },
    );

    const { result } = renderHook(
      () => useFlonts(),
      { wrapper },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.state).toEqual({
      mode: "idle",
      visibility: "visible",
      motionPreference: "normal",
      message: null,
    });

    await act(async () => {
      systemListener?.("reduced");
    });

    expect(result.current.state).toEqual({
      mode: "idle",
      visibility: "visible",
      motionPreference: "reduced",
      message: null,
    });
  });

  it("falha explicitamente quando useFlonts é usado fora do Provider", () => {
    expect(() => {
      renderHook(() => useFlonts());
    }).toThrow(
      "useFlonts deve ser usado dentro de FlontsProvider.",
    );
  });
});
