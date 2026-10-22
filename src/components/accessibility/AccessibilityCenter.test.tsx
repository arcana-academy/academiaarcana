// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { AccessibilityCenter } from "./AccessibilityCenter";

vi.mock("@/application/appearance/SiteAppearanceProvider", () => ({
  useSiteAppearance: () => ({
    appearance: "system",
    setAppearance: vi.fn(),
  }),
}));
vi.mock("@/application/accessibility-preferences/AccessibilityPreferencesContext", () => ({
  useAccessibilityPreferencesContext: () => ({
    state: { configuredMotionPreference: "system", error: null },
    setMotionPreference: vi.fn().mockResolvedValue(undefined),
  }),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-aa-text-scale");
  document.documentElement.removeAttribute("data-aa-spacing");
  document.documentElement.removeAttribute("data-aa-contrast");
  document.documentElement.removeAttribute("data-aa-focus-mode");
});

describe("Central de Acessibilidade", () => {
  it("exposes six categories from the approved header entry", () => {
    render(<AccessibilityCenter />);
    const open = screen.getByRole("button", { name: "Acessibilidade" });
    expect(open).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(open);
    expect(open).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Central de Acessibilidade" })).toBeInTheDocument();
    for (const label of [
      "Visão e leitura",
      "Audição e mídia",
      "Mobilidade",
      "Cognição e foco",
      "Tecnologias assistivas",
      "Estudo acessível",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("persists a reading preference locally and supports keyboard dismissal", () => {
    render(<AccessibilityCenter />);
    const trigger = screen.getByRole("button", { name: "Acessibilidade" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("checkbox", { name: "Ampliar texto" }));
    expect(document.documentElement).toHaveAttribute("data-aa-text-scale", "large");
    expect(JSON.parse(window.localStorage.getItem("academia-arcana.reading-preferences.v1") ?? "{}")).toMatchObject({ largeText: true });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Central de Acessibilidade" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("does not imply assistive technology support is enabled by a checkbox", () => {
    render(<AccessibilityCenter />);
    fireEvent.click(screen.getByRole("button", { name: "Acessibilidade" }));
    fireEvent.click(screen.getByRole("button", { name: "Tecnologias assistivas" }));
    expect(screen.getByText(/compatibilidade da interface/i)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /leitor de tela/i })).not.toBeInTheDocument();
  });
});
