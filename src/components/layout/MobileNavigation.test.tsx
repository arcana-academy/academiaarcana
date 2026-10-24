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
    const currentLink = screen.getByRole("link", { name: "Workspace" });
    expect(currentLink).toHaveAttribute("aria-current", "page");
    expect(currentLink.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Grimórios" })).toHaveAttribute("href", "/grimorios");
  });
});
