import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  primary: "idle",
  local: "idle",
  pending: false,
  localPending: false,
  calls: 0,
}));

vi.mock("react", async (importOriginal) => {
  const real = await importOriginal<typeof import("react")>();
  return {
    ...real,
    useActionState: vi.fn(() => {
      const primary = hooks.calls++ % 2 === 0;
      const status = primary ? hooks.primary : hooks.local;
      const pending = primary ? hooks.pending : hooks.localPending;
      return [{ status }, () => undefined, pending];
    }),
  };
});

vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn(),
  finishLocalLogout: vi.fn(),
}));

import { LogoutForm } from "./LogoutForm";

describe("LogoutForm accessible errors and fallback", () => {
  beforeEach(() => {
    hooks.primary = "idle";
    hooks.local = "idle";
    hooks.pending = false;
    hooks.localPending = false;
    hooks.calls = 0;
  });

  it("shows only the global exit button initially", () => {
    render(<LogoutForm />);
    expect(screen.getByRole("button", { name: "Sair", exact: true })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /somente deste dispositivo/ })).not.toBeInTheDocument();
  });

  it("AUTH-P1-028/029: remote failure is accessible and never claimed as success", () => {
    hooks.primary = "revocation_failed";
    render(<LogoutForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível confirmar");
    expect(screen.getByRole("button", { name: "Sair", exact: true })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Sair somente deste dispositivo" })).toBeEnabled();
    expect(screen.queryByText(/todos os dispositivos foram encerrados com sucesso/)).not.toBeInTheDocument();
  });

  it("AUTH-P1-031: cleanup failure explicitly offers local-only recovery", () => {
    hooks.primary = "cleanup_incomplete";
    render(<LogoutForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("não foi concluída neste dispositivo");
    expect(screen.getByText(/Isso não confirma a saída dos outros dispositivos/)).toBeInTheDocument();
  });

  it("AUTH-P1-007/028: indeterminate outcome is not represented as completion", () => {
    hooks.primary = "outcome_unknown";
    render(<LogoutForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível confirmar se todas as sessões");
  });

  it("AUTH-P1-032: pending state disables both forms", () => {
    hooks.pending = true;
    hooks.primary = "revocation_failed";
    render(<LogoutForm />);
    expect(screen.getByRole("button", { name: "Saindo..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sair somente deste dispositivo" })).toBeDisabled();
  });

  it("AUTH-P1-032: local-recovery pending state also disables global submission", () => {
    hooks.localPending = true;
    hooks.primary = "cleanup_incomplete";
    render(<LogoutForm />);
    expect(screen.getByRole("button", { name: "Sair", exact: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Finalizando..." })).toBeDisabled();
  });

  it("reauth required reports missing global guarantee without showing credentials", () => {
    hooks.primary = "reauth_required";
    render(<LogoutForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sua sessão não permite confirmar");
    expect(document.body.textContent).not.toContain("Bearer ");
  });

  it("local-only failure takes priority over previous global error", () => {
    hooks.primary = "outcome_unknown";
    hooks.local = "cleanup_incomplete";
    render(<LogoutForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("A saída não foi concluída");
  });
});
