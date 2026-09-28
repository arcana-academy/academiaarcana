// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PersonalizationPanel } from "./PersonalizationPanel";

const setTheme = vi.fn();

let mockMotionState:
  | {
      configuredMotionPreference: "system" | "normal" | "reduced";
      effectiveMotionPreference: "normal" | "reduced";
      error: null;
    }
  | null = {
  configuredMotionPreference: "system",
  effectiveMotionPreference: "normal",
  error: null,
};

vi.mock("@/design-system/themes", () => ({
  useTheme: () => ({
    theme: "mago-classico",
    setTheme,
    tokens: {},
  }),
}));

vi.mock("@/application/accessibility-preferences/AccessibilityPreferencesContext", () => ({
  useAccessibilityPreferencesContext: () => ({
    state: mockMotionState,
    setMotionPreference: vi.fn(),
  }),
}));

describe("PersonalizationPanel", () => {
  afterEach(() => {
    mockMotionState = {
      configuredMotionPreference: "system",
      effectiveMotionPreference: "normal",
      error: null,
    };
  });

  it("exposes the existing theme and motion foundations", () => {
    render(<PersonalizationPanel />);

    expect(screen.getByRole("heading", { name: "Personalizar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Escolha um tema")).toHaveValue("mago-classico");
    expect(screen.getByLabelText("Preferência de movimento")).toHaveValue("system");
  });

  it("shows an explicit loading state before motion preferences are available", () => {
    mockMotionState = null;

    render(<PersonalizationPanel />);

    expect(screen.getByLabelText("Preferência de movimento")).toBeDisabled();
    expect(
      screen.getByText("Carregando sua preferência de movimento…"),
    ).toBeInTheDocument();
  });

  it("renders selectable theme presets instead of introducing a parallel theme list", () => {
    render(<PersonalizationPanel />);

    const select = screen.getByLabelText("Escolha um tema");
    expect(select).toContainElement(screen.getByRole("option", { name: "Mago Clássico" }));

    fireEvent.change(select, { target: { value: "escuro" } });
    expect(setTheme).toHaveBeenCalledWith("escuro");
  });
});
