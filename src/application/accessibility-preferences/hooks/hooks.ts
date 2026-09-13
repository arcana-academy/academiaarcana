"use client";

import { useAccessibilityPreferencesContext } from "../AccessibilityPreferencesContext";

export function useAccessibilityPreferences() {
  return useAccessibilityPreferencesContext();
}

export function useMotionPreference() {
  const { state, setMotionPreference } = useAccessibilityPreferencesContext();

  return {
    configuredMotionPreference: state?.configuredMotionPreference ?? "system",
    effectiveMotionPreference: state?.effectiveMotionPreference ?? "normal",
    setMotionPreference,
    error: state?.error ?? null,
  };
}
