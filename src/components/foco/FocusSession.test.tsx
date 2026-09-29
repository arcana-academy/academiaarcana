import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FocusSession } from "./FocusSession";

describe("FocusSession", () => {
  it("renders an accessible paused session", () => {
    render(<FocusSession />);

    expect(screen.getByRole("heading", { name: /25 minutos de foco/i })).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sessão/i })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /progresso da sessão de foco/i })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
});
