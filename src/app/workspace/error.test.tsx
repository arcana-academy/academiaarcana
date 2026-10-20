import { fireEvent, render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import WorkspaceError from "./error";

describe("Workspace route error recovery", () => {
  it("replaces the generic English fallback with an accessible Portuguese message", () => {
    render(<WorkspaceError error={new Error("synthetic database outage")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Não foi possível carregar o Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível recuperar seus grimórios, capítulos e páginas agora.",
    );
    expect(screen.getByRole("main")).toHaveAttribute("aria-labelledby", "workspace-error-title");
  });

  it("invokes Next.js reset and provides navigation back to Grimórios", () => {
    const reset = vi.fn();
    render(<WorkspaceError error={new Error("synthetic outage")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Voltar aos Grimórios" })).toHaveAttribute("href", "/grimorios");
  });

  it("never exposes database errors or diagnostic digests in rendered markup", () => {
    const error = Object.assign(new Error("private SQL identifier"), { digest: "private-diagnostic-digest" });
    render(<WorkspaceError error={error} reset={vi.fn()} />);

    expect(screen.queryByText(/private SQL identifier/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-diagnostic-digest/)).not.toBeInTheDocument();
    expect(screen.queryByText(/synthetic/i)).not.toBeInTheDocument();
  });

  it("preserves Next.js authentication redirects instead of swallowing them", () => {
    let authRedirect: unknown;
    try {
      redirect("/login");
    } catch (error) {
      authRedirect = error;
    }

    expect(() =>
      render(
        <WorkspaceError
          error={authRedirect as Error & { digest?: string }}
          reset={vi.fn()}
        />,
      ),
    ).toThrow();
  });
});
