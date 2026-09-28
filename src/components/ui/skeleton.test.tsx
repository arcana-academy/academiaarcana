import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders as a decorative loading placeholder", () => {
    const { container } = render(
      <Skeleton className="aa-skeleton-sm" data-testid="skeleton" />,
    );

    const element = container.querySelector("[data-testid='skeleton']");
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute("aria-hidden", "true");
    expect(element).toHaveClass("aa-skeleton-block", "aa-skeleton-sm");
    expect(element).toHaveAttribute("aria-hidden", "true");
  });
});
