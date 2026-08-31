// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, test } from "vitest";
import { Button } from "./button";
import { IconButton } from "./icon-button";

const render = (node: React.ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return { container, root };
};

describe("Button", () => {
  test("preserves native semantics, accessible name and disabled state", () => {
    const { container, root } = render(<Button disabled>Salvar</Button>);
    const button = container.querySelector("button");

    expect(button).toBeTruthy();
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.textContent).toBe("Salvar");
    expect(button?.disabled).toBe(true);
    expect(button?.className).toContain("aa-button");

    act(() => root.unmount());
    container.remove();
  });
});

describe("IconButton", () => {
  test("requires and exposes an accessible label", () => {
    const { container, root } = render(
      <IconButton aria-label="Abrir menu">☰</IconButton>,
    );
    const button = container.querySelector("button");

    expect(button?.getAttribute("aria-label")).toBe("Abrir menu");
    expect(button?.getAttribute("type")).toBe("button");

    act(() => root.unmount());
    container.remove();
  });
});
