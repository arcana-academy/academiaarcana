import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Academia Arcana home", () => {
  it("renders the accessible application heading", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: "Academia Arcana" })).toBeTruthy();
  });
});
