// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PersonalizationPanel } from "./PersonalizationPanel";

const setPreference = vi.fn();

vi.mock("@/design-system/themes", () => ({
  useTheme: () => ({
    theme: "biblioteca-noturna",
    preference: "system",
    setPreference,
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
    expect(screen.getByLabelText("Escolha um tema")).toHaveValue("system");
    expect(screen.getByLabelText("Preferência de movimento")).toHaveValue("system");
  });

  it("renders selectable theme presets instead of introducing a parallel theme list", () => {
    render(<PersonalizationPanel />);

    const select = screen.getByLabelText("Escolha um tema");
    expect(select).toContainElement(screen.getByRole("option", { name: "Mago Clássico" }));

    fireEvent.change(select, { target: { value: "escuro" } });
    expect(setPreference).toHaveBeenCalledWith("escuro");

    fireEvent.change(select, { target: { value: "system" } });
    expect(setPreference).toHaveBeenCalledWith("system");
  });
});
