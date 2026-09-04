import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AccessibilityPreferencesProvider,
} from "../AccessibilityPreferencesContext";
import { useMotionPreference } from "./hooks";

describe("accessibility-preferences hooks", () => {
  it("expõe o estado composto de preferências de acessibilidade", () => {
    expect(AccessibilityPreferencesProvider).toBeDefined();
  });

  it("expõe o hook especializado de preferência de movimento", () => {
    expect(useMotionPreference).toBeDefined();
  });

  it("expõe a preferência de movimento carregada pelo Provider", async () => {
    const wrapper = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <AccessibilityPreferencesProvider
        local={{
          load: async () => null,
          save: async () => {},
        }}
        authenticated={{
          load: async () => ({
            version: 1 as const,
            preferences: {
              motion: "reduced" as const,
            },
          }),
          save: async () => {},
        }}
        motionEnvironment={{
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        }}
      >
        {children}
      </AccessibilityPreferencesProvider>
    );

    const { result } = renderHook(
      () => useMotionPreference(),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.configuredMotionPreference).toBe(
        "reduced",
      );
    });

    expect(result.current.effectiveMotionPreference).toBe(
      "reduced",
    );
    expect(result.current.error).toBeNull();
  });
    it("altera a preferência de movimento através do hook", async () => {
    const wrapper = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
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
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        }}
      >
        {children}
      </AccessibilityPreferencesProvider>
    );

    const { result } = renderHook(
      () => useMotionPreference(),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.configuredMotionPreference).toBe(
        "system",
      );
    });

    await act(async () => {
  await result.current.setMotionPreference("reduced");
});

    await waitFor(() => {
      expect(result.current.configuredMotionPreference).toBe(
        "reduced",
      );
    });

    expect(result.current.effectiveMotionPreference).toBe(
      "reduced",
    );
  });
    it("expõe o erro estruturado de persistência através do hook", async () => {
    const wrapper = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <AccessibilityPreferencesProvider
        local={{
          load: async () => null,
          save: async () => {
            throw new Error("falha de persistência local");
          },
        }}
        authenticated={{
          load: async () => null,
          save: async () => {},
        }}
        motionEnvironment={{
          getSystemMotionPreference: () => "normal",
          subscribeToMotionPreference: () => () => {},
        }}
      >
        {children}
      </AccessibilityPreferencesProvider>
    );

    const { result } = renderHook(
      () => useMotionPreference(),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.configuredMotionPreference).toBe(
        "system",
      );
    });

    await act(async () => {
      await result.current.setMotionPreference("reduced");
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        code: "PERSISTENCE_FAILED",
        message: "falha de persistência local",
      });
    });

    expect(result.current.configuredMotionPreference).toBe(
      "reduced",
    );
    expect(result.current.effectiveMotionPreference).toBe(
      "reduced",
    );
  });
});