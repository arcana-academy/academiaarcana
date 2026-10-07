import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FocusSession } from "./FocusSession";

afterEach(() => {
  vi.useRealTimers();
});

describe("FocusSession", () => {
  it("renders an accessible paused session", () => {
    render(
      <FocusSession
        startSession={vi.fn(async () => "session-1")}
        completeSession={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("heading", { name: /25 minutos de foco/i })).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sessão/i })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /progresso da sessão de foco/i })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("persists a session before starting the timer", async () => {
    const startSession = vi.fn(async () => "session-1");

    render(
      <FocusSession
        startSession={startSession}
        completeSession={vi.fn(async () => undefined)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /iniciar sessão/i }));

    await waitFor(() => expect(startSession).toHaveBeenCalledWith(25 * 60));
    expect(screen.getByRole("button", { name: /pausar sessão/i })).toBeInTheDocument();
  });

  it("keeps a persisted session when the timer is paused", async () => {
    const startSession = vi.fn(async () => "session-1");

    render(
      <FocusSession
        startSession={startSession}
        completeSession={vi.fn(async () => undefined)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /iniciar sessão/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /pausar sessão/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /pausar sessão/i }));

    const resetButton = screen.getByRole("button", { name: "Reiniciar" });
    expect(resetButton).toBeDisabled();
    expect(resetButton).toHaveAttribute("aria-describedby", "focus-session-reset-help");
    expect(screen.getByText(/esta sessão já foi registrada/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retomar sessão/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /pausar sessão/i })).toBeInTheDocument());
    expect(startSession).toHaveBeenCalledTimes(1);
  });

  it("keeps a completed session available to retry when persistence fails", async () => {
    vi.useFakeTimers();
    const completeSession = vi.fn()
      .mockRejectedValueOnce(new Error("Falha temporária"))
      .mockResolvedValueOnce(undefined);

    render(
      <FocusSession
        startSession={vi.fn(async () => "session-1")}
        completeSession={completeSession}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /iniciar sessão/i }));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      vi.setSystemTime(Date.now() + 25 * 60 * 1000);
      vi.advanceTimersByTime(250);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(completeSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Registro pendente")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Falha temporária");
    expect(screen.getByRole("button", { name: /tentar registrar sessão/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /tentar registrar sessão/i }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(completeSession).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Concluída")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
