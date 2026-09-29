import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FocusSession } from "./FocusSession";

describe("FocusSession", () => {
  it("renders an accessible paused session", () => {
    render(<FocusSession />);

    expect(screen.getByRole("heading", { name: /25 minutos de foco/i })).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sessão/i })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /progresso da sessão de foco/i })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("keeps elapsed time accurate when the browser timer is throttled", () => {
    vi.useFakeTimers();
    try {
      render(<FocusSession />);
      fireEvent.click(screen.getByRole("button", { name: /iniciar sessão/i }));

      vi.advanceTimersByTime(90_000);

      expect(screen.getByText("23:30")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6");
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves the remaining time when paused and resumes from it", () => {
    vi.useFakeTimers();
    try {
      render(<FocusSession />);
      fireEvent.click(screen.getByRole("button", { name: /iniciar sessão/i }));
      vi.advanceTimersByTime(5_000);

      fireEvent.click(screen.getByRole("button", { name: /pausar sessão/i }));
      expect(screen.getByText("24:55")).toBeInTheDocument();
      expect(screen.getByText("Pausada")).toBeInTheDocument();

      vi.advanceTimersByTime(30_000);
      expect(screen.getByText("24:55")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /iniciar sessão/i }));
      vi.advanceTimersByTime(5_000);

      expect(screen.getByText("24:50")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("allows a completed session to be restarted", () => {
    vi.useFakeTimers();
    try {
      render(<FocusSession />);
      fireEvent.click(screen.getByRole("button", { name: /iniciar sessão/i }));
      vi.advanceTimersByTime(25 * 60 * 1_000);

      expect(screen.getByText("00:00")).toBeInTheDocument();
      expect(screen.getByText("Concluída")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reiniciar sessão/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /reiniciar sessão/i }));

      expect(screen.getByText("25:00")).toBeInTheDocument();
      expect(screen.getByText("Em andamento")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /pausar sessão/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
