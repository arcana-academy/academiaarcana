import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FocusSession } from "./FocusSession";

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
});
