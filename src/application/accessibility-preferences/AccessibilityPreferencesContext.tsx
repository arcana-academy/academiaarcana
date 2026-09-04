"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createAccessibilityPreferencesProvider,
} from "./AccessibilityPreferencesProvider";

import type {
  AuthenticatedAccessibilityPreferencesRepository,
  LocalAccessibilityPreferencesRepository,
} from "../../core/accessibility-preferences/contracts";

import type { MotionEnvironment } from "../../core/accessibility-preferences/MotionEnvironment";

type AccessibilityPreferencesProviderDependencies = {
  local: LocalAccessibilityPreferencesRepository;
  authenticated: AuthenticatedAccessibilityPreferencesRepository;
  motionEnvironment: MotionEnvironment;
};

type AccessibilityPreferencesState = {
  configuredMotionPreference:
    | "system"
    | "normal"
    | "reduced";
  effectiveMotionPreference:
    | "normal"
    | "reduced";
  error: {
    code: "PERSISTENCE_FAILED";
    message: string;
  } | null;
};

type AccessibilityPreferencesContextValue = {
  state: AccessibilityPreferencesState | null;
  setMotionPreference: (
    preference:
      | "system"
      | "normal"
      | "reduced",
  ) => Promise<void>;
};

export const AccessibilityPreferencesContext =
  createContext<AccessibilityPreferencesContextValue | null>(
    null,
  );

export function AccessibilityPreferencesProvider({
  children,
  local,
  authenticated,
  motionEnvironment,
}: PropsWithChildren<
  AccessibilityPreferencesProviderDependencies
>) {
  const [provider] = useState(() =>
    createAccessibilityPreferencesProvider({
      local,
      authenticated,
      motionEnvironment,
    }),
  );

  const [state, setState] =
    useState<AccessibilityPreferencesState | null>(
      null,
    );

  useEffect(() => {
    const unsubscribe = provider.subscribe(setState);

    void provider.load();

    return unsubscribe;
  }, [provider]);

  const value: AccessibilityPreferencesContextValue = {
    state,

    async setMotionPreference(preference) {
      await provider.setMotionPreference(preference);
    },
  };

  return (
    <AccessibilityPreferencesContext.Provider
      value={value}
    >
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
}

export function useAccessibilityPreferencesContext() {
  const context = useContext(
    AccessibilityPreferencesContext,
  );

  if (!context) {
    throw new Error(
      "useAccessibilityPreferencesContext deve ser usado dentro de AccessibilityPreferencesProvider.",
    );
  }

  return context;
}