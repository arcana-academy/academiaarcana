import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MobileNavigation } from "./MobileNavigation";

describe("MobileNavigation", () => {
  it("opens an accessible navigation menu and closes after selection", async () => {
    render(<MobileNavigation currentPath="/santuario" />);

    const trigger = screen.getByRole("button", { name: "Abrir navegação" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(screen.getByRole("navigation", { name: "Navegação móvel" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const current = screen.getByRole("link", { name: "Santuário" });
    expect(current).toHaveAttribute("aria-current", "page");

    fireEvent.click(current);
    expect(screen.queryByRole("navigation", { name: "Navegação móvel" })).not.toBeInTheDocument();
  });
});
