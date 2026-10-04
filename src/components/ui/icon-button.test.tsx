import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("requires an accessible name and renders it", () => {
    render(<IconButton aria-label="Abrir menu">☰</IconButton>);

    expect(screen.getByRole("button", { name: "Abrir menu" })).toBeInTheDocument();
  });
});
