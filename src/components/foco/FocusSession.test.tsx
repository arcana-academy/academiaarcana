import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FocusSession } from "./FocusSession";

describe("FocusSession", () => {
  it("renders an accessible paused session", () => {
    const onStart = vi.fn().mockResolvedValue({ id: "session-0" });
    const onComplete = vi.fn().mockResolvedValue({});

    render(<FocusSession onStart={onStart} onComplete={onComplete} />);

    expect(screen.getByRole("heading", { name: /25 minutos de foco/i })).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sessão/i })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /progresso da sessão de foco/i })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("registra o início antes de começar a contagem", async () => {
    const onStart = vi.fn().mockResolvedValue({ id: "session-1" });
    const onComplete = vi.fn().mockResolvedValue({});

    render(<FocusSession onStart={onStart} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar sessão" }));

    expect(onStart).toHaveBeenCalledWith(25 * 60);
    expect(await screen.findByRole("button", { name: "Pausar sessão" })).toBeTruthy();
  });

  it("não conclui uma sessão apenas por pausá-la", async () => {
    const onStart = vi.fn().mockResolvedValue({ id: "session-2" });
    const onComplete = vi.fn().mockResolvedValue({});

    render(<FocusSession onStart={onStart} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar sessão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Pausar sessão" }));

    expect(screen.getByText("Pausada")).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
