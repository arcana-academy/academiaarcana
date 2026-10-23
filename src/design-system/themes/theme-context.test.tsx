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


  test("follows device preference until the user explicitly chooses a theme", () => {
    const originalMatchMedia = window.matchMedia;
    const original = window.localStorage.getItem("academia-arcana.appearance-v1");
    let deviceIsLight = true;
    let listener: (() => void) | undefined;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        get matches() { return deviceIsLight; },
        addEventListener: (_event: string, callback: () => void) => { listener = callback; },
        removeEventListener: () => { listener = undefined; },
      }),
    });
    window.localStorage.removeItem("academia-arcana.appearance-v1");

    function AppearanceProbe() {
      const { theme, appearance, setAppearance } = useTheme();
      return (
        <div>
          <p data-testid="appearance">{appearance}</p>
          <p data-testid="theme">{theme}</p>
          <button onClick={() => setAppearance("dark")}>Modo escuro</button>
          <button onClick={() => setAppearance("system")}>Automático</button>
        </div>
      );
    }

    const target = document.createElement("div");
    document.body.appendChild(target);
    const root = createRoot(target);
    try {
      act(() => root.render(<ThemeProvider followSystem><AppearanceProbe /></ThemeProvider>));
      expect(target.querySelector('[data-testid="theme"]')?.textContent).toBe("pergaminho-claro");
      expect(target.querySelector('[data-testid="appearance"]')?.textContent).toBe("system");

      act(() => (target.querySelector("button") as HTMLButtonElement).click());
      expect(target.querySelector('[data-testid="theme"]')?.textContent).toBe("mago-classico");
      expect(window.localStorage.getItem("academia-arcana.appearance-v1")).toBe("dark");

      deviceIsLight = false;
      act(() => (target.querySelectorAll("button")[1] as HTMLButtonElement).click());
      expect(target.querySelector('[data-testid="theme"]')?.textContent).toBe("mago-classico");
      deviceIsLight = true;
      act(() => listener?.());
      expect(target.querySelector('[data-testid="theme"]')?.textContent).toBe("pergaminho-claro");
    } finally {
      act(() => root.unmount());
      target.remove();
      Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
      if (original === null) window.localStorage.removeItem("academia-arcana.appearance-v1");
      else window.localStorage.setItem("academia-arcana.appearance-v1", original);
    }
  });

  test("retains explicit appearance choice in memory when localStorage writes fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("storage blocked");
    };

    function AppearanceProbe() {
      const { theme, appearance, setAppearance } = useTheme();
      return (
        <div>
          <p data-testid="appearance">{appearance}</p>
          <p data-testid="theme">{theme}</p>
          <button onClick={() => setAppearance("light")}>Modo claro</button>
          <button onClick={() => setAppearance("system")}>Automático</button>
        </div>
      );
    }

    const target = document.createElement("div");
    document.body.appendChild(target);
    const root = createRoot(target);
    try {
      act(() => root.render(<ThemeProvider followSystem><AppearanceProbe /></ThemeProvider>));
      act(() => (target.querySelector("button") as HTMLButtonElement).click());
      expect(target.querySelector('[data-testid="appearance"]')?.textContent).toBe("light");
      expect(target.querySelector('[data-testid="theme"]')?.textContent).toBe("pergaminho-claro");
    } finally {
      Storage.prototype.setItem = originalSetItem;
      act(() => (target.querySelectorAll("button")[1] as HTMLButtonElement)?.click());
      act(() => root.unmount());
      target.remove();
    }
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
