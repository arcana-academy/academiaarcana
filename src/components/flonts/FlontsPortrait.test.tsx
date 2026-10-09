import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FLONTS_APPROVED_MINI_SRC, FlontsPortrait } from "./FlontsPortrait";

describe("Flonts canonical visual reuse", () => {
  it("always uses a single approved file and a fixed undistorted aspect ratio", () => {
    const { container } = render(<FlontsPortrait />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", FLONTS_APPROVED_MINI_SRC);
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "60");
    expect(img).toHaveStyle({ objectFit: "contain" });
    expect(img).toHaveAttribute("alt", "");
  });

  it("has meaningful alternative text when not decorative", () => {
    render(<FlontsPortrait decorative={false} />);
    expect(screen.getByRole("img", { name: "Flonts, gato mago da Academia Arcana" })).toBeInTheDocument();
  });
});
