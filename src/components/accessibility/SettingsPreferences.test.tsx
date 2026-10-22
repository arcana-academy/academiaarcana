// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsPreferences } from "./SettingsPreferences";

const handlers = vi.hoisted(() => ({
  setAppearance: vi.fn(),
  updateReading: vi.fn(),
  setMotionPreference: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/application/appearance/SiteAppearanceProvider", () => ({
  useSiteAppearance: () => ({
    appearance: "system",
    setAppearance: handlers.setAppearance,
  }),
}));
vi.mock("@/application/accessibility-preferences/useReadingPreferences", () => ({
  useReadingPreferences: () => ({
    reading: {
      largeText: false,
      extraSpacing: false,
      highContrast: false,
      focusMode: false,
    },
    updateReading: handlers.updateReading,
    storageWarning: false,
  }),
}));
vi.mock("@/application/accessibility-preferences/AccessibilityPreferencesContext", () => ({
  useAccessibilityPreferencesContext: () => ({
    state: { configuredMotionPreference: "system", error: null },
    setMotionPreference: handlers.setMotionPreference,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Configurações acessíveis", () => {
  it("starts with the approved automatic theme and permits an explicit choice", () => {
    render(<SettingsPreferences />);
    const theme = screen.getByRole("combobox", { name: "Aparência do site" });
    expect(theme).toHaveValue("system");
    fireEvent.change(theme, { target: { value: "light" } });
    expect(handlers.setAppearance).toHaveBeenCalledWith("light");
  });

  it("shares text preferences without changing the grimoire page model", () => {
    render(<SettingsPreferences />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Ampliar texto" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Reforçar contraste" }));
    expect(handlers.updateReading).toHaveBeenCalledWith("largeText", true);
    expect(handlers.updateReading).toHaveBeenCalledWith("highContrast", true);
    expect(screen.getByText(/preferências dos grimórios pessoais são independentes/i)).toBeInTheDocument();
  });

  it("reuses the existing motion preference provider", () => {
    render(<SettingsPreferences />);
    fireEvent.change(screen.getByRole("combobox", { name: "Animações" }), {
      target: { value: "reduced" },
    });
    expect(handlers.setMotionPreference).toHaveBeenCalledWith("reduced");
  });
});
