import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EstatisticasPage from "./page";

describe("EstatisticasPage", () => {
  it("renders the statistics surface without fabricating metrics", () => {
    render(<EstatisticasPage />);
    expect(screen.getByRole("heading", { name: "Estatísticas", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/não há dados agregados/i)).toBeInTheDocument();
  });
});
