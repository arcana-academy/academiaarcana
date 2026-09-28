import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ConquistasPage from "./page";

describe("ConquistasPage", () => {
  it("renders the achievements foundation", () => {
    render(<ConquistasPage />);
    expect(screen.getByRole("heading", { name: "Conquistas" })).toBeInTheDocument();
    expect(screen.getByText(/nenhuma conquista persistida/i)).toBeInTheDocument();
  });
});
