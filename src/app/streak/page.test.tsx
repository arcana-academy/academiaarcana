import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StreakPage from "./page";

describe("StreakPage", () => {
  it("renders an explicit unavailable streak state", () => {
    render(<StreakPage />);
    expect(screen.getByRole("heading", { name: "Streak" })).toBeInTheDocument();
    expect(screen.getByText(/nenhuma sequência persistida/i)).toBeInTheDocument();
  });
});
