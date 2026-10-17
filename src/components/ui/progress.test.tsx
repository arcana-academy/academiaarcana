// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Progress } from "./progress";

afterEach(cleanup);

describe("Progress", () => {
  it.each([
    ["below range", -12, 0],
    ["within range", 64, 64],
    ["above range", 120, 100],
  ])("clamps %s without changing accessible progress semantics", (_case, value, expected) => {
    render(<Progress value={value} label="Progresso de estudo" />);

    const progress = screen.getByRole("progressbar", { name: "Progresso de estudo" });
    const fill = progress.querySelector(".aa-progress-value") as HTMLElement | null;

    expect(progress.getAttribute("aria-valuemin")).toBe("0");
    expect(progress.getAttribute("aria-valuemax")).toBe("100");
    expect(progress.getAttribute("aria-valuenow")).toBe(String(expected));
    expect(fill?.style.width).toBe(`${expected}%`);
  });

  it.each([
    ["NaN", Number.NaN],
    ["positive Infinity", Number.POSITIVE_INFINITY],
    ["negative Infinity", Number.NEGATIVE_INFINITY],
  ])("does not invent completion for %s", (_case, value) => {
    render(<Progress value={value} label="Progresso de estudo" />);

    const progress = screen.getByRole("progressbar", { name: "Progresso de estudo" });
    const fill = progress.querySelector(".aa-progress-value") as HTMLElement | null;

    expect(progress.hasAttribute("aria-valuenow")).toBe(false);
    expect(progress.getAttribute("aria-valuemin")).toBe("0");
    expect(progress.getAttribute("aria-valuemax")).toBe("100");
    expect(fill?.style.width).toBe("0%");
    expect(progress.innerHTML).not.toMatch(/NaN|Infinity/);
  });
});
