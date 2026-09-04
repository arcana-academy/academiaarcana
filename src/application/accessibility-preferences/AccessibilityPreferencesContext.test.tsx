import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AccessibilityPreferencesContext,
  AccessibilityPreferencesProvider,
  useAccessibilityPreferencesContext,
} from "./AccessibilityPreferencesContext";

function createDependencies() {
  return {
    local: {
      load: async () => null,
      save: async () => {},
    },
    authenticated: {
      load: async () => null,
      save: async () => {},
    },
    motionEnvironment: {
      getSystemMotionPreference: () => "normal" as const,
      subscribeToMotionPreference: () => () => {},
    },
  };
}

describe("AccessibilityPreferencesContext", () => {
  it("expõe o contexto de preferências de acessibilidade", () => {
    expect(AccessibilityPreferencesContext).toBeDefined();
  });

  it("expõe o Provider React de preferências de acessibilidade", () => {
    expect(AccessibilityPreferencesProvider).toBeDefined();
  });

  it("mantém o contexto funcional durante uma atualização do componente", async () => {
    const dependencies = createDependencies();

    const wrapper = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <AccessibilityPreferencesProvider
        {...dependencies}
      >
        {children}
      </AccessibilityPreferencesProvider>
    );

    const { result, rerender } = renderHook(
      () => useAccessibilityPreferencesContext(),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.state).not.toBeNull();
    });

    const firstContext = result.current;

    await act(async () => {
      rerender();
    });

    const secondContext = result.current;

    expect(firstContext).toBeDefined();
    expect(secondContext).toBeDefined();
    expect(
      secondContext.setMotionPreference,
    ).toBeTypeOf("function");
  });
});