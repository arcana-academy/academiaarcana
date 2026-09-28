import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MissoesPage from "./page";

describe("MissoesPage", () => {
  it("renders mission states without inventing persisted missions", () => {
    render(<MissoesPage />);
    expect(screen.getByRole("heading", { name: "Missões" })).toBeInTheDocument();
    expect(screen.getByText(/nenhuma missão persistida/i)).toBeInTheDocument();
  });
});
