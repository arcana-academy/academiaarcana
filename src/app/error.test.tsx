import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./error";

const notify = vi.hoisted(() => vi.fn());

vi.mock("@honeybadger-io/react", () => ({
  Honeybadger: { notify },
}));

import ErrorBoundary from "./error";

describe("route error boundary", () => {
  beforeEach(() => {
    notify.mockClear();
  });

  it("reports the error and renders an accessible recovery action", () => {
    const error = Object.assign(new Error("route failed"), {
      digest: "route-digest",
    });

    render(<ErrorBoundary error={error} reset={vi.fn()} />);

    expect(notify).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(error);
    expect(
      screen.getByRole("heading", { name: "Something went wrong!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeEnabled();
  });

  it("asks Next.js to retry when the recovery action is selected", () => {
    const reset = vi.fn();

    render(<ErrorBoundary error={new Error("route failed")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it("does not report the same error again after an unrelated rerender", () => {
    const error = new Error("stable failure");
    const { rerender } = render(
      <ErrorBoundary error={error} reset={vi.fn()} />,
    );

    rerender(<ErrorBoundary error={error} reset={vi.fn()} />);

    expect(notify).toHaveBeenCalledOnce();
  });

  it("reports a replacement error when Next.js reuses the boundary", () => {
    const firstError = new Error("first failure");
    const secondError = new Error("second failure");
    const { rerender } = render(
      <ErrorBoundary error={firstError} reset={vi.fn()} />,
    );

    rerender(<ErrorBoundary error={secondError} reset={vi.fn()} />);

    expect(notify).toHaveBeenNthCalledWith(1, firstError);
    expect(notify).toHaveBeenNthCalledWith(2, secondError);
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
