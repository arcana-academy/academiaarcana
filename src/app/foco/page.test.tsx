import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FocoPage from "./page";

describe("FocoPage", () => {
  it("renders the focus foundation and its real navigation", () => {
    render(<FocoPage />);
    expect(screen.getByRole("heading", { name: "Foco", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejar sessão" })).toHaveAttribute("href", "/cronograma");
  });
});
