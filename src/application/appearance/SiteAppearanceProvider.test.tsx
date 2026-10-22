// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/design-system/themes";
import { PersonalizationPanel } from "@/components/personalization/PersonalizationPanel";
import { SiteAppearanceProvider, useSiteAppearance } from "./SiteAppearanceProvider";
import { APPEARANCE_STORAGE_KEY, CUSTOM_THEME_STORAGE_KEY } from "./appearance-policy";

vi.mock("@/application/accessibility-preferences/AccessibilityPreferencesContext", () => ({
  useAccessibilityPreferencesContext: () => ({
    state: { configuredMotionPreference: "system", error: null },
    setMotionPreference: vi.fn(),
  }),
}));

function Probe() {
  const { appearance } = useSiteAppearance();
  const { theme } = useTheme();
  return <output data-testid="appearance-state">{appearance} / {theme}</output>;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("Tema inicial e personalização compatíveis", () => {
  it("preserves the approved automatic default and retains advanced presets without stale settings", async () => {
    render(
      <ThemeProvider>
        <SiteAppearanceProvider>
          <PersonalizationPanel />
          <Probe />
        </SiteAppearanceProvider>
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("appearance-state")).toHaveTextContent("system / arcana-noturna");
    });

    const selector = screen.getByLabelText("Escolha um tema");
    fireEvent.change(selector, { target: { value: "escuro" } });
    await waitFor(() => {
      expect(screen.getByTestId("appearance-state")).toHaveTextContent("custom / escuro");
    });
    expect(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("custom");
    expect(window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY)).toBe("escuro");

    fireEvent.change(selector, { target: { value: "arcana-pergaminho" } });
    await waitFor(() => {
      expect(screen.getByTestId("appearance-state")).toHaveTextContent("light / arcana-pergaminho");
    });
    expect(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
  });
});
