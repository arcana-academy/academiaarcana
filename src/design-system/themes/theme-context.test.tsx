// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, test } from "vitest";
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
