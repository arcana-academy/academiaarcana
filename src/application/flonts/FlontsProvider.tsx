"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

import { useMotionPreference } from "../../application/accessibility-preferences/hooks/hooks";

import type {
  FlontsActions,
  FlontsMode,
  FlontsState,
} from "../../domains/flonts/contracts";

type FlontsContextValue = {
  state: FlontsState;
  actions: FlontsActions;
};

const FlontsContext =
  createContext<FlontsContextValue | null>(null);

export function FlontsProvider({
  children,
}: PropsWithChildren) {
  const {
    effectiveMotionPreference,
  } = useMotionPreference();

  const [mode, setMode] =
    useState<FlontsMode>("idle");

  const [visibility, setVisibility] =
    useState<FlontsState["visibility"]>("visible");

  const [message, setMessage] =
    useState<string | null>(null);

  const state: FlontsState = useMemo(
    () => ({
      mode,
      visibility,
      motionPreference:
        effectiveMotionPreference,
      message,
    }),
    [
      mode,
      visibility,
      effectiveMotionPreference,
      message,
    ],
  );

  const actions: FlontsActions = useMemo(
    () => ({
      show: () => {
        setVisibility("visible");
      },

      hide: () => {
        setVisibility("hidden");
      },

      setMode: (nextMode) => {
        setMode(nextMode);
      },

      setMessage: (nextMessage) => {
        setMessage(nextMessage);
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions],
  );

  return (
    <FlontsContext.Provider value={value}>
      {children}
    </FlontsContext.Provider>
  );
}

export function useFlonts(): FlontsContextValue {
  const context = useContext(FlontsContext);

  if (!context) {
    throw new Error(
      "useFlonts deve ser usado dentro de FlontsProvider.",
    );
  }

  return context;
}