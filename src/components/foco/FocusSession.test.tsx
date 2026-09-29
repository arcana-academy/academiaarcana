import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { FocusSession } from "./FocusSession";

describe("FocusSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders an accessible paused focus session", async () => {
    render(<FocusSession />);

    expect(screen.getByRole("heading", { name: "25 minutos de foco" })).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar foco" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /progresso da foco/i })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    await waitFor(() => {
      expect(window.localStorage.getItem("academia-arcana.focus-session.v1")).not.toBeNull();
    });
  });

  it("recovers a persisted paused break", async () => {
    window.localStorage.setItem(
      "academia-arcana.focus-session.v1",
      JSON.stringify({
        mode: "break",
        remaining: 120,
        running: false,
        deadline: null,
        completedFocusSessions: 2,
      }),
    );

    render(<FocusSession />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "5 minutos de pausa" })).toBeInTheDocument();
      expect(screen.getByText("02:00")).toBeInTheDocument();
      expect(screen.getByText("Sessões de foco concluídas neste ciclo: 2.")).toBeInTheDocument();
    });
  });

  it("switches to the break without pretending that a focus session was completed when skipped", () => {
    render(<FocusSession />);

    fireEvent.click(screen.getByRole("button", { name: "Ir para pausa" }));

    expect(screen.getByRole("heading", { name: "5 minutos de pausa" })).toBeInTheDocument();
    expect(screen.getByText("Sessões de foco concluídas neste ciclo: 1.")).toBeInTheDocument();
  });
});
