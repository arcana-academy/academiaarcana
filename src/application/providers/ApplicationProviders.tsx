"use client";

import type { ReactNode } from "react";

import {
  AccessibilityPreferencesProvider,
} from "@/application/accessibility-preferences/AccessibilityPreferencesContext";
import type { ApplicationIdentityState } from "@/application/identity/contracts";
import { FlontsProvider } from "@/application/flonts/FlontsProvider";
import { ThemeProvider } from "@/design-system/themes";

import type {
  AuthenticatedAccessibilityPreferencesRepository,
} from "@/core/accessibility-preferences/contracts";

import {
  createLocalAccessibilityPreferencesRepository,
  motionEnvironment,
} from "@/lib/accessibility-preferences";

type ApplicationProvidersProps = {
  children: ReactNode;
  identity: ApplicationIdentityState;
  authenticated?: AuthenticatedAccessibilityPreferencesRepository;
};

export function ApplicationProviders({
  children,
  identity,
  authenticated,
}: ApplicationProvidersProps) {
  const local =
    createLocalAccessibilityPreferencesRepository();

  return (
    <ThemeProvider initialTheme="mago-classico">
      <AccessibilityPreferencesProvider
        local={local}
        authenticated={authenticated}
        motionEnvironment={motionEnvironment}
        identity={identity}
      >
        <FlontsProvider>
          {children}
        </FlontsProvider>
      </AccessibilityPreferencesProvider>
    </ThemeProvider>
  );
}