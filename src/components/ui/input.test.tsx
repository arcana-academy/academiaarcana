// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, test } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  test("associates its label, description and error with the control", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <Input
          id="email"
          label="E-mail"
          description="Usaremos este endereço para entrar."
          error="Informe um e-mail válido."
        />,
      );
    });

    const input = container.querySelector("input");
    const label = container.querySelector("label");
    const description = container.querySelector("[id='email-description']");
    const error = container.querySelector("[id='email-error']");

    expect(label?.getAttribute("for")).toBe("email");
    expect(input?.getAttribute("aria-describedby")).toBe("email-description email-error");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(description?.textContent).toContain("Usaremos este endereço");
    expect(error?.textContent).toContain("Informe um e-mail válido");

    act(() => root.unmount());
    container.remove();
  });
});
