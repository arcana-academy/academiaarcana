// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalizationPanel } from "./PersonalizationPanel";

const mockPreferences = vi.hoisted(() => ({
  state: {
    current: {
      configuredMotionPreference: "system",
      effectiveMotionPreference: "reduced",
      error: null,
    } as {
      configuredMotionPreference: "system" | "normal" | "reduced";
      effectiveMotionPreference: "normal" | "reduced";
      error: { code: "PERSISTENCE_FAILED"; message: string } | null;
    } | null,
  },
  setMotionPreference: vi.fn(),
}));

vi.mock("@/design-system/themes", () => ({
  useTheme: () => ({ theme: "mago-classico", setTheme: vi.fn(), tokens: {} }),
}));

vi.mock("@/application/accessibility-preferences/AccessibilityPreferencesContext", () => ({
  useAccessibilityPreferencesContext: () => ({
    state: mockPreferences.state.current,
    setMotionPreference: mockPreferences.setMotionPreference,
  }),
}));

describe("PersonalizationPanel — effective motion feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreferences.state.current = {
      configuredMotionPreference: "system",
      effectiveMotionPreference: "reduced",
      error: null,
    };
  });

  it("explains device preference and exposes reduced motion applied by the system", () => {
    render(<PersonalizationPanel />);

    const select = screen.getByRole("combobox", { name: "Preferência de movimento" });
    expect(select).toHaveValue("system");
    expect(select).toHaveAttribute("aria-describedby", "motion-description");
    expect(screen.getByText(/movimento respeita a preferência do seu dispositivo/i)).toHaveAttribute(
      "id",
      "motion-description",
    );
    expect(screen.getByText("Reduzido")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Movimento aplicado: reduzido.");
  });

  it("updates the effective motion information independently of the chosen setting", () => {
    const { rerender } = render(<PersonalizationPanel />);
    mockPreferences.state.current = {
      configuredMotionPreference: "system",
      effectiveMotionPreference: "normal",
      error: null,
    };

    rerender(<PersonalizationPanel />);

    expect(screen.getByRole("combobox", { name: "Preferência de movimento" })).toHaveValue("system");
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Movimento aplicado: normal.");
  });

  it("keeps motion selection wired to the existing persistence provider", () => {
    render(<PersonalizationPanel />);

    fireEvent.change(screen.getByRole("combobox", { name: "Preferência de movimento" }), {
      target: { value: "reduced" },
    });

    expect(mockPreferences.setMotionPreference).toHaveBeenCalledOnce();
    expect(mockPreferences.setMotionPreference).toHaveBeenCalledWith("reduced");
  });

  it("associates persistence errors with the input without exposing internal details", () => {
    mockPreferences.state.current = {
      configuredMotionPreference: "system",
      effectiveMotionPreference: "reduced",
      error: { code: "PERSISTENCE_FAILED", message: "private-backend-connection-string" },
    };
    render(<PersonalizationPanel />);

    const select = screen.getByRole("combobox", { name: "Preferência de movimento" });
    expect(select).toHaveAttribute("aria-describedby", "motion-description motion-error");
    expect(screen.getByRole("alert")).toHaveAttribute("id", "motion-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível persistir a preferência de movimento.");
    expect(screen.queryByText(/private-backend-connection-string/)).not.toBeInTheDocument();
  });

  it("does not claim an applied motion setting before preferences are loaded", () => {
    mockPreferences.state.current = null;
    render(<PersonalizationPanel />);

    expect(screen.getAllByText("Carregando preferências")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Movimento aplicado: carregando preferências.",
    );
  });
});
