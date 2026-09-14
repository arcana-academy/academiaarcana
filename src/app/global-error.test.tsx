import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GlobalErrorBoundary from "./global-error";

const notify = vi.hoisted(() => vi.fn());

vi.mock("@honeybadger-io/react", () => ({
  Honeybadger: { notify },
}));

import GlobalErrorBoundary from "./global-error";

describe("global error boundary", () => {
  beforeEach(() => {
    notify.mockClear();
  });

  function renderBoundary(error: Error, reset = vi.fn()) {
    const container = document.implementation.createHTMLDocument();
    const result = render(
      <GlobalErrorBoundary error={error} reset={reset} />,
      { container },
    );

    return { ...result, reset };
  }

  it("renders a complete Portuguese-language fallback document", () => {
    const { container } = renderBoundary(
      new Error("root layout failed"),
    );

    expect(container.documentElement.lang).toBe("pt-BR");
    expect(container.querySelector("h2")?.textContent).toBe(
      "Something went wrong!",
    );
    expect(container.querySelector("button")?.textContent).toBe("Try again");
    expect(container.querySelector("button")?.disabled).toBe(false);
  });

  it("reports the exact root error, including its Next.js digest", () => {
    const error = Object.assign(new Error("root layout failed"), {
      digest: "global-digest",
    });

    renderBoundary(error);

    expect(notify).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(error);
  });

  it("asks Next.js to retry when the recovery action is selected", () => {
    const { container, reset } = renderBoundary(
      new Error("root layout failed"),
    );
    const retryButton = container.querySelector("button");

    expect(retryButton).not.toBeNull();
    retryButton!.click();

    expect(reset).toHaveBeenCalledOnce();
  });

  it("reports a new root error but not a rerender of the same error", () => {
    const firstError = new Error("first root failure");
    const secondError = new Error("second root failure");
    const reset = vi.fn();
    const { rerender } = renderBoundary(firstError, reset);

    rerender(<GlobalErrorBoundary error={firstError} reset={reset} />);
    rerender(<GlobalErrorBoundary error={secondError} reset={reset} />);

    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenNthCalledWith(1, firstError);
    expect(notify).toHaveBeenNthCalledWith(2, secondError);
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
      screen.getByRole("heading", { name: "Something went wrong!" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("does not expose diagnostic details in the root fallback", () => {
    const error = Object.assign(new Error("private root detail"), {
      digest: "private-root-digest",
    });

    render(<GlobalErrorBoundary error={error} reset={vi.fn()} />);

    expect(screen.queryByText(/private root detail/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-root-digest/i)).not.toBeInTheDocument();
  });
});
