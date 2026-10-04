// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, test } from "vitest";
import { Card } from "./card";

describe("Card", () => {
  test("renders content inside the semantic card wrapper", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<Card aria-label="Resumo">Meu progresso</Card>);
    });

    const card = container.querySelector("section");
    expect(card).toBeTruthy();
    expect(card?.className).toContain("aa-card");
    expect(card?.textContent).toBe("Meu progresso");
    expect(card?.getAttribute("aria-label")).toBe("Resumo");

    act(() => root.unmount());
    container.remove();
  });
});
