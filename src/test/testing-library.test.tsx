import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function Probe() {
  return <button type="button">Arcana</button>;
}

describe("Testing Library foundation", () => {
  it("renders and queries React through the DOM testing API", () => {
    render(<Probe />);
    expect(screen.getByRole("button", { name: "Arcana" })).toBeInTheDocument();
  });
});
