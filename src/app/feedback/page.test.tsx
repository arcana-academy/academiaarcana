import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FeedbackPage from "./page";

describe("FeedbackPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("renders an accessible feedback form", () => {
    render(<FeedbackPage />);
    expect(
      screen.getByRole("heading", {
        name: /uma escuta que vira direção/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/feedback/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enviar feedback/i }),
    ).toBeInTheDocument();
  });

  it("offers a login destination after an authentication-required response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Entre na sua conta para enviar feedback." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<FeedbackPage />);
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "Meu comentário." },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Entrar para enviar feedback" })).toHaveAttribute(
        "href",
        "/login",
      );
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Entre na sua conta");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not claim authentication is required for a generic service error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Não foi possível salvar o feedback." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<FeedbackPage />);
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "Meu comentário." },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar o feedback.");
    });
    expect(screen.queryByRole("link", { name: "Entrar para enviar feedback" })).not.toBeInTheDocument();
  });
});
