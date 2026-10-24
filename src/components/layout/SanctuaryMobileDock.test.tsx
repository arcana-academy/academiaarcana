import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SanctuaryMobileDock } from "./SanctuaryMobileDock";

describe("C106 approved Sanctuary mobile dock", () => {
  it("renders four real accessible routes with current page announced", () => {
    render(<SanctuaryMobileDock />);
    const nav = screen.getByRole("navigation", { name: "Atalhos do Santuário" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links.map(link => link.getAttribute("href"))).toEqual([
      "/santuario", "/grimorios", "/missoes", "/cronograma",
    ]);
    expect(within(nav).getByRole("link", { name: "Início" })).toHaveAttribute("aria-current","page");
    expect(within(nav).getByRole("link", { name: "Missões" })).not.toHaveAttribute("aria-current");
  });
});
