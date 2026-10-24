import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GlobalErrorBoundary from "./global-error";

const notify = vi.hoisted(() => vi.fn());

vi.mock("@honeybadger-io/react", () => ({
  Honeybadger: { notify },
}));

describe("global error boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports each new root error to Honeybadger once", () => {
    const firstError = new Error("first root failure");
    const secondError = new Error("second root failure");
    const { rerender } = render(
      <GlobalErrorBoundary error={firstError} reset={vi.fn()} />,
    );

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenLastCalledWith(firstError);

    rerender(<GlobalErrorBoundary error={firstError} reset={vi.fn()} />);
    expect(notify).toHaveBeenCalledTimes(1);

    rerender(<GlobalErrorBoundary error={secondError} reset={vi.fn()} />);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenLastCalledWith(secondError);
  });

  it("renders the required document shell and retries through reset", () => {
    const reset = vi.fn();

    render(<GlobalErrorBoundary error={new Error("failure")} reset={reset} />);

    expect(document.documentElement).toHaveAttribute("lang", "pt-BR");
    expect(
      screen.getByRole("heading", { name: "Não foi possível carregar a Academia Arcana" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveAttribute("aria-labelledby", "global-error-title");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toHaveAttribute("type", "button");

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("does not expose diagnostic details in the root fallback", () => {
    const error = Object.assign(new Error("private root detail"), {
      digest: "private-root-digest",
    });

    render(<GlobalErrorBoundary error={error} reset={vi.fn()} />);

    expect(
      screen.queryByText(/private root detail/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/private-root-digest/i),
    ).not.toBeInTheDocument();
  });
});
