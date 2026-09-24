import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthenticatedNavigation } from "./AuthenticatedNavigation";

describe("AuthenticatedNavigation", () => {
  it("renders the navigation landmark with the two implemented routes", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    const navigation = screen.getByRole("navigation", {
      name: "Navegação principal",
    });

    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Santuário" })).toHaveAttribute(
      "href",
      "/santuario",
    );
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute(
      "href",
      "/workspace",
    );
  });

  it("marks only the current route with aria-current", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    expect(screen.getByRole("link", { name: "Santuário" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Workspace" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("updates the current route when the workspace is active", () => {
    render(<AuthenticatedNavigation currentPath="/workspace" />);

    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Santuário" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps links keyboard-focusable through native link semantics", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    const sanctuaryLink = screen.getByRole("link", { name: "Santuário" });
    const workspaceLink = screen.getByRole("link", { name: "Workspace" });

    sanctuaryLink.focus();
    expect(document.activeElement).toBe(sanctuaryLink);

    workspaceLink.focus();
    expect(document.activeElement).toBe(workspaceLink);
  });

  it("reinforces the current route with a non-color indicator", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    expect(screen.getByRole("link", { name: "Santuário" })).toHaveClass(
      "aa-nav-link-active",
    );
    expect(screen.getByRole("link", { name: "Workspace" })).not.toHaveClass(
      "aa-nav-link-active",
    );
  });
});
