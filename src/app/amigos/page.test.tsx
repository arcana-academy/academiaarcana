import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AmigosPage from "./page";

describe("AmigosPage", () => {
  it("renders privacy-first social states", () => {
    render(<AmigosPage />);
    expect(screen.getByRole("heading", { name: "Amigos", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/nenhuma conexão social persistida/i)).toBeInTheDocument();
  });
});
