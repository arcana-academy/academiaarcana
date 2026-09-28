import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthenticatedNavigation } from "./AuthenticatedNavigation";

describe("AuthenticatedNavigation", () => {
  it("renders all implemented authenticated routes", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    const navigation = screen.getByRole("navigation", { name: "Navegação principal" });

    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Academia" })).toHaveAttribute("href", "/academia");
    expect(screen.getByRole("link", { name: "Santuário" })).toHaveAttribute("href", "/santuario");
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/workspace");
    expect(screen.getByRole("link", { name: "Cronograma" })).toHaveAttribute("href", "/cronograma");
    expect(screen.getByRole("link", { name: "Personalizar" })).toHaveAttribute("href", "/personalizar");
  });

  it("marks only the current route with aria-current", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    expect(screen.getByRole("link", { name: "Santuário" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Academia" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Workspace" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Cronograma" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Personalizar" })).not.toHaveAttribute("aria-current");
  });

  it("updates the current route when Academia is active", () => {
    render(<AuthenticatedNavigation currentPath="/academia" />);

    expect(screen.getByRole("link", { name: "Academia" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Santuário" })).not.toHaveAttribute("aria-current");
  });

  it("updates the current route when the workspace is active", () => {
    render(<AuthenticatedNavigation currentPath="/workspace" />);

    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Santuário" })).not.toHaveAttribute("aria-current");
  });

  it("updates the current route when cronograma is active", () => {
    render(<AuthenticatedNavigation currentPath="/cronograma" />);

    expect(screen.getByRole("link", { name: "Cronograma" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Santuário" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Workspace" })).not.toHaveAttribute("aria-current");
  });

  it("keeps links keyboard-focusable through native link semantics", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    for (const name of ["Academia", "Santuário", "Workspace", "Cronograma", "Personalizar"]) {
      const link = screen.getByRole("link", { name });
      link.focus();
      expect(document.activeElement).toBe(link);
    }
  });

  it("reinforces the current route with a non-color indicator", () => {
    render(<AuthenticatedNavigation currentPath="/santuario" />);

    expect(screen.getByRole("link", { name: "Santuário" })).toHaveClass("aa-nav-link-active");
    expect(screen.getByRole("link", { name: "Academia" })).not.toHaveClass("aa-nav-link-active");
  });
});
