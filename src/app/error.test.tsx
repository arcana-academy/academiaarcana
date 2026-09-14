import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./error";

const notify = vi.hoisted(() => vi.fn());

vi.mock("@honeybadger-io/react", () => ({
  Honeybadger: { notify },
}));

describe("route error boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports each new error to Honeybadger once", () => {
    const firstError = new Error("first failure");
    const secondError = new Error("second failure");
    const { rerender } = render(
      <ErrorBoundary error={firstError} reset={vi.fn()} />,
    );

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenLastCalledWith(firstError);

    rerender(<ErrorBoundary error={firstError} reset={vi.fn()} />);
    expect(notify).toHaveBeenCalledTimes(1);

    rerender(<ErrorBoundary error={secondError} reset={vi.fn()} />);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenLastCalledWith(secondError);
  });

  it("offers a retry action wired to the Next.js reset callback", () => {
    const reset = vi.fn();

    render(<ErrorBoundary error={new Error("failure")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Something went wrong!" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("does not expose diagnostic details in the user-facing fallback", () => {
    const error = Object.assign(new Error("private failure detail"), {
      digest: "private-digest",
    });

    render(<ErrorBoundary error={error} reset={vi.fn()} />);

    expect(screen.queryByText(/private failure detail/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-digest/i)).not.toBeInTheDocument();
  });
});
