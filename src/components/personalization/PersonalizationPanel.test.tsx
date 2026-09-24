// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PersonalizationPanel } from "./PersonalizationPanel";

const setTheme = vi.fn();

vi.mock("@/design-system/themes", () => ({
  useTheme: () => ({
    theme: "mago-classico",
    setTheme,
    tokens: {},
  }),
}));

vi.mock("@/application/accessibility-preferences/AccessibilityPreferencesContext", () => ({
  useAccessibilityPreferencesContext: () => ({
    state: {
      configuredMotionPreference: "system",
      effectiveMotionPreference: "normal",
      error: null,
    },
    setMotionPreference: vi.fn(),
  }),
}));

describe("PersonalizationPanel", () => {
  it("exposes the existing theme and motion foundations", () => {
    render(<PersonalizationPanel />);

    expect(screen.getByRole("heading", { name: "Personalizar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Escolha um tema")).toHaveValue("mago-classico");
    expect(screen.getByLabelText("Preferência de movimento")).toHaveValue("system");
  });

  it("renders selectable theme presets instead of introducing a parallel theme list", () => {
    render(<PersonalizationPanel />);

    const select = screen.getByLabelText("Escolha um tema");
    expect(select).toContainElement(screen.getByRole("option", { name: "Mago Clássico" }));

    fireEvent.change(select, { target: { value: "escuro" } });
    expect(setTheme).toHaveBeenCalledWith("escuro");
  });
});
