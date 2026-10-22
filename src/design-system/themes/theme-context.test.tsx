// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ThemeProvider, useTheme } from "./theme-context";

function Probe(): ReactNode {
  const { theme, setTheme, tokens } = useTheme();
  return (
    <button type="button" onClick={() => setTheme("noturno")} data-theme={theme}>
      {tokens.accent.primary}
    </button>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { vi.unstubAllGlobals(); window.localStorage.clear(); });
  test("provides the deterministic initial theme and updates it through setTheme", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ThemeProvider initialTheme="estudioso">
          <Probe />
        </ThemeProvider>,
      );
    });

    const button = container.querySelector("button");
    expect(button?.dataset.theme).toBe("estudioso");
    expect(button?.textContent).toBe("#B69A6A");

    act(() => {
      button?.click();
    });

    expect(button?.dataset.theme).toBe("noturno");
    expect(button?.textContent).toBe("#91A9CF");

    act(() => root.unmount());
    container.remove();
  });

  test("follows system light and dark changes, and keeps manual overrides", () => {
    const listeners = new Set<(event: { matches: boolean }) => void>();
    const query = {
      matches: true,
      addEventListener: (_event: string, callback: (event: { matches: boolean }) => void) => { listeners.add(callback); },
      removeEventListener: (_event: string, callback: (event: { matches: boolean }) => void) => { listeners.delete(callback); },
    };
    vi.stubGlobal("matchMedia", vi.fn(() => query));
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    function SystemProbe() {
      const { theme, preference, setPreference } = useTheme();
      return (
        <button type="button" data-theme={theme} data-preference={preference} onClick={() => setPreference("biblioteca-noturna")}>
          {theme}
        </button>
      );
    }
    act(() => root.render(<ThemeProvider initialPreference="system"><SystemProbe /></ThemeProvider>));
    const button = container.querySelector("button");
    expect(button?.dataset.theme).toBe("pergaminho-claro");
    expect(button?.dataset.preference).toBe("system");
    act(() => { query.matches = false; for (const listener of listeners) listener({ matches: false }); });
    expect(button?.dataset.theme).toBe("biblioteca-noturna");
    act(() => { button?.click(); });
    expect(button?.dataset.preference).toBe("biblioteca-noturna");
    expect(window.localStorage.getItem("academia-arcana:theme-preference")).toBe("biblioteca-noturna");
    act(() => { query.matches = true; for (const listener of listeners) listener({ matches: true }); });
    expect(button?.dataset.theme).toBe("biblioteca-noturna");
    act(() => root.unmount());
    container.remove();
  });

  test("throws a clear error when useTheme is used outside the provider", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    expect(() =>
      act(() => {
        root.render(<Probe />);
      }),
    ).toThrow("useTheme must be used within ThemeProvider");

    act(() => root.unmount());
  });
});
