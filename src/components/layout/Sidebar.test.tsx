import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders canonical decorative icons while preserving current-page semantics", () => {
    render(<Sidebar currentPath="/amigos" />);

    const currentLink = screen.getByRole("link", { name: "Amigos" });
    expect(currentLink).toHaveAttribute("aria-current", "page");
    expect(currentLink).toHaveAttribute("href", "/amigos");

    const icon = currentLink.querySelector(".aa-sidebar-icon svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("width", "20");
    expect(icon).toHaveAttribute("height", "20");

    expect(screen.getByRole("link", { name: "Cronograma" })).toHaveAttribute(
      "href",
      "/cronograma",
    );
  });
});
