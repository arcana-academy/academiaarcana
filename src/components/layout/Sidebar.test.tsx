import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("exposes the primary navigation and marks the current route", () => {
    render(<Sidebar currentPath="/santuario" />);

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav).toBeInTheDocument();

    const current = screen.getByRole("link", { name: /Santuário/ });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Academia/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Grimórios/ })).toBeInTheDocument();
  });
});
