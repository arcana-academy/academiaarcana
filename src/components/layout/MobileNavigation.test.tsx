import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MobileNavigation } from "./MobileNavigation";

describe("MobileNavigation", () => {
  it("starts collapsed, exposes a focusable disclosure, and marks the current page when opened", () => {
    const { container } = render(<MobileNavigation currentPath="/workspace" />);
    const menu = container.querySelector("details");
    const trigger = screen.getByText("Navegar").closest("summary");

    expect(menu).not.toHaveAttribute("open");
    expect(trigger).not.toBeNull();
    trigger?.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger!);

    expect(menu).toHaveAttribute("open");
    expect(screen.getByRole("navigation", { name: "Navegação móvel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Grimórios" })).toHaveAttribute("href", "/grimorios");
  });
});
